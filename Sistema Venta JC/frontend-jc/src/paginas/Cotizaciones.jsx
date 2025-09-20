import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationService } from '../services/apiServices';

function Cotizaciones() {
    const navigate = useNavigate();
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
    const [cotizacionDetalle, setCotizacionDetalle] = useState(null);
    const [showDetalle, setShowDetalle] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [convertingToSale, setConvertingToSale] = useState(false);

    useEffect(() => {
        loadCotizaciones();
    }, []);

    const loadCotizaciones = async () => {
        try {
            setLoading(true);
            const response = await quotationService.getAll();
            setCotizaciones(response.data || []);
        } catch (error) {
            console.error('❌ Error al cargar cotizaciones:', error);
            setError('Error al cargar las cotizaciones');
        } finally {
            setLoading(false);
        }
    };

    const deleteCotizacion = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar esta cotización?')) {
            return;
        }

        try {
            await quotationService.delete(id);
            loadCotizaciones();
            alert('Cotización eliminada exitosamente');
        } catch (error) {
            console.error('❌ Error al eliminar cotización:', error);
            alert('Error al eliminar la cotización');
        }
    };

    const loadCotizacionDetalle = async (cotizacionId) => {
        try {
            setLoadingDetalle(true);
            const detalle = await quotationService.getDetalle(cotizacionId);
            setCotizacionDetalle(detalle);
        } catch (error) {
            console.error('❌ Error al cargar detalle de cotización:', error);
            setError('Error al cargar los detalles de la cotización');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const convertirAVenta = async (cotizacion) => {
        if (!window.confirm(`¿Desea ir a la página de Venta con los datos de la cotización COT-${cotizacion.id}?`)) {
            return;
        }

        try {
            setConvertingToSale(true);
            
            // Cargar los detalles de la cotización si no están ya cargados
            let detalleCotizacion = cotizacionDetalle;
            if (!detalleCotizacion || (selectedCotizacion && selectedCotizacion.id !== cotizacion.id)) {
                detalleCotizacion = await quotationService.getDetalle(cotizacion.id);
            }
            
            // Preparar datos para pasar a la página de Venta
            const datosVenta = {
                origen: 'cotizacion',
                cotizacion_id: cotizacion.id,
                cliente: {
                    id: cotizacion.cliente_id,
                    nombre: cotizacion.cliente_nombre,
                    documento: cotizacion.cliente_documento
                },
                metodo_pago: cotizacion.metodo_pago,
                codigo_operacion: cotizacion.codigo_operacion,
                ultimos_digitos: cotizacion.ultimos_digitos,
                comision_tarjeta: parseFloat(cotizacion.comision_tarjeta || 0),
                es_adelanto: cotizacion.es_adelanto,
                monto_adelanto: parseFloat(cotizacion.monto_adelanto || 0),
                saldo_pendiente: parseFloat(cotizacion.saldo_pendiente || 0),
                tipo_precio: cotizacion.tipo_precio,
                es_envio_encomienda: cotizacion.es_envio_encomienda,
                empresa_encomienda: cotizacion.empresa_encomienda,
                destino_encomienda: cotizacion.destino_encomienda,
                es_envio_motorizado: cotizacion.es_envio_motorizado,
                nombre_motorizado: cotizacion.nombre_motorizado,
                placa_moto: cotizacion.placa_moto,
                codigo_transferencia: cotizacion.codigo_transferencia,
                observaciones: cotizacion.observaciones,
                productos: detalleCotizacion?.productos || []
            };

            // Guardar los datos en localStorage para que la página de Venta los pueda usar
            localStorage.setItem('cotizacion_para_venta', JSON.stringify(datosVenta));
            
            // Navegar a la página de Venta
            navigate('/layouts/venta');
            
        } catch (error) {
            console.error('❌ Error al preparar datos para venta:', error);
            alert(`❌ Error al cargar datos de la cotización: ${error.message || 'Error desconocido'}`);
        } finally {
            setConvertingToSale(false);
        }
    };

    // Función para imprimir cotización desde la tabla
    const imprimirCotizacion = async (cotizacion) => {
        try {
            // Cargar los detalles completos para la impresión
            const detalle = await quotationService.getDetalle(cotizacion.id);
            imprimirDocumento(cotizacion, detalle);
        } catch (error) {
            console.error('❌ Error al cargar detalles para impresión:', error);
            alert('Error al cargar los detalles de la cotización para imprimir');
        }
    };

    // Función para imprimir cotización desde el modal (con detalles ya cargados)
    const imprimirCotizacionDetalle = (cotizacion) => {
        if (cotizacionDetalle) {
            imprimirDocumento(cotizacion, cotizacionDetalle);
        } else {
            alert('Error: No se han cargado los detalles de la cotización');
        }
    };

    // --- Editor inline: abrir modal con detalle editable ---
    const [editingItems, setEditingItems] = useState([]);
    const [editingTotals, setEditingTotals] = useState({ total: 0, total_items: 0, total_con_comision: 0 });
    const [editingCotizacionId, setEditingCotizacionId] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [estadoFilter, setEstadoFilter] = useState('todos'); // Nuevo estado para filtros
    
    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const openEditor = async (cotizacion) => {
        try {
            setSelectedCotizacion(cotizacion);
            setEditingCotizacionId(cotizacion.id);
            setLoadingDetalle(true);
            const detalle = await quotationService.getDetalle(cotizacion.id);
            // Mapear productos a estructura editable
            const items = (detalle?.productos || []).map(p => ({
                producto_id: p.producto_id,
                producto_nombre: p.producto_nombre,
                producto_codigo: p.producto_codigo,
                cantidad: Number(p.cantidad) || 0,
                precio_unitario: Number(p.precio_unitario) || 0,
                subtotal: Number(p.subtotal) || 0,
            }));
            setEditingItems(items);
            recalcEditingTotals(items, cotizacion);
            // Mostrar modal de detalle editable mediante estado (no depender de window.bootstrap)
            setShowEditor(true);
        } catch (error) {
            console.error('Error al abrir editor:', error);
            alert('No se pudo cargar el detalle para edición');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const recalcEditingTotals = (items, cotizacion = selectedCotizacion) => {
        const total_items = items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);
        const total = items.reduce((s, it) => s + ((Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0)), 0);
        const comision = parseFloat(cotizacion?.comision_tarjeta || 0) || 0;
        const total_con_comision = total + comision;
        setEditingTotals({ total, total_items, total_con_comision });
    };

    const updateEditingItem = (index, field, value) => {
        const newItems = [...editingItems];
        if (field === 'cantidad') newItems[index].cantidad = Number(value);
        if (field === 'precio_unitario') newItems[index].precio_unitario = Number(value);
        newItems[index].subtotal = Number(newItems[index].cantidad || 0) * Number(newItems[index].precio_unitario || 0);
        setEditingItems(newItems);
        recalcEditingTotals(newItems);
    };

    const addEditingRow = () => {
        setEditingItems(prev => ([...prev, { producto_id: null, producto_nombre: '', producto_codigo: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]));
    };

    const removeEditingRow = (index) => {
        const newItems = [...editingItems];
        newItems.splice(index, 1);
        setEditingItems(newItems);
        recalcEditingTotals(newItems);
    };

    const saveEditedDetalle = async () => {
        if (!editingCotizacionId) return;
        if (!window.confirm('¿Guardar cambios en la cotización?')) return;
        try {
            setSavingEdit(true);
            // Construir payload esperado por el backend
            const itemsPayload = editingItems.map(it => ({
                producto_id: it.producto_id,
                producto_nombre: it.producto_nombre,
                producto_codigo: it.producto_codigo,
                cantidad: Number(it.cantidad) || 0,
                precio_unitario: Number(it.precio_unitario) || 0,
                subtotal: Number(it.subtotal) || 0,
            }));

            const payload = {
                items: itemsPayload,
                total: editingTotals.total,
                total_items: editingTotals.total_items,
                total_con_comision: editingTotals.total_con_comision
            };

            const res = await quotationService.updateDetalle(editingCotizacionId, payload);
            if (res && res.success) {
                // Cerrar modal controlado por estado
                setShowEditor(false);
                // Recargar lista
                await loadCotizaciones();
                alert('Cotización actualizada correctamente');
            } else {
                throw new Error(res?.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al guardar detalle:', error);
            alert('Error al guardar los cambios de la cotización');
        } finally {
            setSavingEdit(false);
        }
    };

    // Función principal de impresión
    const imprimirDocumento = (cotizacion, detalle) => {
        const fechaImpresion = new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const contenidoImpresion = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Cotización COT-${cotizacion.id}</title>
                <style>
                    @media print {
                        @page { margin: 1cm; }
                        body { font-family: Arial, sans-serif; font-size: 12px; }
                    }
                    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #333; }
                    .info-section { margin-bottom: 15px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .info-label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .text-right { text-align: right; }
                    .total-row { font-weight: bold; background-color: #f9f9f9; }
                    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>COTIZACIÓN</h1>
                    <p>Número: COT-${cotizacion.id}</p>
                </div>

                <div class="info-section">
                    <div class="info-row">
                        <span><span class="info-label">Fecha:</span> ${formatDate(cotizacion.fecha_creacion)}</span>
                        <span><span class="info-label">Estado:</span> ${cotizacion.estado?.toUpperCase() || 'PENDIENTE'}</span>
                    </div>
                    <div class="info-row">
                        <span><span class="info-label">Cliente:</span> ${cotizacion.cliente_nombre || 'No especificado'}</span>
                        <span><span class="info-label">Documento:</span> ${cotizacion.cliente_documento || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span><span class="info-label">Método de Pago:</span> ${cotizacion.metodo_pago?.toUpperCase() || 'N/A'}</span>
                        <span><span class="info-label">Tipo de Precio:</span> ${cotizacion.tipo_precio?.toUpperCase() || 'GENERAL'}</span>
                    </div>
                    ${cotizacion.codigo_operacion ? `
                        <div class="info-row">
                            <span><span class="info-label">Código de Operación:</span> ${cotizacion.codigo_operacion}</span>
                        </div>
                    ` : ''}
                    ${cotizacion.codigo_transferencia ? `
                        <div class="info-row">
                            <span><span class="info-label">Código de Transferencia:</span> ${cotizacion.codigo_transferencia}</span>
                        </div>
                    ` : ''}
                    ${cotizacion.es_adelanto ? `
                        <div class="info-row">
                            <span><span class="info-label">Adelanto:</span> S/ ${parseFloat(cotizacion.monto_adelanto || 0).toLocaleString()}</span>
                            <span><span class="info-label">Saldo Pendiente:</span> S/ ${parseFloat(cotizacion.saldo_pendiente || 0).toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${cotizacion.es_envio_encomienda ? `
                        <div class="info-row">
                            <span><span class="info-label">Envío por Encomienda:</span> ${cotizacion.empresa_encomienda}</span>
                            <span><span class="info-label">Destino:</span> ${cotizacion.destino_encomienda}</span>
                        </div>
                    ` : ''}
                    ${cotizacion.es_envio_motorizado ? `
                        <div class="info-row">
                            <span><span class="info-label">Motorizado:</span> ${cotizacion.nombre_motorizado}</span>
                            <span><span class="info-label">Placa:</span> ${cotizacion.placa_moto}</span>
                        </div>
                    ` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Código</th>
                            <th class="text-right">Cantidad</th>
                            <th class="text-right">Precio Unit.</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detalle.productos ? detalle.productos.map(producto => `
                            <tr>
                                <td>${producto.producto_nombre || 'Producto sin nombre'}</td>
                                <td>${producto.producto_codigo || 'N/A'}</td>
                                <td class="text-right">${producto.cantidad}</td>
                                <td class="text-right">S/ ${parseFloat(producto.precio_unitario).toLocaleString()}</td>
                                <td class="text-right">S/ ${parseFloat(producto.subtotal).toLocaleString()}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5">No hay productos en esta cotización</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3"><strong>TOTAL DE PRODUCTOS:</strong></td>
                            <td class="text-right"><strong>${detalle.resumen?.cantidad_total || 0}</strong></td>
                            <td class="text-right"><strong>S/ ${(detalle.resumen?.total_productos || 0).toLocaleString()}</strong></td>
                        </tr>
                        ${parseFloat(cotizacion.comision_tarjeta || 0) > 0 ? `
                            <tr>
                                <td colspan="4"><strong>Comisión Tarjeta (5%):</strong></td>
                                <td class="text-right"><strong>S/ ${parseFloat(cotizacion.comision_tarjeta).toLocaleString()}</strong></td>
                            </tr>
                        ` : ''}
                        <tr class="total-row">
                            <td colspan="4"><strong>TOTAL FINAL:</strong></td>
                            <td class="text-right"><strong>S/ ${parseFloat(cotizacion.total_con_comision || cotizacion.total || 0).toLocaleString()}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                ${cotizacion.observaciones ? `
                    <div class="info-section">
                        <p><span class="info-label">Observaciones:</span></p>
                        <p>${cotizacion.observaciones}</p>
                    </div>
                ` : ''}

                <div class="footer">
                    <p>Impreso el: ${fechaImpresion}</p>
                    <p>Sistema de Ventas JC</p>
                </div>
            </body>
            </html>
        `;

        // Crear nueva ventana para imprimir
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(contenidoImpresion);
        ventanaImpresion.document.close();
        
        // Configurar la impresión
        ventanaImpresion.onload = function() {
            ventanaImpresion.focus();
            ventanaImpresion.print();
            
            // Opcional: cerrar la ventana después de imprimir
            ventanaImpresion.onafterprint = function() {
                ventanaImpresion.close();
            };
        };
    };

    const filteredCotizaciones = cotizaciones.filter(cot => {
        const matchesSearch = cot.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cot.id?.toString().includes(searchTerm) ||
            cot.total?.toString().includes(searchTerm);
        
        const matchesEstado = estadoFilter === 'todos' || 
            (estadoFilter === 'pendiente' && cot.estado === 'pendiente') ||
            (estadoFilter === 'completada' && cot.estado === 'completada') ||
            (estadoFilter === 'cancelada' && cot.estado === 'cancelada');
        
        return matchesSearch && matchesEstado;
    });

    // Lógica de paginación
    const totalPages = Math.ceil(filteredCotizaciones.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCotizaciones = filteredCotizaciones.slice(startIndex, endIndex);

    // Reiniciar página cuando cambien los filtros
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('es-PE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando cotizaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Estilos CSS para animaciones */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slideInLeft {
                    from { transform: translateX(-30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .fade-in { animation: fadeIn 0.6s ease-out; }
                .slide-in-left { animation: slideInLeft 0.5s ease-out; }
                .bounce-in { animation: bounceIn 0.8s ease-out; }
                .pulse { animation: pulse 2s infinite; }
                
                .pulse-hover:hover { animation: pulse 0.6s ease-in-out; }
                
                .table-row-hover { animation: slideInLeft 0.5s ease-out; }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.25);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .table {
                    border-collapse: separate;
                    border-spacing: 0;
                }
                
                .table th,
                .table td {
                    vertical-align: middle !important;
                    border: none !important;
                }
            `}</style>
            
            <div 
                className="d-flex flex-column min-vh-100"
                style={{
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    width: '100%',
                    overflow: 'hidden'
                }}
        >
            {/* CSS for animations */}
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideInLeft {
                        from { opacity: 0; transform: translateX(-30px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes bounceIn {
                        0% { transform: scale(0.9); opacity: 0; }
                        50% { transform: scale(1.05); opacity: 0.7; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    .fade-in { animation: fadeIn 0.6s ease-out; }
                    .slide-in-left { animation: slideInLeft 0.5s ease-out; }
                    .bounce-in { animation: bounceIn 0.7s ease-out; }
                    .pulse-hover:hover { animation: pulse 1s infinite; }
                    .table-row-hover {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .table-row-hover:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(111, 66, 193, 0.15);
                    }
                    .glass-card {
                        backdrop-filter: blur(20px);
                        background: rgba(255, 255, 255, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        transition: all 0.3s ease;
                    }
                    .glass-card:hover {
                        background: rgba(255, 255, 255, 0.98);
                        transform: translateY(-5px);
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                    }
                `}
            </style>

            {/* Header Section Mejorado */}
            <div 
                className='p-4 p-md-5'
                style={{
                    background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 50%, #4a2c7e 100%)',
                    color: 'white',
                    borderBottom: '3px solid rgba(240, 152, 54, 0.8)',
                    boxShadow: '0 8px 32px rgba(111, 66, 193, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative background pattern */}
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '300px',
                        height: '100%',
                        background: 'linear-gradient(45deg, rgba(240, 152, 54, 0.1) 0%, rgba(240, 152, 54, 0.05) 100%)',
                        borderRadius: '50px 0 0 50px',
                        zIndex: 0
                    }}
                />
                
                <div className='d-flex justify-content-between align-items-center position-relative' style={{ zIndex: 1 }}>
                    <div>
                        <div className='d-flex align-items-center mb-3'>
                            <div 
                                className='me-3 d-flex align-items-center justify-content-center'
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 20px rgba(240, 152, 54, 0.3)'
                                }}
                            >
                                <i className='bi bi-file-text' style={{ fontSize: '2rem', color: 'white' }}></i>
                            </div>
                            <div>
                                <h1 
                                    className='mb-0 fw-bold'
                                    style={{
                                        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                                        letterSpacing: '-0.5px',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Cotizaciones
                                </h1>
                                <p className='mb-0 opacity-75 mt-1' style={{ fontSize: '1.1rem' }}>
                                    Gestión de cotizaciones guardadas
                                </p>
                            </div>
                        </div>
                        
                        <div className='d-flex align-items-center gap-3'>
                            <span 
                                className='badge px-3 py-2'
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <i className='bi bi-list-ul me-2'></i>
                                Total: {cotizaciones.length} cotizaciones
                            </span>
                        </div>
                    </div>
                    
                    <div className='d-flex align-items-center gap-3'>
                        {/* Botón de actualizar mejorado */}
                        <button 
                            className='btn d-flex align-items-center gap-2' 
                            onClick={loadCotizaciones}
                            disabled={loading}
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                fontWeight: '500',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            {loading ? (
                                <span className='spinner-border spinner-border-sm'></span>
                            ) : (
                                <i className='bi bi-arrow-clockwise'></i>
                            )}
                            <span>Actualizar</span>
                        </button>
                        
                        {/* Botón Nueva Cotización */}
                        <button 
                            className='btn d-flex align-items-center gap-2'
                            style={{
                                background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontWeight: '600',
                                boxShadow: '0 6px 20px rgba(240, 152, 54, 0.4)',
                                transition: 'all 0.3s ease',
                                padding: '8px 16px'
                            }}
                            onClick={() => navigate('/layouts/cotizacion')}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 25px rgba(240, 152, 54, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 6px 20px rgba(240, 152, 54, 0.4)';
                            }}
                        >
                            <i className='bi bi-plus-circle'></i>
                            <span>Nueva Cotización</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido principal con glassmorphism mejorado */}
            <div className="flex-grow-1 p-4 p-md-5">
                <div 
                    className="glass-card fade-in"
                    style={{
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    {/* Patrón decorativo interno */}
                    <div 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '4px',
                            background: 'linear-gradient(90deg, #6f42c1 0%, #F09836 50%, #17a2b8 100%)'
                        }}
                    />
                    
                    {error && (
                        <div 
                            className="alert alert-danger m-4 bounce-in" 
                            style={{
                                borderRadius: '16px',
                                border: 'none',
                                background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%)',
                                backdropFilter: 'blur(10px)',
                                borderLeft: '4px solid #dc3545'
                            }}
                            role="alert"
                        >
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Barra de búsqueda ultra-moderna */}
                    <div 
                        className="p-4 border-bottom slide-in-left"
                        style={{
                            background: 'linear-gradient(135deg, rgba(111, 66, 193, 0.08) 0%, rgba(240, 152, 54, 0.04) 100%)',
                            borderBottom: '1px solid rgba(111, 66, 193, 0.1)'
                        }}
                    >
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <div 
                                    className="input-group"
                                    style={{
                                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <span 
                                        className="input-group-text"
                                        style={{
                                            background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '14px 18px'
                                        }}
                                    >
                                        <i className="bi bi-search" style={{ fontSize: '1.1rem' }}></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="🔍 Buscar por cliente, ID o total..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            border: 'none',
                                            fontSize: '1.05rem',
                                            padding: '14px 20px',
                                            background: 'rgba(255, 255, 255, 0.98)'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="d-flex align-items-center justify-content-md-end mt-3 mt-md-0">
                                    <span 
                                        className="badge px-4 py-3 pulse-hover"
                                        style={{
                                            background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                            color: 'white',
                                            fontSize: '0.95rem',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <i className="bi bi-funnel me-2"></i>
                                        Mostrando {currentCotizaciones.length} de {filteredCotizaciones.length} ({cotizaciones.length} total)
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Filtros por estado */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="d-flex flex-wrap gap-3 align-items-center">
                                    <span style={{ 
                                        fontSize: '0.9rem', 
                                        fontWeight: '600', 
                                        color: '#6f42c1',
                                        marginRight: '10px'
                                    }}>
                                        <i className="bi bi-funnel me-2"></i>Filtrar por estado:
                                    </span>
                                    
                                    <button
                                        className={`btn btn-sm ${estadoFilter === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setEstadoFilter('todos')}
                                        style={{
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            padding: '6px 16px',
                                            transition: 'all 0.3s ease',
                                            background: estadoFilter === 'todos' 
                                                ? 'linear-gradient(135deg, #6f42c1, #8e44ad)' 
                                                : 'transparent',
                                            borderColor: '#6f42c1'
                                        }}
                                    >
                                        <i className="bi bi-list me-1"></i>Todos
                                    </button>
                                    
                                    <button
                                        className={`btn btn-sm ${estadoFilter === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
                                        onClick={() => setEstadoFilter('pendiente')}
                                        style={{
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            padding: '6px 16px',
                                            transition: 'all 0.3s ease',
                                            background: estadoFilter === 'pendiente' 
                                                ? 'linear-gradient(135deg, #f39c12, #e67e22)' 
                                                : 'transparent',
                                            borderColor: '#f39c12'
                                        }}
                                    >
                                        <i className="bi bi-clock me-1"></i>Pendientes
                                    </button>
                                    
                                    <button
                                        className={`btn btn-sm ${estadoFilter === 'completada' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setEstadoFilter('completada')}
                                        style={{
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            padding: '6px 16px',
                                            transition: 'all 0.3s ease',
                                            background: estadoFilter === 'completada' 
                                                ? 'linear-gradient(135deg, #27ae60, #2ecc71)' 
                                                : 'transparent',
                                            borderColor: '#27ae60'
                                        }}
                                    >
                                        <i className="bi bi-check-circle me-1"></i>Completadas
                                    </button>
                                    
                                    <button
                                        className={`btn btn-sm ${estadoFilter === 'cancelada' ? 'btn-danger' : 'btn-outline-danger'}`}
                                        onClick={() => setEstadoFilter('cancelada')}
                                        style={{
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            padding: '6px 16px',
                                            transition: 'all 0.3s ease',
                                            background: estadoFilter === 'cancelada' 
                                                ? 'linear-gradient(135deg, #e74c3c, #c0392b)' 
                                                : 'transparent',
                                            borderColor: '#e74c3c'
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-1"></i>Canceladas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de cotizaciones ultra-moderna */}
                    <div className="p-4">
                        <div 
                            className="table-responsive bounce-in"
                            style={{
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(111, 66, 193, 0.08)',
                                maxHeight: '70vh',
                                overflowY: 'auto'
                            }}
                        >
                            <table className="table table-hover mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                                <thead 
                                    style={{
                                        background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                        color: 'white',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10
                                    }}
                                >
                                    {/* Efecto brillante en el header */}
                                    <tr style={{ position: 'relative' }}>
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: '2px',
                                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                                                animation: 'slideInLeft 1s ease-out'
                                            }}
                                        />
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '10%',
                                            textAlign: 'center'
                                        }}>
                                            <i className="bi bi-upc me-1"></i>Código
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '12%',
                                            textAlign: 'center'
                                        }}>
                                            <i className="bi bi-calendar me-1"></i>Fecha
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '20%'
                                        }}>
                                            <i className="bi bi-person me-1"></i>Cliente
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '10%',
                                            textAlign: 'center'
                                        }}>
                                            <i className="bi bi-box me-1"></i>Items
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '12%',
                                            textAlign: 'right'
                                        }}>
                                            <i className="bi bi-currency-dollar me-1"></i>Total
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '12%',
                                            textAlign: 'center'
                                        }}>
                                            <i className="bi bi-credit-card me-1"></i>Pago
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '12%',
                                            textAlign: 'center'
                                        }}>
                                            <i className="bi bi-flag me-1"></i>Estado
                                        </th>
                                        <th style={{ 
                                            padding: '16px 12px', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            border: 'none', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                            width: '12%',
                                            textAlign: 'center'
                                        }}>
                                            <i className="bi bi-gear me-1"></i>Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody style={{ background: 'white' }}>
                                    {currentCotizaciones.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5" style={{ border: 'none' }}>
                                                <div 
                                                    className="d-flex flex-column align-items-center fade-in"
                                                    style={{ color: '#6c757d' }}
                                                >
                                                    <i className="bi bi-inbox pulse" style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '1rem', color: '#6f42c1' }}></i>
                                                    <h5 className="mb-2" style={{ color: '#6f42c1', fontWeight: '600' }}>No hay cotizaciones</h5>
                                                    <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                                                        {searchTerm ? 'No se encontraron cotizaciones que coincidan con la búsqueda' : 'No hay cotizaciones guardadas aún'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentCotizaciones.map((cotizacion, index) => (
                                            <tr 
                                                key={cotizacion.id}
                                                style={{
                                                    animationDelay: `${index * 0.1}s`,
                                                    borderBottom: '1px solid rgba(111, 66, 193, 0.06)'
                                                }}
                                            >
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: '600',
                                                    color: '#6f42c1',
                                                    border: 'none',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <span 
                                                        style={{
                                                            background: 'linear-gradient(135deg, #6f42c1, #8e44ad)',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            boxShadow: '0 2px 6px rgba(111, 66, 193, 0.2)',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        COT-{cotizacion.id}
                                                    </span>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.8rem',
                                                    color: '#495057',
                                                    border: 'none',
                                                    fontWeight: '500',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <i className="bi bi-calendar-date mb-1" style={{ color: '#6f42c1', fontSize: '0.9rem' }}></i>
                                                        <span style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                            {formatDate(cotizacion.fecha_creacion)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.8rem',
                                                    color: '#495057',
                                                    border: 'none',
                                                    fontWeight: '500',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div 
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #F09836, #e67e22)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginRight: '8px',
                                                                color: 'white',
                                                                fontWeight: '700',
                                                                fontSize: '0.7rem',
                                                                boxShadow: '0 2px 6px rgba(240, 152, 54, 0.2)',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {(cotizacion.cliente_nombre || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div style={{ overflow: 'hidden' }}>
                                                            <div style={{ 
                                                                color: '#2c3e50', 
                                                                fontSize: '0.8rem', 
                                                                fontWeight: '600',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {cotizacion.cliente_nombre || 'Cliente no especificado'}
                                                            </div>
                                                            {cotizacion.cliente_documento && (
                                                                <div style={{ 
                                                                    color: '#6c757d', 
                                                                    fontSize: '0.7rem', 
                                                                    marginTop: '1px',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    <i className="bi bi-card-text me-1"></i>
                                                                    {cotizacion.cliente_documento}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.8rem',
                                                    color: '#495057',
                                                    border: 'none',
                                                    fontWeight: '500',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <span 
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(111, 66, 193, 0.1), rgba(240, 152, 54, 0.1))',
                                                            color: '#6f42c1',
                                                            padding: '4px 8px',
                                                            borderRadius: '15px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: '600',
                                                            border: '1px solid rgba(111, 66, 193, 0.2)',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        <i className="bi bi-box me-1"></i>
                                                        {cotizacion.total_items || 0}
                                                    </span>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.85rem',
                                                    color: '#2c3e50',
                                                    border: 'none',
                                                    fontWeight: '700',
                                                    textAlign: 'right',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ color: '#27ae60', fontSize: '0.9rem', fontWeight: '700' }}>
                                                            S/ {(cotizacion.total || 0).toLocaleString()}
                                                        </span>
                                                        {cotizacion.comision_tarjeta > 0 && (
                                                            <div style={{ color: '#e74c3c', fontSize: '0.6rem', marginTop: '1px' }}>
                                                                <i className="bi bi-info-circle me-1"></i>
                                                                +S/ {cotizacion.comision_tarjeta.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.8rem',
                                                    border: 'none',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <span 
                                                        style={{
                                                            background: cotizacion.metodo_pago === 'efectivo' 
                                                                ? 'linear-gradient(135deg, #27ae60, #2ecc71)' 
                                                                : cotizacion.metodo_pago === 'tarjeta'
                                                                ? 'linear-gradient(135deg, #f39c12, #e67e22)'
                                                                : cotizacion.metodo_pago === 'yape'
                                                                ? 'linear-gradient(135deg, #6f42c1, #8e44ad)'
                                                                : cotizacion.metodo_pago === 'plin'
                                                                ? 'linear-gradient(135deg, #343a40, #495057)'
                                                                : 'linear-gradient(135deg, #3498db, #5dade2)',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                            fontSize: '0.7rem',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        <i className={`bi ${
                                                            cotizacion.metodo_pago === 'efectivo' ? 'bi-cash' :
                                                            cotizacion.metodo_pago === 'tarjeta' ? 'bi-credit-card' :
                                                            cotizacion.metodo_pago === 'yape' ? 'bi-phone' :
                                                            cotizacion.metodo_pago === 'plin' ? 'bi-phone' :
                                                            'bi-bank'
                                                        } me-1`}></i>
                                                        {cotizacion.metodo_pago?.toUpperCase() || 'N/A'}
                                                    </span>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px', 
                                                    fontSize: '0.8rem',
                                                    border: 'none',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <span 
                                                        className="pulse-hover"
                                                        style={{
                                                            background: cotizacion.estado === 'completada' 
                                                                ? 'linear-gradient(135deg, #27ae60, #2ecc71)' 
                                                                : cotizacion.estado === 'pendiente'
                                                                ? 'linear-gradient(135deg, #f39c12, #e67e22)'
                                                                : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                            fontSize: '0.7rem',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        <i className={`bi ${
                                                            cotizacion.estado === 'completada' ? 'bi-check-circle' : 
                                                            cotizacion.estado === 'pendiente' ? 'bi-clock' : 
                                                            'bi-x-circle'
                                                        } me-1`}></i>
                                                        {cotizacion.estado === 'completada' ? 'Completada' :
                                                         cotizacion.estado === 'pendiente' ? 'Pendiente' : 
                                                         'Cancelada'}
                                                    </span>
                                                </td>
                                                <td style={{ 
                                                    padding: '14px 8px',
                                                    border: 'none',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={async () => {
                                                                setSelectedCotizacion(cotizacion);
                                                                setShowDetalle(true);
                                                                await loadCotizacionDetalle(cotizacion.id);
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #6f42c1, #8e44ad)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '4px 6px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 6px rgba(111, 66, 193, 0.2)',
                                                                transition: 'all 0.3s ease',
                                                                minWidth: '32px',
                                                                height: '32px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-1px) scale(1.03)';
                                                                e.target.style.boxShadow = '0 4px 12px rgba(111, 66, 193, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0) scale(1)';
                                                                e.target.style.boxShadow = '0 2px 6px rgba(111, 66, 193, 0.2)';
                                                            }}
                                                            title="Ver detalle"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => convertirAVenta(cotizacion)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '4px 6px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 6px rgba(39, 174, 96, 0.2)',
                                                                transition: 'all 0.3s ease',
                                                                minWidth: '32px',
                                                                height: '32px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-1px) scale(1.03)';
                                                                e.target.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0) scale(1)';
                                                                e.target.style.boxShadow = '0 2px 6px rgba(39, 174, 96, 0.2)';
                                                            }}
                                                            title="Convertir a venta"
                                                        >
                                                            <i className="bi bi-cart-check"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => openEditor(cotizacion)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #F09836, #e67e22)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '4px 6px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 6px rgba(240, 152, 54, 0.2)',
                                                                transition: 'all 0.3s ease',
                                                                minWidth: '32px',
                                                                height: '32px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-1px) scale(1.03)';
                                                                e.target.style.boxShadow = '0 4px 12px rgba(240, 152, 54, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0) scale(1)';
                                                                e.target.style.boxShadow = '0 2px 6px rgba(240, 152, 54, 0.2)';
                                                            }}
                                                            title="Editar cotización"
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => imprimirCotizacion(cotizacion)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #17a2b8, #138496)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                padding: '6px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 8px rgba(23, 162, 184, 0.2)',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                                                                e.target.style.boxShadow = '0 4px 15px rgba(23, 162, 184, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0) scale(1)';
                                                                e.target.style.boxShadow = '0 2px 8px rgba(23, 162, 184, 0.2)';
                                                            }}
                                                            title="Imprimir cotización"
                                                        >
                                                            <i className="bi bi-printer"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => deleteCotizacion(cotizacion.id)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                padding: '6px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 8px rgba(231, 76, 60, 0.2)',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                                                                e.target.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0) scale(1)';
                                                                e.target.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.2)';
                                                            }}
                                                            title="Eliminar"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Paginación */}
                        {filteredCotizaciones.length > itemsPerPage && (
                            <div className="d-flex justify-content-between align-items-center mt-4 px-4">
                                <div className="d-flex align-items-center">
                                    <span style={{ 
                                        fontSize: '0.9rem', 
                                        color: '#6c757d',
                                        fontWeight: '500'
                                    }}>
                                        Mostrando {startIndex + 1} - {Math.min(endIndex, filteredCotizaciones.length)} de {filteredCotizaciones.length} cotizaciones
                                    </span>
                                </div>
                                
                                <nav aria-label="Paginación de cotizaciones">
                                    <ul className="pagination mb-0" style={{ gap: '5px' }}>
                                        {/* Botón Anterior */}
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                style={{
                                                    background: currentPage === 1 
                                                        ? '#f8f9fa' 
                                                        : 'linear-gradient(135deg, #6f42c1, #8e44ad)',
                                                    color: currentPage === 1 ? '#6c757d' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <i className="bi bi-chevron-left me-1"></i>
                                                Anterior
                                            </button>
                                        </li>
                                        
                                        {/* Números de página */}
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                            // Mostrar solo algunas páginas alrededor de la actual
                                            if (
                                                page === 1 || 
                                                page === totalPages || 
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setCurrentPage(page)}
                                                            style={{
                                                                background: currentPage === page 
                                                                    ? 'linear-gradient(135deg, #F09836, #e67e22)' 
                                                                    : 'white',
                                                                color: currentPage === page ? 'white' : '#6f42c1',
                                                                border: currentPage === page ? 'none' : '1px solid rgba(111, 66, 193, 0.2)',
                                                                borderRadius: '8px',
                                                                padding: '8px 12px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '600',
                                                                minWidth: '40px',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: currentPage === page 
                                                                    ? '0 4px 12px rgba(240, 152, 54, 0.3)' 
                                                                    : '0 2px 6px rgba(0, 0, 0, 0.05)'
                                                            }}
                                                        >
                                                            {page}
                                                        </button>
                                                    </li>
                                                );
                                            } else if (
                                                (page === currentPage - 2 && currentPage > 3) ||
                                                (page === currentPage + 2 && currentPage < totalPages - 2)
                                            ) {
                                                return (
                                                    <li key={page} className="page-item disabled">
                                                        <span className="page-link" style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#6c757d',
                                                            padding: '8px 12px'
                                                        }}>
                                                            ...
                                                        </span>
                                                    </li>
                                                );
                                            }
                                            return null;
                                        })}
                                        
                                        {/* Botón Siguiente */}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                style={{
                                                    background: currentPage === totalPages 
                                                        ? '#f8f9fa' 
                                                        : 'linear-gradient(135deg, #6f42c1, #8e44ad)',
                                                    color: currentPage === totalPages ? '#6c757d' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                Siguiente
                                                <i className="bi bi-chevron-right ms-1"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </div>

                    {/* Modal de detalle de cotización */}
                    {showDetalle && selectedCotizacion && (
                        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                            <div className="modal-dialog modal-lg modal-dialog-centered">
                                <div 
                                    className="modal-content"
                                    style={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    <div 
                                        className="modal-header"
                                        style={{
                                            background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                            color: 'white',
                                            borderRadius: '16px 16px 0 0',
                                            border: 'none'
                                        }}
                                    >
                                        <h5 className="modal-title fw-bold">
                                            <i className="bi bi-file-text me-2"></i>
                                            Detalle de Cotización COT-{selectedCotizacion.id}
                                        </h5>
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white" 
                                            onClick={() => setShowDetalle(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <h6>Información General</h6>
                                                <p className="mb-1">
                                                    <strong>Fecha:</strong> {formatDate(selectedCotizacion.fecha_creacion)}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Cliente:</strong> {selectedCotizacion.cliente_nombre || 'No especificado'}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Método de Pago:</strong> {selectedCotizacion.metodo_pago?.toUpperCase() || 'N/A'}
                                                </p>
                                                {selectedCotizacion.codigo_transferencia && (
                                                    <p className="mb-1">
                                                        <strong>Código Transferencia:</strong> {selectedCotizacion.codigo_transferencia}
                                                    </p>
                                                )}
                                                {selectedCotizacion.adelanto > 0 && (
                                                    <p className="mb-1">
                                                        <strong>Adelanto:</strong> S/ {selectedCotizacion.adelanto.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <h6>Totales</h6>
                                                <p className="mb-1">
                                                    <strong>Total Items:</strong> {selectedCotizacion.total_items || 0}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Subtotal:</strong> S/ {(selectedCotizacion.subtotal || 0).toLocaleString()}
                                                </p>
                                                {selectedCotizacion.comision_tarjeta > 0 && (
                                                    <p className="mb-1">
                                                        <strong>Comisión Tarjeta:</strong> S/ {selectedCotizacion.comision_tarjeta.toLocaleString()}
                                                    </p>
                                                )}
                                                <p className="mb-1">
                                                    <strong className="text-success">Total Final:</strong> S/ {(selectedCotizacion.total || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Productos de la cotización */}
                                        {loadingDetalle ? (
                                            <div className="text-center py-3">
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="visually-hidden">Cargando detalles...</span>
                                                </div>
                                                <p className="mt-2 mb-0">Cargando detalles de productos...</p>
                                            </div>
                                        ) : cotizacionDetalle && cotizacionDetalle.productos ? (
                                            <div>
                                                <h6>Productos en la Cotización</h6>
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Producto</th>
                                                                <th>Cantidad</th>
                                                                <th>Precio Unit.</th>
                                                                <th>Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {cotizacionDetalle.productos.map((producto, index) => (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <div>
                                                                            <strong>{producto.producto_nombre}</strong>
                                                                            {producto.producto_codigo && (
                                                                                <div className="text-muted small">
                                                                                    Código: {producto.producto_codigo}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td>{producto.cantidad}</td>
                                                                    <td>S/ {producto.precio_unitario.toLocaleString()}</td>
                                                                    <td className="text-success">
                                                                        <strong>S/ {producto.subtotal.toLocaleString()}</strong>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="table-info">
                                                                <th colSpan="3" className="text-end">Total:</th>
                                                                <th className="text-success">
                                                                    S/ {cotizacionDetalle.resumen?.total_productos?.toLocaleString() || '0'}
                                                                </th>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="alert alert-warning">
                                                <i className="bi bi-exclamation-triangle me-2"></i>
                                                No se pudieron cargar los detalles de los productos.
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => {
                                                setShowDetalle(false);
                                                setCotizacionDetalle(null);
                                            }}
                                            disabled={convertingToSale}
                                        >
                                            Cerrar
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-info"
                                            onClick={() => imprimirCotizacionDetalle(selectedCotizacion)}
                                            disabled={convertingToSale}
                                        >
                                            <i className="bi bi-printer me-2"></i>
                                            Imprimir
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-primary"
                                            onClick={() => openEditor(selectedCotizacion)}
                                            disabled={convertingToSale}
                                        >
                                            {convertingToSale ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Cargando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-pencil-square me-2"></i>
                                                    Modificar Cotización
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Editor */}
                    {showEditor && (
                        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                            <div className="modal-dialog modal-xl modal-dialog-centered">
                                <div 
                                    className="modal-content"
                                    style={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    <div 
                                        className="modal-header"
                                        style={{
                                            background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                            color: 'white',
                                            borderRadius: '16px 16px 0 0',
                                            border: 'none'
                                        }}
                                    >
                                        <h5 className="modal-title fw-bold">
                                            <i className="bi bi-pencil-square me-2"></i>
                                            Editar Cotización {editingCotizacionId ? `COT-${editingCotizacionId}` : ''}
                                        </h5>
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white" 
                                            onClick={() => setShowEditor(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3 d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>Cliente:</strong> {selectedCotizacion?.cliente_nombre || 'No especificado'}
                                            </div>
                                            <div>
                                                <button 
                                                    className="btn btn-sm btn-outline-success me-2" 
                                                    onClick={addEditingRow}
                                                >
                                                    <i className="bi bi-plus"></i> Agregar fila
                                                </button>
                                            </div>
                                        </div>

                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{minWidth: 300}}>Producto</th>
                                                        <th style={{width: 120}}>Cantidad</th>
                                                        <th style={{width: 160}}>Precio Unit.</th>
                                                        <th style={{width: 160}}>Subtotal</th>
                                                        <th style={{width: 80}}>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {editingItems.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="text-center">No hay productos para editar</td>
                                                        </tr>
                                                    ) : (
                                                        editingItems.map((it, idx) => (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <input 
                                                                        type="text" 
                                                                        className="form-control form-control-sm" 
                                                                        value={it.producto_nombre || ''} 
                                                                        onChange={(e) => { 
                                                                            const v = e.target.value; 
                                                                            const copy = [...editingItems]; 
                                                                            copy[idx].producto_nombre = v; 
                                                                            setEditingItems(copy); 
                                                                        }} 
                                                                        placeholder="Nombre del producto" 
                                                                    />
                                                                    <input 
                                                                        type="text" 
                                                                        className="form-control form-control-sm mt-1" 
                                                                        value={it.producto_codigo || ''} 
                                                                        onChange={(e) => { 
                                                                            const v = e.target.value; 
                                                                            const copy = [...editingItems]; 
                                                                            copy[idx].producto_codigo = v; 
                                                                            setEditingItems(copy); 
                                                                        }} 
                                                                        placeholder="Código" 
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        className="form-control form-control-sm text-end" 
                                                                        value={it.cantidad} 
                                                                        onChange={(e) => updateEditingItem(idx, 'cantidad', e.target.value)} 
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        step="0.01" 
                                                                        className="form-control form-control-sm text-end" 
                                                                        value={it.precio_unitario} 
                                                                        onChange={(e) => updateEditingItem(idx, 'precio_unitario', e.target.value)} 
                                                                    />
                                                                </td>
                                                                <td className="text-end">
                                                                    S/ {Number(it.subtotal || 0).toLocaleString()}
                                                                </td>
                                                                <td>
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger" 
                                                                        onClick={() => removeEditingRow(idx)}
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <th className="text-end">Totales:</th>
                                                        <th className="text-end">{editingTotals.total_items || 0}</th>
                                                        <th></th>
                                                        <th className="text-end">S/ {Number(editingTotals.total || 0).toLocaleString()}</th>
                                                        <th></th>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan="3" className="text-end">Total con comisión:</td>
                                                        <td className="text-end">S/ {Number(editingTotals.total_con_comision || 0).toLocaleString()}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => setShowEditor(false)}
                                        >
                                            Cerrar
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-primary" 
                                            onClick={saveEditedDetalle} 
                                            disabled={savingEdit}
                                        >
                                            {savingEdit ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>Guardar cambios</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}

export default Cotizaciones;
