import React, { useState, useEffect } from 'react';
import { productService, salesService, clientService, quotationService, authService } from '../services/apiServices';

// Componente de error boundary para capturar errores
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ Error en Venta component:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container-fluid p-4">
                    <div className="alert alert-danger">
                        <h4>❌ Error en la página de Ventas</h4>
                        <p>Ha ocurrido un error inesperado. Por favor, recarga la página.</p>
                        <details>
                            <summary>Detalles del error</summary>
                            <pre>{this.state.error?.toString()}</pre>
                        </details>
                        <button 
                            className="btn btn-primary mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function VentaContent() {
    console.log('🚀 Venta component loading...');
    
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [tipoPrecio, setTipoPrecio] = useState('general'); // general, especial, por_mayor
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showComprobante, setShowComprobante] = useState(false);
    const [ultimaVenta, setUltimaVenta] = useState(null);
    const [editandoPrecio, setEditandoPrecio] = useState(null); // ID del producto cuyo precio se está editando
    const [precioTemporal, setPrecioTemporal] = useState('');
    
    // Estados para métodos de pago avanzados
    const [codigoOperacion, setCodigoOperacion] = useState(''); // Para Yape/Plin
    const [ultimosDigitos, setUltimosDigitos] = useState(''); // Para transferencia
    const [comisionTarjeta, setComisionTarjeta] = useState(0); // 5% para tarjeta
    
    // Estados para adelantos
    const [esAdelanto, setEsAdelanto] = useState(false);
    const [montoAdelanto, setMontoAdelanto] = useState(0);
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    
    // Estados para información de envío
    const [esEnvioEncomienda, setEsEnvioEncomienda] = useState(false);
    const [empresaEncomienda, setEmpresaEncomienda] = useState('');
    const [destinoEncomienda, setDestinoEncomienda] = useState('');
    const [esEnvioMotorizado, setEsEnvioMotorizado] = useState(false);
    const [nombreMotorizado, setNombreMotorizado] = useState('');
    const [placaMoto, setPlacaMoto] = useState('');

    useEffect(() => {
        console.log('🔄 useEffect: Cargando datos iniciales...');
        const loadData = async () => {
            try {
                await loadProducts();
                await loadClients();
            } catch (err) {
                console.error('❌ Error en loadData:', err);
                setError('Error al cargar datos iniciales');
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        console.log('💰 useEffect: Calculando total...', carrito.length);
        const newTotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        setTotal(newTotal);
    }, [carrito, tipoPrecio]);

    // useEffect para cargar datos de cotización si viene desde página de cotizaciones
    useEffect(() => {
        const cargarDatosCotizacion = () => {
            const datosCotizacion = localStorage.getItem('cotizacion_para_venta');
            if (datosCotizacion) {
                try {
                    const datos = JSON.parse(datosCotizacion);
                    console.log('📄 Cargando datos de cotización:', datos);
                    
                    // Cargar datos del cliente
                    if (datos.cliente?.nombre) {
                        setClienteSeleccionado({
                            id: datos.cliente.id,
                            nombre: datos.cliente.nombre,
                            documento: datos.cliente.documento
                        });
                    }
                    
                    // Cargar método de pago y configuraciones
                    setMetodoPago(datos.metodo_pago || 'efectivo');
                    setTipoPrecio(datos.tipo_precio || 'general');
                    setCodigoOperacion(datos.codigo_operacion || '');
                    setUltimosDigitos(datos.ultimos_digitos || '');
                    
                    // Configurar adelanto si existe
                    if (datos.es_adelanto) {
                        setEsAdelanto(true);
                        setMontoAdelanto(datos.monto_adelanto || 0);
                        setSaldoPendiente(datos.saldo_pendiente || 0);
                    }
                    
                    // Configurar envío
                    if (datos.es_envio_encomienda) {
                        setEsEnvioEncomienda(true);
                        setEmpresaEncomienda(datos.empresa_encomienda || '');
                        setDestinoEncomienda(datos.destino_encomienda || '');
                    }
                    
                    if (datos.es_envio_motorizado) {
                        setEsEnvioMotorizado(true);
                        setNombreMotorizado(datos.nombre_motorizado || '');
                        setPlacaMoto(datos.placa_moto || '');
                    }
                    
                    // Cargar productos al carrito
                    if (datos.productos && datos.productos.length > 0) {
                        const productosCarrito = datos.productos.map(producto => ({
                            id: parseInt(producto.producto_id),
                            nombre: producto.producto_nombre,
                            precio: parseFloat(producto.precio_unitario),
                            cantidad: parseInt(producto.cantidad),
                            codigo: producto.producto_codigo || 'N/A',
                            stock: 999, // Se actualizará cuando se carguen los productos completos
                            precio_general: parseFloat(producto.precio_unitario),
                            precio_especial: parseFloat(producto.precio_unitario),
                            precio_por_mayor: parseFloat(producto.precio_unitario)
                        }));
                        
                        setCarrito(productosCarrito);
                    }
                    
                    // Limpiar datos de localStorage después de cargar
                    localStorage.removeItem('cotizacion_para_venta');
                    
                    // Mostrar mensaje informativo
                    alert(`✅ Datos de la cotización COT-${datos.cotizacion_id} cargados exitosamente.\nPuede modificar los productos y proceder con la venta.`);
                    
                } catch (error) {
                    console.error('❌ Error al cargar datos de cotización:', error);
                    alert('Error al cargar los datos de la cotización');
                    localStorage.removeItem('cotizacion_para_venta');
                }
            }
        };
        
        cargarDatosCotizacion();
    }, []); // Solo ejecutar una vez al cargar el componente

    const loadProducts = async () => {
        try {
            console.log('📦 Cargando productos...');
            const data = await productService.getAll();
            console.log('📦 Productos cargados:', data);
            setProductos(data.filter(p => p.estado)); // Solo productos activos
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            setError('Error al cargar productos: ' + (error.message || 'Error desconocido'));
        }
    };

    const loadClients = async () => {
        try {
            console.log('👥 Cargando clientes...');
            const data = await clientService.getAll();
            console.log('👥 Clientes cargados:', data);
            setClientes(data.filter(c => c.estado)); // Solo clientes activos
        } catch (error) {
            console.error('❌ Error al cargar clientes:', error);
            // No mostramos error de clientes ya que no es crítico
        }
    };

    // Obtener precio según el tipo seleccionado
    const obtenerPrecio = (producto) => {
        switch (tipoPrecio) {
            case 'especial':
                return producto.pre_especial || producto.pre_general || 0;
            case 'por_mayor':
                return producto.pre_por_mayor || producto.pre_general || 0;
            case 'general':
            default:
                return producto.pre_general || 0;
        }
    };

    const filteredProducts = productos.filter(product =>
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (product) => {
        // Validar stock disponible
        const cantidadEnCarrito = carrito.find(item => item.id === product.id)?.cantidad || 0;
        if (cantidadEnCarrito >= (product.stock || 0)) {
            alert('Stock insuficiente para este producto');
            return;
        }

        const precio = obtenerPrecio(product);
        const existingItem = carrito.find(item => item.id === product.id);
        
        if (existingItem) {
            setCarrito(carrito.map(item =>
                item.id === product.id
                    ? { ...item, cantidad: item.cantidad + 1, precio: precio }
                    : item
            ));
        } else {
            setCarrito([...carrito, { 
                ...product, 
                cantidad: 1, 
                precio: precio,
                nombre: product.descripcion // Para compatibilidad
            }]);
        }
    };

    const removeFromCart = (productId) => {
        setCarrito(carrito.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            // Validar stock disponible
            const producto = productos.find(p => p.id === productId);
            if (producto && newQuantity > (producto.stock || 0)) {
                alert(`Stock máximo disponible: ${producto.stock || 0}`);
                return;
            }

            setCarrito(carrito.map(item =>
                item.id === productId
                    ? { ...item, cantidad: newQuantity, precio: obtenerPrecio(producto || item) }
                    : item
            ));
        }
    };

    // Funciones para editar precio en el carrito
    const iniciarEdicionPrecio = (productId, precioActual) => {
        setEditandoPrecio(productId);
        setPrecioTemporal(precioActual.toString());
    };

    const cancelarEdicionPrecio = () => {
        setEditandoPrecio(null);
        setPrecioTemporal('');
    };

    const confirmarNuevoPrecio = (productId) => {
        const nuevoPrecio = parseFloat(precioTemporal);
        
        // Validar que el precio sea válido
        if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
            alert('Por favor ingrese un precio válido mayor a 0');
            return;
        }

        // Confirmar el cambio si es una reducción significativa
        const itemActual = carrito.find(item => item.id === productId);
        if (itemActual && nuevoPrecio < itemActual.precio * 0.5) {
            const confirmar = window.confirm(
                `¿Está seguro de aplicar este precio?\n` +
                `Precio original: $${itemActual.precio.toLocaleString()}\n` +
                `Nuevo precio: $${nuevoPrecio.toLocaleString()}\n` +
                `Esto representa un descuento del ${Math.round((1 - nuevoPrecio / itemActual.precio) * 100)}%`
            );
            if (!confirmar) return;
        }

        // Actualizar el precio en el carrito
        setCarrito(carrito.map(item =>
            item.id === productId
                ? { ...item, precio: nuevoPrecio }
                : item
        ));

        // Limpiar estado de edición
        setEditandoPrecio(null);
        setPrecioTemporal('');
    };

    const aplicarDescuento = (productId, porcentaje) => {
        const item = carrito.find(item => item.id === productId);
        if (item) {
            const precioOriginal = obtenerPrecio(item);
            const nuevoPrecio = precioOriginal * (1 - porcentaje / 100);
            
            setCarrito(carrito.map(cartItem =>
                cartItem.id === productId
                    ? { ...cartItem, precio: Math.round(nuevoPrecio) }
                    : cartItem
            ));
        }
    };

    // Funciones para manejar opciones de envío
    const handleEnvioEncomiendaChange = (checked) => {
        setEsEnvioEncomienda(checked);
        if (!checked) {
            // Limpiar campos de encomienda cuando se deshabilita
            setEmpresaEncomienda('');
            setDestinoEncomienda('');
        }
        // Si se activa encomienda, desactivar motorizado
        if (checked && esEnvioMotorizado) {
            setEsEnvioMotorizado(false);
            setNombreMotorizado('');
            setPlacaMoto('');
        }
    };

    const handleEnvioMotorizadoChange = (checked) => {
        setEsEnvioMotorizado(checked);
        if (!checked) {
            // Limpiar campos de motorizado cuando se deshabilita
            setNombreMotorizado('');
            setPlacaMoto('');
        }
        // Si se activa motorizado, desactivar encomienda
        if (checked && esEnvioEncomienda) {
            setEsEnvioEncomienda(false);
            setEmpresaEncomienda('');
            setDestinoEncomienda('');
        }
    };

    // Función para limpiar todos los campos
    const limpiarCampos = () => {
        setCarrito([]);
        setTotal(0);
        setClienteSeleccionado(null);
        setMetodoPago('efectivo');
        setTipoPrecio('general');
        setSearchTerm('');
        setEsEnvioEncomienda(false);
        setEmpresaEncomienda('');
        setDestinoEncomienda('');
        setEsEnvioMotorizado(false);
        setNombreMotorizado('');
        setPlacaMoto('');
        setEditandoPrecio(null);
        setPrecioTemporal('');
        setError('');
        // Limpiar campos de pago
        setCodigoOperacion('');
        setUltimosDigitos('');
        setComisionTarjeta(0);
        setEsAdelanto(false);
        setMontoAdelanto(0);
        setSaldoPendiente(0);
        console.log('✨ Campos limpiados exitosamente');
    };

    // Función para calcular comisión de tarjeta (5%)
    const calcularComisionTarjeta = (monto) => {
        return monto * 0.05;
    };

    // Función para manejar cambio de método de pago
    const handleMetodoPagoChange = (nuevoMetodo) => {
        setMetodoPago(nuevoMetodo);
        
        // Limpiar campos específicos cuando cambia el método
        setCodigoOperacion('');
        setUltimosDigitos('');
        
        // Calcular comisión si es tarjeta
        if (nuevoMetodo === 'tarjeta') {
            const montoParaComision = esAdelanto ? montoAdelanto : total;
            setComisionTarjeta(calcularComisionTarjeta(montoParaComision));
        } else {
            setComisionTarjeta(0);
        }
    };

    // Función para manejar cambio de adelanto
    const handleAdelantoChange = (checked) => {
        setEsAdelanto(checked);
        
        if (!checked) {
            setMontoAdelanto(0);
            setSaldoPendiente(0);
            // Recalcular comisión para el total si es tarjeta
            if (metodoPago === 'tarjeta') {
                setComisionTarjeta(calcularComisionTarjeta(total));
            }
        } else {
            // Si se activa adelanto y hay monto, calcular saldo
            if (montoAdelanto > 0) {
                setSaldoPendiente(total - montoAdelanto);
                // Recalcular comisión para el adelanto si es tarjeta
                if (metodoPago === 'tarjeta') {
                    setComisionTarjeta(calcularComisionTarjeta(montoAdelanto));
                }
            }
        }
    };

    // Función para manejar cambio de monto de adelanto
    const handleMontoAdelantoChange = (nuevoMonto) => {
        const monto = parseFloat(nuevoMonto) || 0;
        
        if (monto > total) {
            alert('El adelanto no puede ser mayor al total');
            return;
        }
        
        setMontoAdelanto(monto);
        setSaldoPendiente(total - monto);
        
        // Recalcular comisión si es tarjeta
        if (metodoPago === 'tarjeta') {
            setComisionTarjeta(calcularComisionTarjeta(monto));
        }
    };

    // Función para procesar cotización
    const procesarCotizacion = async () => {
        if (carrito.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        try {
            setLoading(true);

            // Crear objeto de cotización
            const cotizacion = {
                items: carrito.map(item => ({
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    precio: item.precio,
                    subtotal: item.precio * item.cantidad
                })),
                total_productos: carrito.reduce((sum, item) => sum + item.cantidad, 0),
                total_general: total,
                tipo_precio: tipoPrecio,
                fecha: new Date(),
                cliente: clienteSeleccionado,
                // Información de pago para cotización
                metodo_pago: metodoPago,
                pago: {
                    codigo_operacion: codigoOperacion,
                    ultimos_digitos: ultimosDigitos,
                    comision_tarjeta: comisionTarjeta,
                    es_adelanto: esAdelanto,
                    monto_adelanto: montoAdelanto,
                    saldo_pendiente: saldoPendiente,
                    total_con_comision: metodoPago === 'tarjeta' ? 
                        (esAdelanto ? montoAdelanto + comisionTarjeta : total + comisionTarjeta) : 
                        (esAdelanto ? montoAdelanto : total)
                },
                envio: {
                    esEnvioEncomienda,
                    esEnvioMotorizado,
                    empresaEncomienda,
                    destinoEncomienda,
                    nombreMotorizado,
                    placaMoto
                }
            };

            // Mostrar cotización en consola (o se puede enviar a un endpoint específico)
            console.log('📋 Cotización generada:', cotizacion);
            
            // Crear objeto para mostrar en comprobante
            const cotizacionCompleta = {
                ...cotizacion,
                id: 'COT-' + Date.now(),
                es_cotizacion: true
            };

            setUltimaVenta(cotizacionCompleta);
            setShowComprobante(true);

            alert('Cotización generada exitosamente');
        } catch (error) {
            console.error('❌ Error al generar cotización:', error);
            alert('Error al generar cotización: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    // Función para guardar cotización en el sistema
    const guardarCotizacion = async () => {
        if (!ultimaVenta || !ultimaVenta.es_cotizacion) {
            alert('No hay una cotización válida para guardar');
            return;
        }

        try {
            setLoading(true);

            // Preparar datos de la cotización para el backend
            const cotizacionData = {
                cliente_id: ultimaVenta.cliente?.id || null,
                cliente_nombre: ultimaVenta.cliente?.nombre || null,
                cliente_documento: ultimaVenta.cliente?.documento || null,
                metodo_pago: ultimaVenta.metodo_pago,
                tipo_precio: ultimaVenta.tipo_precio,
                // Información de pago detallada
                codigo_operacion: ultimaVenta.pago?.codigo_operacion || null,
                ultimos_digitos: ultimaVenta.pago?.ultimos_digitos || null,
                comision_tarjeta: ultimaVenta.pago?.comision_tarjeta || 0,
                // Información de adelanto
                es_adelanto: ultimaVenta.pago?.es_adelanto || false,
                monto_adelanto: ultimaVenta.pago?.monto_adelanto || null,
                saldo_pendiente: ultimaVenta.pago?.saldo_pendiente || null,
                // Información de envío
                es_envio_encomienda: ultimaVenta.envio?.esEnvioEncomienda || false,
                empresa_encomienda: ultimaVenta.envio?.empresaEncomienda || null,
                destino_encomienda: ultimaVenta.envio?.destinoEncomienda || null,
                es_envio_motorizado: ultimaVenta.envio?.esEnvioMotorizado || false,
                nombre_motorizado: ultimaVenta.envio?.nombreMotorizado || null,
                placa_moto: ultimaVenta.envio?.placaMoto || null,
                // Items y totales
                items: ultimaVenta.items?.map(item => ({
                    producto_id: item.id,
                    producto_nombre: item.nombre,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    subtotal: item.subtotal
                })) || [],
                total_items: ultimaVenta.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0,
                total: ultimaVenta.total_general || ultimaVenta.total || 0,
                total_con_comision: ultimaVenta.pago?.total_con_comision || ultimaVenta.total || 0,
                fecha_creacion: new Date().toISOString(),
                estado: 'pendiente'
            };

            console.log('💾 Guardando cotización:', cotizacionData);
            const response = await quotationService.create(cotizacionData);

            if (response.success) {
                alert('Cotización guardada exitosamente');
                // Actualizar el ID de la cotización con el ID del servidor
                setUltimaVenta({
                    ...ultimaVenta,
                    id: response.data.id,
                    guardada: true
                });
            } else {
                throw new Error(response.message || 'Error al guardar cotización');
            }
        } catch (error) {
            console.error('❌ Error al guardar cotización:', error);
            alert('Error al guardar cotización: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const processSale = async () => {
        if (carrito.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        setLoading(true);
        try {
            const totalConComision = metodoPago === 'tarjeta' ? 
                (esAdelanto ? montoAdelanto + comisionTarjeta : total + comisionTarjeta) : 
                (esAdelanto ? montoAdelanto : total);

            const currentUser = authService.getCurrentUser();

            const saleData = {
                cliente_id: clienteSeleccionado?.id ?? null,
                usuarios_id: currentUser?.id ?? null,
                metodo_pago: metodoPago,
                tipo_precio: tipoPrecio,
                // Información de pago detallada
                codigo_operacion: (metodoPago === 'yape' || metodoPago === 'plin') ? codigoOperacion : null,
                ultimos_digitos: metodoPago === 'transferencia' ? ultimosDigitos : null,
                comision_tarjeta: metodoPago === 'tarjeta' ? comisionTarjeta : 0,
                // Información de adelanto
                es_adelanto: esAdelanto,
                adelanto: esAdelanto ? montoAdelanto : 0,
                monto_adelanto: esAdelanto ? montoAdelanto : null,
                saldo_pendiente: esAdelanto ? saldoPendiente : null,
                // Información de envío
                es_envio_encomienda: esEnvioEncomienda,
                empresa_encomienda: esEnvioEncomienda ? empresaEncomienda : null,
                destino_encomienda: esEnvioEncomienda ? destinoEncomienda : null,
                es_envio_motorizado: esEnvioMotorizado,
                nombre_motorizado: esEnvioMotorizado ? nombreMotorizado : null,
                placa_moto: esEnvioMotorizado ? placaMoto : null,
                items: carrito.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    subtotal: item.precio * item.cantidad
                })),
                total: total,
                total_con_comision: totalConComision,
                fecha: new Date().toISOString()
            };

            console.log('🛒 Procesando venta:', saleData);
            const response = await salesService.create(saleData);

            // Crear objeto de venta para el comprobante
            const ventaCompleta = {
                ...response.data,
                cliente: clienteSeleccionado,
                items: carrito.map(item => ({
                    ...item,
                    subtotal: item.precio * item.cantidad
                })),
                metodo_pago: metodoPago,
                tipo_precio: tipoPrecio,
                fecha: new Date(),
                // Información de pago detallada
                pago: {
                    codigo_operacion: codigoOperacion,
                    ultimos_digitos: ultimosDigitos,
                    comision_tarjeta: comisionTarjeta,
                    es_adelanto: esAdelanto,
                    monto_adelanto: montoAdelanto,
                    saldo_pendiente: saldoPendiente,
                    total_con_comision: totalConComision
                },
                envio: {
                    esEnvioEncomienda,
                    esEnvioMotorizado,
                    empresaEncomienda,
                    destinoEncomienda,
                    nombreMotorizado,
                    placaMoto
                }
            };

            setUltimaVenta(ventaCompleta);
            setShowComprobante(true);

            // Limpiar carrito y campos de envío
            setCarrito([]);
            setTotal(0);
            setEsEnvioEncomienda(false);
            setEmpresaEncomienda('');
            setDestinoEncomienda('');
            setEsEnvioMotorizado(false);
            setNombreMotorizado('');
            setPlacaMoto('');

            // Recargar productos para actualizar stock
            loadProducts();

            alert('Venta procesada exitosamente');
        } catch (error) {
            console.error('❌ Error al procesar venta:', error);
            alert('Error al procesar la venta: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }

    console.log('🎨 Renderizando Venta component...', {
        productos: productos.length,
        clientes: clientes.length,
        carrito: carrito.length,
        error
    });

    return (
        <div className='container-fluid p-4'>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className='mb-0'>
                    <i className="bi bi-cart3 me-2"></i>
                    Realizar Venta
                </h2>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-outline-info"
                        onClick={() => {loadProducts(); loadClients();}}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                    </button>
                </div>
            </div>
            
            {error && (
                <div className='alert alert-danger d-flex align-items-center' role='alert'>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}

            {/* Configuración de venta */}
            <div className="row mb-3">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">
                                <i className="bi bi-person-check me-2"></i>
                                Cliente e Información de Envío
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <label className="form-label">Cliente</label>
                                    <select 
                                        className="form-select"
                                        value={clienteSeleccionado?.id || ''}
                                        onChange={(e) => {
                                            const cliente = clientes.find(c => c.id === parseInt(e.target.value));
                                            setClienteSeleccionado(cliente || null);
                                        }}
                                    >
                                        <option value="">Cliente general (sin seleccionar)</option>
                                        {clientes.map(cliente => (
                                            <option key={cliente.id} value={cliente.id}>
                                                {cliente.nombre} - {cliente.documento}
                                            </option>
                                        ))}
                                    </select>
                                    {clienteSeleccionado && (
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                <i className="bi bi-telephone me-1"></i>
                                                {clienteSeleccionado.telefono || 'Sin teléfono'}
                                            </small>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6"></div>
                            </div>

                            {/* Opciones de envío */}
                            <div className="mt-3">
                                <h6 className="text-muted mb-2">
                                    <i className="bi bi-truck me-2"></i>
                                    Opciones de Envío
                                </h6>
                                
                                {/* Checkbox para envío por encomienda */}
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="envioEncomienda"
                                        checked={esEnvioEncomienda}
                                        onChange={(e) => handleEnvioEncomiendaChange(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="envioEncomienda">
                                        <i className="bi bi-box-seam me-1"></i>
                                        Envío por Encomienda
                                    </label>
                                </div>

                                {/* Campos de encomienda */}
                                {esEnvioEncomienda && (
                                    <div className="ps-4 mb-3">
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="form-label small">Empresa de Envío</label>
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={empresaEncomienda}
                                                    onChange={(e) => setEmpresaEncomienda(e.target.value)}
                                                >
                                                    <option value="">Seleccionar empresa...</option>
                                                    <option value="shalom">Shalom</option>
                                                    <option value="palomino">Palomino</option>
                                                    <option value="flores">Flores</option>
                                                    <option value="oltursa">Oltursa</option>
                                                    <option value="cruz_del_sur">Cruz del Sur</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">Destino</label>
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={destinoEncomienda}
                                                    onChange={(e) => setDestinoEncomienda(e.target.value)}
                                                >
                                                    <option value="">Seleccionar destino...</option>
                                                    <option value="trujillo">Trujillo</option>
                                                    <option value="ica">Ica</option>
                                                    <option value="piura">Piura</option>
                                                    <option value="chiclayo">Chiclayo</option>
                                                    <option value="arequipa">Arequipa</option>
                                                    <option value="cusco">Cusco</option>
                                                    <option value="huancayo">Huancayo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checkbox para envío por motorizado */}
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="envioMotorizado"
                                        checked={esEnvioMotorizado}
                                        onChange={(e) => handleEnvioMotorizadoChange(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="envioMotorizado">
                                        <i className="bi bi-bicycle me-1"></i>
                                        Envío por Motorizado
                                    </label>
                                </div>

                                {/* Campos de motorizado */}
                                {esEnvioMotorizado && (
                                    <div className="ps-4 mb-3">
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="form-label small">Nombre del Motorizado</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Ej: Juan Pérez"
                                                    value={nombreMotorizado}
                                                    onChange={(e) => setNombreMotorizado(e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">Placa de la Moto</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Ej: ABC-123"
                                                    value={placaMoto}
                                                    onChange={(e) => setPlacaMoto(e.target.value.toUpperCase())}
                                                    style={{textTransform: 'uppercase'}}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Información de envío seleccionado */}
                                {(esEnvioEncomienda || esEnvioMotorizado) && (
                                    <div className="alert alert-info py-2 px-3 small">
                                        <i className="bi bi-info-circle me-1"></i>
                                        {esEnvioEncomienda && (
                                            <span>
                                                Envío por <strong>{empresaEncomienda || 'encomienda'}</strong>
                                                {destinoEncomienda && <> hacia <strong>{destinoEncomienda}</strong></>}
                                            </span>
                                        )}
                                        {esEnvioMotorizado && (
                                            <span>
                                                Envío por motorizado
                                                {nombreMotorizado && <> - <strong>{nombreMotorizado}</strong></>}
                                                {placaMoto && <> (Placa: <strong>{placaMoto}</strong>)</>}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">
                                <i className="bi bi-tags me-2"></i>
                                Tipo de Precio
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="btn-group w-100" role="group">
                                <button
                                    className={`btn ${tipoPrecio === 'general' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setTipoPrecio('general')}
                                >
                                    <i className="bi bi-person me-1"></i>
                                    General
                                </button>
                                <button
                                    className={`btn ${tipoPrecio === 'especial' ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => setTipoPrecio('especial')}
                                >
                                    <i className="bi bi-star me-1"></i>
                                    Especial
                                </button>
                                <button
                                    className={`btn ${tipoPrecio === 'por_mayor' ? 'btn-warning' : 'btn-outline-warning'}`}
                                    onClick={() => setTipoPrecio('por_mayor')}
                                >
                                    <i className="bi bi-boxes me-1"></i>
                                    Por Mayor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className='row'>
                <div className='col-md-7'>
                    <div className='card'>
                        <div className='card-header d-flex justify-content-between align-items-center'>
                            <h5 className="mb-0">
                                <i className="bi bi-shop me-2"></i>
                                Productos Disponibles
                            </h5>
                            <span className="badge bg-primary">
                                {filteredProducts.length} productos
                            </span>
                        </div>
                        <div className='card-body'>
                            <div className='mb-3'>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input 
                                        type='text' 
                                        className='form-control' 
                                        placeholder='Buscar por código o descripción...'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                                {filteredProducts.length === 0 ? (
                                    <div className='text-center text-muted py-4'>
                                        <i className="bi bi-inbox display-4"></i>
                                        <div className="mt-2">No hay productos disponibles</div>
                                    </div>
                                ) : (
                                    filteredProducts.map(product => {
                                        const precio = obtenerPrecio(product);
                                        const cantidadEnCarrito = carrito.find(item => item.id === product.id)?.cantidad || 0;
                                        const stockDisponible = (product.stock || 0) - cantidadEnCarrito;
                                        
                                        return (
                                            <div key={product.id} className='card mb-2 shadow-sm'>
                                                <div className='card-body p-3'>
                                                    <div className='d-flex justify-content-between align-items-start'>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="bi bi-box-seam me-2 text-primary"></i>
                                                                <h6 className='mb-0'>{product.descripcion}</h6>
                                                            </div>
                                                            <div className="mb-2">
                                                                <code className="bg-light px-2 py-1 rounded small">
                                                                    {product.codigo}
                                                                </code>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div>
                                                                    <small className="text-muted">Precio:</small>
                                                                    <div className="fw-bold text-success">
                                                                        ${precio.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <small className="text-muted">Stock:</small>
                                                                    <div className={`fw-bold ${stockDisponible <= 0 ? 'text-danger' : stockDisponible <= 5 ? 'text-warning' : 'text-info'}`}>
                                                                        {stockDisponible}
                                                                        {cantidadEnCarrito > 0 && (
                                                                            <small className="text-muted ms-1">
                                                                                ({cantidadEnCarrito} en carrito)
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="ms-3">
                                                            <button 
                                                                className='btn btn-primary'
                                                                onClick={() => addToCart(product)}
                                                                disabled={stockDisponible <= 0}
                                                                title={stockDisponible <= 0 ? 'Sin stock disponible' : 'Agregar al carrito'}
                                                            >
                                                                <i className='bi bi-plus-lg'></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='col-md-5'>
                    <div className='card'>
                        <div className='card-header d-flex justify-content-between align-items-center'>
                            <h5 className="mb-0">
                                <i className="bi bi-cart3 me-2"></i>
                                Carrito de Compra
                            </h5>
                            <span className="badge bg-success">
                                {carrito.length} artículo{carrito.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className='card-body'>
                            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {carrito.length === 0 ? (
                                    <div className='text-center text-muted py-4'>
                                        <i className="bi bi-cart-x display-4"></i>
                                        <div className="mt-2">Carrito vacío</div>
                                    </div>
                                ) : (
                                    carrito.map(item => {
                                        const subtotal = item.precio * item.cantidad;
                                        return (
                                            <div key={item.id} className='card mb-2 border-light'>
                                                <div className='card-body p-2'>
                                                    <div className='d-flex justify-content-between align-items-start mb-2'>
                                                        <div className="flex-grow-1">
                                                            <h6 className='mb-1'>{item.nombre || item.descripcion}</h6>
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <code className="small bg-light px-1 rounded">
                                                                    {item.codigo}
                                                                </code>
                                                                
                                                                {editandoPrecio === item.id ? (
                                                                    // Modo edición de precio
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <span className="small text-muted">$</span>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control form-control-sm"
                                                                            style={{width: '80px'}}
                                                                            value={precioTemporal}
                                                                            onChange={(e) => setPrecioTemporal(e.target.value)}
                                                                            onKeyPress={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    confirmarNuevoPrecio(item.id);
                                                                                } else if (e.key === 'Escape') {
                                                                                    cancelarEdicionPrecio();
                                                                                }
                                                                            }}
                                                                            autoFocus
                                                                        />
                                                                        <button
                                                                            className="btn btn-sm btn-success"
                                                                            onClick={() => confirmarNuevoPrecio(item.id)}
                                                                            title="Confirmar precio"
                                                                        >
                                                                            <i className="bi bi-check"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-secondary"
                                                                            onClick={cancelarEdicionPrecio}
                                                                            title="Cancelar"
                                                                        >
                                                                            <i className="bi bi-x"></i>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    // Modo visualización normal
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <small className='text-muted'>
                                                                            ${item.precio.toLocaleString()} c/u
                                                                        </small>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => iniciarEdicionPrecio(item.id, item.precio)}
                                                                            title="Editar precio"
                                                                            style={{fontSize: '10px', padding: '2px 4px'}}
                                                                        >
                                                                            <i className="bi bi-pencil"></i>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Botones de descuento rápido */}
                                                            {editandoPrecio !== item.id && (
                                                                <div className="d-flex gap-1 mb-1">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => aplicarDescuento(item.id, 5)}
                                                                        title="Aplicar 5% de descuento"
                                                                        style={{fontSize: '10px', padding: '2px 6px'}}
                                                                    >
                                                                        -5%
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => aplicarDescuento(item.id, 10)}
                                                                        title="Aplicar 10% de descuento"
                                                                        style={{fontSize: '10px', padding: '2px 6px'}}
                                                                    >
                                                                        -10%
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => aplicarDescuento(item.id, 15)}
                                                                        title="Aplicar 15% de descuento"
                                                                        style={{fontSize: '10px', padding: '2px 6px'}}
                                                                    >
                                                                        -15%
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="fw-bold text-success">
                                                                Subtotal: ${subtotal.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            className='btn btn-sm btn-outline-danger'
                                                            onClick={() => removeFromCart(item.id)}
                                                            title="Eliminar del carrito"
                                                        >
                                                            <i className='bi bi-trash'></i>
                                                        </button>
                                                    </div>
                                                    <div className='d-flex align-items-center justify-content-center'>
                                                        <button 
                                                            className='btn btn-sm btn-outline-secondary'
                                                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                                            disabled={item.cantidad <= 1}
                                                        >
                                                            <i className="bi bi-dash"></i>
                                                        </button>
                                                        <span className='mx-3 fw-bold'>{item.cantidad}</span>
                                                        <button 
                                                            className='btn btn-sm btn-outline-secondary'
                                                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                                        >
                                                            <i className="bi bi-plus"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Método de pago */}
                            {carrito.length > 0 && (
                                <div className="border-top pt-3 mt-3">
                                    {/* Checkbox para adelanto */}
                                    <div className="form-check mb-3">
                                        <input 
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={esAdelanto}
                                            onChange={(e) => handleAdelantoChange(e.target.checked)}
                                            id="checkAdelanto"
                                        />
                                        <label className="form-check-label" htmlFor="checkAdelanto">
                                            <i className="bi bi-piggy-bank me-2"></i>
                                            Pago con adelanto
                                        </label>
                                    </div>

                                    {/* Campo de monto de adelanto */}
                                    {esAdelanto && (
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Monto del Adelanto</label>
                                                <input 
                                                    type="number"
                                                    className="form-control"
                                                    value={montoAdelanto}
                                                    onChange={(e) => handleMontoAdelantoChange(e.target.value)}
                                                    min="0"
                                                    max={total}
                                                    step="0.01"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Saldo Pendiente</label>
                                                <input 
                                                    type="text"
                                                    className="form-control bg-light"
                                                    value={`$${saldoPendiente.toLocaleString()}`}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <h6 className="mb-2">
                                        <i className="bi bi-credit-card me-2"></i>
                                        Método de Pago
                                    </h6>
                                    <select 
                                        className="form-select mb-3"
                                        value={metodoPago}
                                        onChange={(e) => handleMetodoPagoChange(e.target.value)}
                                    >
                                        <option value="efectivo">
                                            💵 Efectivo
                                        </option>
                                        <option value="yape">
                                            📱 Yape
                                        </option>
                                        <option value="plin">
                                            💜 Plin
                                        </option>
                                        <option value="tarjeta">
                                            💳 Tarjeta (+5% comisión)
                                        </option>
                                        <option value="transferencia">
                                            🏦 Transferencia
                                        </option>
                                    </select>

                                    {/* Campos específicos por método de pago */}
                                    {(metodoPago === 'yape' || metodoPago === 'plin') && (
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Código de Operación {metodoPago === 'yape' ? 'Yape' : 'Plin'}
                                            </label>
                                            <input 
                                                type="text"
                                                className="form-control"
                                                value={codigoOperacion}
                                                onChange={(e) => setCodigoOperacion(e.target.value)}
                                                placeholder="Ingrese el código de operación"
                                                maxLength="20"
                                            />
                                        </div>
                                    )}

                                    {metodoPago === 'transferencia' && (
                                        <div className="mb-3">
                                            <label className="form-label">Últimos 4 dígitos de la transferencia</label>
                                            <input 
                                                type="text"
                                                className="form-control"
                                                value={ultimosDigitos}
                                                onChange={(e) => setUltimosDigitos(e.target.value)}
                                                placeholder="Ej: 1234"
                                                maxLength="4"
                                                pattern="[0-9]*"
                                            />
                                        </div>
                                    )}

                                    {metodoPago === 'tarjeta' && comisionTarjeta > 0 && (
                                        <div className="alert alert-info py-2 mb-3">
                                            <i className="bi bi-info-circle me-2"></i>
                                            <strong>Comisión por tarjeta (5%):</strong> ${comisionTarjeta.toLocaleString()}<br/>
                                            <strong>Total a pagar:</strong> ${(esAdelanto ? montoAdelanto + comisionTarjeta : total + comisionTarjeta).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botón Limpiar */}
                            <div className="mb-3">
                                <button 
                                    className="btn btn-outline-secondary w-100"
                                    onClick={limpiarCampos}
                                    type="button"
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    Limpiar Campos
                                </button>
                            </div>

                            {/* Total y botones de acción */}
                            <div className='border-top pt-3'>
                                <div className='d-flex justify-content-between align-items-center mb-3'>
                                    <h5 className="mb-0">Total:</h5>
                                    <h4 className="mb-0 text-success">${total.toLocaleString()}</h4>
                                </div>
                                
                                {/* Botón Procesar Venta */}
                                <button 
                                    className='btn btn-success w-100 mb-2' 
                                    onClick={processSale}
                                    disabled={carrito.length === 0 || loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className='spinner-border spinner-border-sm me-2'></span>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Procesar Venta
                                        </>
                                    )}
                                </button>

                                {/* Botón Cotizar */}
                                <button 
                                    className="btn btn-outline-primary w-100"
                                    onClick={procesarCotizacion}
                                    disabled={carrito.length === 0 || loading}
                                >
                                    <i className="bi bi-file-text me-2"></i>
                                    Generar Cotización
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Comprobante */}
            {showComprobante && ultimaVenta && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className={`modal-header ${ultimaVenta?.es_cotizacion ? 'bg-info' : 'bg-success'} text-white`}>
                                <h5 className="modal-title">
                                    <i className={`bi ${ultimaVenta?.es_cotizacion ? 'bi-file-text' : 'bi-receipt'} me-2`}></i>
                                    {ultimaVenta?.es_cotizacion ? 'Cotización' : 'Comprobante de Venta'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setShowComprobante(false)}
                                ></button>
                            </div>
                            <div className="modal-body" id="comprobante">
                                <div className="text-center mb-4">
                                    <h3 className="text-primary">Sistema de Ventas JC</h3>
                                    {ultimaVenta?.es_cotizacion && (
                                        <div className="alert alert-info py-2 mt-2">
                                            <i className="bi bi-info-circle me-2"></i>
                                            <strong>DOCUMENTO: COTIZACIÓN</strong>
                                        </div>
                                    )}
                                    <hr />
                                </div>
                                
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <h6>{ultimaVenta?.es_cotizacion ? 'Información de Cotización' : 'Información de Venta'}</h6>
                                        <p className="mb-1">
                                            <strong>Fecha:</strong> {ultimaVenta.fecha?.toLocaleString() || new Date().toLocaleString()}
                                        </p>
                                        <p className="mb-1">
                                            <strong>{ultimaVenta?.es_cotizacion ? 'Cotización #:' : 'Venta #:'}</strong> {ultimaVenta.id || 'N/A'}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Tipo de Precio:</strong> {ultimaVenta.tipo_precio?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                                        </p>
                                        
                                        {/* Información de pago detallada */}
                                        <div className="mt-2">
                                            <h6>Información de Pago</h6>
                                            <p className="mb-1">
                                                <strong>Método:</strong> {ultimaVenta.metodo_pago?.toUpperCase() || 'EFECTIVO'}
                                            </p>
                                            
                                            {/* Código de operación para Yape/Plin */}
                                            {(ultimaVenta.metodo_pago === 'yape' || ultimaVenta.metodo_pago === 'plin') && ultimaVenta.pago?.codigo_operacion && (
                                                <p className="mb-1">
                                                    <strong>Código de Operación:</strong> {ultimaVenta.pago.codigo_operacion}
                                                </p>
                                            )}
                                            
                                            {/* Últimos dígitos para transferencia */}
                                            {ultimaVenta.metodo_pago === 'transferencia' && ultimaVenta.pago?.ultimos_digitos && (
                                                <p className="mb-1">
                                                    <strong>Últimos dígitos:</strong> ****{ultimaVenta.pago.ultimos_digitos}
                                                </p>
                                            )}
                                            
                                            {/* Comisión para tarjeta */}
                                            {ultimaVenta.metodo_pago === 'tarjeta' && ultimaVenta.pago?.comision_tarjeta > 0 && (
                                                <p className="mb-1">
                                                    <strong>Comisión (5%):</strong> ${ultimaVenta.pago.comision_tarjeta.toLocaleString()}
                                                </p>
                                            )}
                                            
                                            {/* Información de adelanto */}
                                            {ultimaVenta.pago?.es_adelanto && (
                                                <>
                                                    <p className="mb-1">
                                                        <strong>Adelanto:</strong> ${ultimaVenta.pago.monto_adelanto.toLocaleString()}
                                                    </p>
                                                    <p className="mb-1 text-warning">
                                                        <strong>Saldo Pendiente:</strong> ${ultimaVenta.pago.saldo_pendiente.toLocaleString()}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Cliente</h6>
                                        {ultimaVenta.cliente ? (
                                            <>
                                                <p className="mb-1">
                                                    <strong>Nombre:</strong> {ultimaVenta.cliente.nombre}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Documento:</strong> {ultimaVenta.cliente.documento}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Teléfono:</strong> {ultimaVenta.cliente.telefono || 'N/A'}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-muted">Cliente general</p>
                                        )}
                                    </div>
                                </div>

                                {/* Información de envío */}
                                {(ultimaVenta.envio?.esEnvioEncomienda || ultimaVenta.envio?.esEnvioMotorizado) && (
                                    <div className="row mb-3">
                                        <div className="col-12">
                                            <h6>Información de Envío</h6>
                                            {ultimaVenta.envio?.esEnvioEncomienda && (
                                                <div className="alert alert-info py-2 mb-2">
                                                    <i className="bi bi-box-seam me-2"></i>
                                                    <strong>Envío por Encomienda</strong>
                                                    <br />
                                                    <strong>Empresa:</strong> {ultimaVenta.envio.empresaEncomienda || 'N/A'}
                                                    <br />
                                                    <strong>Destino:</strong> {ultimaVenta.envio.destinoEncomienda || 'N/A'}
                                                </div>
                                            )}
                                            {ultimaVenta.envio?.esEnvioMotorizado && (
                                                <div className="alert alert-warning py-2 mb-2">
                                                    <i className="bi bi-bicycle me-2"></i>
                                                    <strong>Envío por Motorizado</strong>
                                                    <br />
                                                    <strong>Motorizado:</strong> {ultimaVenta.envio.nombreMotorizado || 'N/A'}
                                                    <br />
                                                    <strong>Placa:</strong> {ultimaVenta.envio.placaMoto || 'N/A'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <h6>Detalle de Productos</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Código</th>
                                                <th>Descripción</th>
                                                <th>Cant.</th>
                                                <th>Precio Unit.</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ultimaVenta.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td><code>{item.codigo}</code></td>
                                                    <td>{item.nombre || item.descripcion}</td>
                                                    <td className="text-center">{item.cantidad}</td>
                                                    <td className="text-end">${item.precio?.toLocaleString()}</td>
                                                    <td className="text-end">${item.subtotal?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            {/* Subtotal de productos */}
                                            <tr>
                                                <td colSpan="4" className="text-end"><strong>Subtotal Productos:</strong></td>
                                                <td className="text-end"><strong>${ultimaVenta.total?.toLocaleString()}</strong></td>
                                            </tr>
                                            
                                            {/* Comisión de tarjeta si aplica */}
                                            {ultimaVenta.metodo_pago === 'tarjeta' && ultimaVenta.pago?.comision_tarjeta > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-end">Comisión Tarjeta (5%):</td>
                                                    <td className="text-end">${ultimaVenta.pago.comision_tarjeta.toLocaleString()}</td>
                                                </tr>
                                            )}
                                            
                                            {/* Total final */}
                                            <tr className="table-success">
                                                <td colSpan="4" className="text-end"><strong>
                                                    {ultimaVenta.pago?.es_adelanto ? 'TOTAL ADELANTO:' : 'TOTAL A PAGAR:'}
                                                </strong></td>
                                                <td className="text-end"><h5>
                                                    ${(ultimaVenta.pago?.total_con_comision || ultimaVenta.total)?.toLocaleString()}
                                                </h5></td>
                                            </tr>
                                            
                                            {/* Saldo pendiente si es adelanto */}
                                            {ultimaVenta.pago?.es_adelanto && ultimaVenta.pago?.saldo_pendiente > 0 && (
                                                <tr className="table-warning">
                                                    <td colSpan="4" className="text-end"><strong>SALDO PENDIENTE:</strong></td>
                                                    <td className="text-end"><h6 className="text-warning">
                                                        ${ultimaVenta.pago.saldo_pendiente.toLocaleString()}
                                                    </h6></td>
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>
                                </div>

                                <div className="text-center mt-4">
                                    <p className="text-muted small">
                                        ¡Gracias por su compra!<br/>
                                        Sistema de Ventas JC - {new Date().getFullYear()}
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowComprobante(false)}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    Cerrar
                                </button>
                                
                                {/* Botón de guardar cotización - solo aparece para cotizaciones no guardadas */}
                                {ultimaVenta?.es_cotizacion && !ultimaVenta?.guardada && (
                                    <button 
                                        type="button" 
                                        className="btn btn-success"
                                        onClick={guardarCotizacion}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-save me-2"></i>
                                                Guardar Cotización
                                            </>
                                        )}
                                    </button>
                                )}
                                
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => window.print()}
                                >
                                    <i className="bi bi-printer me-2"></i>
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente principal con Error Boundary
export default function Venta() {
    return (
        <ErrorBoundary>
            <VentaContent />
        </ErrorBoundary>
    );
}
