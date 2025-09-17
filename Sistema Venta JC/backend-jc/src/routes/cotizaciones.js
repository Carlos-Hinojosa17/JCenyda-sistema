const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const supabase = require('../config/database');

// Obtener todas las cotizaciones
router.get('/', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cotizaciones')
            .select('*')
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error('❌ Error al obtener cotizaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener cotizaciones',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || [],
            count: data ? data.length : 0
        });

    } catch (error) {
        console.error('❌ Error inesperado al obtener cotizaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener cotización por ID
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener cotización principal
        const { data: cotizacion, error: errorCotizacion } = await supabase
            .from('cotizaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (errorCotizacion) {
            console.error('❌ Error al obtener cotización:', errorCotizacion);
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada',
                error: errorCotizacion.message
            });
        }

        // Obtener detalle de productos
        const { data: detalle, error: errorDetalle } = await supabase
            .from('cotizaciones_detalle')
            .select('*')
            .eq('cotizacion_id', id);

        if (errorDetalle) {
            console.error('❌ Error al obtener detalle de cotización:', errorDetalle);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de cotización',
                error: errorDetalle.message
            });
        }

        res.json({
            success: true,
            data: {
                ...cotizacion,
                items: detalle || []
            }
        });

    } catch (error) {
        console.error('❌ Error inesperado al obtener cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Crear nueva cotización
router.post('/', protect, async (req, res) => {
    try {
        const {
            cliente_id,
            cliente_nombre,
            cliente_documento,
            metodo_pago,
            codigo_operacion,
            ultimos_digitos,
            comision_tarjeta,
            es_adelanto,
            monto_adelanto,
            saldo_pendiente,
            tipo_precio,
            es_envio_encomienda,
            empresa_encomienda,
            destino_encomienda,
            es_envio_motorizado,
            nombre_motorizado,
            placa_moto,
            total_items,
            total,
            total_con_comision,
            observaciones,
            items
        } = req.body;

        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Los items de la cotización son requeridos'
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El total debe ser mayor a 0'
            });
        }

        // Iniciar transacción - Crear cotización principal
        const { data: nuevaCotizacion, error: errorCotizacion } = await supabase
            .from('cotizaciones')
            .insert({
                cliente_id: cliente_id || null,
                cliente_nombre: cliente_nombre || null,
                cliente_documento: cliente_documento || null,
                metodo_pago: metodo_pago || 'efectivo',
                codigo_operacion: codigo_operacion || null,
                ultimos_digitos: ultimos_digitos || null,
                comision_tarjeta: comision_tarjeta || 0,
                es_adelanto: es_adelanto || false,
                monto_adelanto: monto_adelanto || null,
                saldo_pendiente: saldo_pendiente || null,
                tipo_precio: tipo_precio || 'general',
                es_envio_encomienda: es_envio_encomienda || false,
                empresa_encomienda: empresa_encomienda || null,
                destino_encomienda: destino_encomienda || null,
                es_envio_motorizado: es_envio_motorizado || false,
                nombre_motorizado: nombre_motorizado || null,
                placa_moto: placa_moto || null,
                total_items: total_items || 0,
                total: total,
                total_con_comision: total_con_comision || total,
                estado: 'pendiente',
                observaciones: observaciones || null,
                creado_por: req.user.id
            })
            .select()
            .single();

        if (errorCotizacion) {
            console.error('❌ Error al crear cotización:', errorCotizacion);
            return res.status(500).json({
                success: false,
                message: 'Error al crear cotización',
                error: errorCotizacion.message
            });
        }

        // Crear detalle de productos
        const itemsParaInsertar = items.map(item => ({
            cotizacion_id: nuevaCotizacion.id,
            producto_id: item.producto_id,
            producto_nombre: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
        }));

        const { error: errorDetalle } = await supabase
            .from('cotizaciones_detalle')
            .insert(itemsParaInsertar);

        if (errorDetalle) {
            console.error('❌ Error al crear detalle de cotización:', errorDetalle);
            
            // Rollback: eliminar cotización si falla el detalle
            await supabase
                .from('cotizaciones')
                .delete()
                .eq('id', nuevaCotizacion.id);

            return res.status(500).json({
                success: false,
                message: 'Error al crear detalle de cotización',
                error: errorDetalle.message
            });
        }

        console.log('✅ Cotización creada exitosamente:', nuevaCotizacion.id);
        
        res.status(201).json({
            success: true,
            message: 'Cotización creada exitosamente',
            data: nuevaCotizacion
        });

    } catch (error) {
        console.error('❌ Error inesperado al crear cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Actualizar cotización
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Eliminar campos que no deben ser actualizados
        delete updateData.id;
        delete updateData.fecha_creacion;
        delete updateData.creado_por;

        const { data, error } = await supabase
            .from('cotizaciones')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Error al actualizar cotización:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar cotización',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Cotización actualizada exitosamente',
            data: data
        });

    } catch (error) {
        console.error('❌ Error inesperado al actualizar cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Reemplazar detalle de una cotización y actualizar totales
router.put('/:id/detalle', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { items, total, total_items, total_con_comision } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Los items de la cotización son requeridos' });
        }

        // Verificar que la cotización exista
        const { data: cotizacion, error: errorCot } = await supabase
            .from('cotizaciones')
            .select('id')
            .eq('id', id)
            .single();

        if (errorCot || !cotizacion) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }

        // Eliminar detalle existente
        const { error: errorDelete } = await supabase
            .from('cotizaciones_detalle')
            .delete()
            .eq('cotizacion_id', id);

        if (errorDelete) {
            console.error('❌ Error al eliminar detalle anterior:', errorDelete);
            return res.status(500).json({ success: false, message: 'Error al reemplazar detalle de cotización' });
        }

        // Insertar nuevo detalle
        const itemsParaInsertar = items.map(item => ({
            cotizacion_id: id,
            producto_id: item.producto_id,
            producto_nombre: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
        }));

        const { error: errorInsert } = await supabase
            .from('cotizaciones_detalle')
            .insert(itemsParaInsertar);

        if (errorInsert) {
            console.error('❌ Error al insertar nuevo detalle:', errorInsert);
            return res.status(500).json({ success: false, message: 'Error al insertar nuevo detalle de cotización' });
        }

        // Actualizar totales en la cotización si vienen
        const updatePayload = {};
        if (total !== undefined) updatePayload.total = total;
        if (total_items !== undefined) updatePayload.total_items = total_items;
        if (total_con_comision !== undefined) updatePayload.total_con_comision = total_con_comision;
        updatePayload.fecha_actualizacion = new Date().toISOString();

        if (Object.keys(updatePayload).length > 0) {
            const { error: errorUpdate } = await supabase
                .from('cotizaciones')
                .update(updatePayload)
                .eq('id', id);

            if (errorUpdate) {
                console.error('❌ Error al actualizar totales de cotización:', errorUpdate);
                return res.status(500).json({ success: false, message: 'Error al actualizar totales de cotización' });
            }
        }

        res.json({ success: true, message: 'Detalle de cotización actualizado correctamente' });

    } catch (error) {
        console.error('❌ Error inesperado al reemplazar detalle de cotización:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});

// Eliminar cotización
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la cotización existe
        const { data: cotizacion, error: errorVerificacion } = await supabase
            .from('cotizaciones')
            .select('id, estado')
            .eq('id', id)
            .single();

        if (errorVerificacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        // No permitir eliminar cotizaciones convertidas a venta
        if (cotizacion.estado === 'convertida_venta') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una cotización que ya fue convertida a venta'
            });
        }

        // Eliminar cotización (el detalle se elimina automáticamente por CASCADE)
        const { error } = await supabase
            .from('cotizaciones')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Error al eliminar cotización:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar cotización',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Cotización eliminada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error inesperado al eliminar cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Convertir cotización a venta
router.post('/:id/convertir-venta', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener cotización completa
        const { data: cotizacion, error: errorCotizacion } = await supabase
            .from('cotizaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (errorCotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        if (cotizacion.estado === 'convertida_venta') {
            return res.status(400).json({
                success: false,
                message: 'Esta cotización ya fue convertida a venta'
            });
        }

        // Obtener detalle de productos
        const { data: detalle, error: errorDetalle } = await supabase
            .from('cotizaciones_detalle')
            .select('*')
            .eq('cotizacion_id', id.toString());

        if (errorDetalle) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de cotización'
            });
        }

        // Crear venta basada en la cotización
        const ventaData = {
            cliente_id: cotizacion.cliente_id,
            metodo_pago: cotizacion.metodo_pago,
            tipo_precio: cotizacion.tipo_precio,
            codigo_operacion: cotizacion.codigo_operacion,
            ultimos_digitos: cotizacion.ultimos_digitos,
            comision_tarjeta: cotizacion.comision_tarjeta,
            es_adelanto: cotizacion.es_adelanto,
            monto_adelanto: cotizacion.monto_adelanto,
            saldo_pendiente: cotizacion.saldo_pendiente,
            es_envio_encomienda: cotizacion.es_envio_encomienda,
            empresa_encomienda: cotizacion.empresa_encomienda,
            destino_encomienda: cotizacion.destino_encomienda,
            es_envio_motorizado: cotizacion.es_envio_motorizado,
            nombre_motorizado: cotizacion.nombre_motorizado,
            placa_moto: cotizacion.placa_moto,
            total: cotizacion.total,
            fecha: new Date().toISOString(),
            items: detalle.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal
            }))
        };

        // Aquí llamarías a tu endpoint de ventas para crear la venta
        // Por ahora solo actualizamos el estado de la cotización
        const { error: errorActualizar } = await supabase
            .from('cotizaciones')
            .update({ estado: 'convertida_venta' })
            .eq('id', id);

        if (errorActualizar) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar estado de cotización'
            });
        }

        res.json({
            success: true,
            message: 'Cotización convertida a venta exitosamente',
            data: { cotizacion_id: id, venta_data: ventaData }
        });

    } catch (error) {
        console.error('❌ Error inesperado al convertir cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener estadísticas de cotizaciones
router.get('/estadisticas/resumen', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cotizaciones')
            .select('estado, total');

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }

        const estadisticas = {
            total_cotizaciones: data.length,
            pendientes: data.filter(c => c.estado === 'pendiente').length,
            aprobadas: data.filter(c => c.estado === 'aprobada').length,
            convertidas: data.filter(c => c.estado === 'convertida_venta').length,
            valor_total: data.reduce((sum, c) => sum + parseFloat(c.total || 0), 0)
        };

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener detalle completo de cotización con productos
router.get('/:id/detalle', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener cotización principal
        const { data: cotizacion, error: errorCotizacion } = await supabase
            .from('cotizaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (errorCotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        // Obtener detalle de productos con información completa
        const { data: detalle, error: errorDetalle } = await supabase
            .from('cotizaciones_detalle')
            .select(`
                id,
                producto_id,
                producto_nombre,
                cantidad,
                precio_unitario,
                subtotal,
                fecha_creacion
            `)
            .eq('cotizacion_id', id.toString())
            .order('id');

        if (errorDetalle) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de cotización'
            });
        }

        // Obtener información adicional de productos
        const productosIds = detalle.map(item => parseInt(item.producto_id)).filter(id => !isNaN(id));
        let productosInfo = [];
        
        if (productosIds.length > 0) {
            const { data: productos, error: errorProductos } = await supabase
                .from('producto')
                .select('id, codigo, descripcion, stock, precio_general, precio_especial, precio_por_mayor')
                .in('id', productosIds);

            if (!errorProductos) {
                productosInfo = productos;
            }
        }

        // Combinar información
        const detalleCompleto = detalle.map(item => {
            const producto = productosInfo.find(p => p.id === parseInt(item.producto_id));
            return {
                ...item,
                producto_codigo: producto?.codigo || 'N/A',
                producto_info: producto || null
            };
        });

        res.json({
            success: true,
            data: {
                cotizacion: cotizacion,
                productos: detalleCompleto, // Cambio 'detalle' por 'productos' para que coincida con el frontend
                resumen: {
                    total_items: detalle.length,
                    cantidad_total: detalle.reduce((sum, item) => sum + parseInt(item.cantidad), 0),
                    total_productos: detalle.reduce((sum, item) => sum + parseFloat(item.subtotal), 0),
                    total: parseFloat(cotizacion.total),
                    total_con_comision: parseFloat(cotizacion.total_con_comision)
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener detalle completo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Preparar datos para conversión a venta
router.get('/:id/preparar-venta', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la cotización existe y está pendiente
        const { data: cotizacion, error: errorCotizacion } = await supabase
            .from('cotizaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (errorCotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        if (cotizacion.estado === 'convertida_venta') {
            return res.status(400).json({
                success: false,
                message: 'Esta cotización ya fue convertida a venta'
            });
        }

        // Obtener detalle de productos
        const { data: detalle, error: errorDetalle } = await supabase
            .from('cotizaciones_detalle')
            .select('*')
            .eq('cotizacion_id', id.toString())
            .order('id');

        if (errorDetalle) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de cotización'
            });
        }

        // Verificar stock de productos
        const productosIds = detalle.map(item => parseInt(item.producto_id)).filter(id => !isNaN(id));
        const { data: productos, error: errorProductos } = await supabase
            .from('producto')
            .select('id, codigo, descripcion, stock')
            .in('id', productosIds);

        if (errorProductos) {
            return res.status(500).json({
                success: false,
                message: 'Error al verificar stock de productos'
            });
        }

        // Verificar disponibilidad de stock
        const alertasStock = [];
        detalle.forEach(item => {
            const producto = productos.find(p => p.id === parseInt(item.producto_id));
            if (producto && parseInt(producto.stock) < parseInt(item.cantidad)) {
                alertasStock.push({
                    producto_id: item.producto_id,
                    producto_nombre: item.producto_nombre,
                    cantidad_requerida: parseInt(item.cantidad),
                    stock_actual: parseInt(producto.stock),
                    faltante: parseInt(item.cantidad) - parseInt(producto.stock)
                });
            }
        });

        // Preparar datos para la venta
        const datosVenta = {
            // Información del cliente
            cliente_id: cotizacion.cliente_id,
            cliente_nombre: cotizacion.cliente_nombre,
            cliente_documento: cotizacion.cliente_documento,
            
            // Método de pago
            metodo_pago: cotizacion.metodo_pago,
            codigo_operacion: cotizacion.codigo_operacion,
            ultimos_digitos: cotizacion.ultimos_digitos,
            comision_tarjeta: cotizacion.comision_tarjeta,
            
            // Adelanto
            es_adelanto: cotizacion.es_adelanto,
            monto_adelanto: cotizacion.monto_adelanto,
            saldo_pendiente: cotizacion.saldo_pendiente,
            
            // Tipo de precio
            tipo_precio: cotizacion.tipo_precio,
            
            // Envío
            es_envio_encomienda: cotizacion.es_envio_encomienda,
            empresa_encomienda: cotizacion.empresa_encomienda,
            destino_encomienda: cotizacion.destino_encomienda,
            es_envio_motorizado: cotizacion.es_envio_motorizado,
            nombre_motorizado: cotizacion.nombre_motorizado,
            placa_moto: cotizacion.placa_moto,
            
            // Totales
            total: cotizacion.total,
            total_con_comision: cotizacion.total_con_comision,
            
            // Items
            items: detalle.map(item => ({
                producto_id: item.producto_id,
                producto_nombre: item.producto_nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal
            })),
            
            // Metadata
            cotizacion_origen_id: cotizacion.id,
            fecha_cotizacion: cotizacion.fecha_creacion,
            observaciones_cotizacion: cotizacion.observaciones
        };

        res.json({
            success: true,
            data: {
                cotizacion_id: id,
                puede_convertir: alertasStock.length === 0,
                alertas_stock: alertasStock,
                datos_venta: datosVenta
            },
            message: alertasStock.length > 0 
                ? `Hay ${alertasStock.length} productos con stock insuficiente`
                : 'Cotización lista para convertir a venta'
        });

    } catch (error) {
        console.error('❌ Error al preparar venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Convertir cotización a venta (mejorado)
router.post('/:id/convertir-venta', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { forzar_conversion = false } = req.body;

        // Obtener datos preparados para la venta
        const preparacionResponse = await fetch(`http://localhost:5000/api/cotizaciones/${id}/preparar-venta`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        if (!preparacionResponse.ok) {
            return res.status(500).json({
                success: false,
                message: 'Error al preparar datos de venta'
            });
        }

        const preparacion = await preparacionResponse.json();
        
        if (!preparacion.success) {
            return res.status(500).json({
                success: false,
                message: preparacion.message
            });
        }

        // Verificar si se puede convertir
        if (!preparacion.data.puede_convertir && !forzar_conversion) {
            return res.status(400).json({
                success: false,
                message: 'Hay productos con stock insuficiente. Use forzar_conversion=true para proceder de todos modos.',
                alertas_stock: preparacion.data.alertas_stock
            });
        }

        // Aquí se llamaría al endpoint de ventas para crear la venta
        // Por ahora solo actualizamos el estado de la cotización
        const { error: errorActualizar } = await supabase
            .from('cotizaciones')
            .update({ 
                estado: 'convertida_venta',
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (errorActualizar) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar estado de cotización'
            });
        }

        console.log(`✅ Cotización ${id} convertida a venta por usuario ${req.user.id}`);

        res.json({
            success: true,
            message: 'Cotización convertida a venta exitosamente',
            data: {
                cotizacion_id: id,
                datos_venta: preparacion.data.datos_venta,
                alertas_procesadas: preparacion.data.alertas_stock
            }
        });

    } catch (error) {
        console.error('❌ Error al convertir cotización a venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;