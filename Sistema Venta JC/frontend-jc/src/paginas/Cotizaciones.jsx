import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationService, productService } from '../services/apiServices';

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
    const [productSearchResults, setProductSearchResults] = useState({});
    const [productSearchLoading, setProductSearchLoading] = useState({});

    // Simple debounce helper
    const debounce = (fn, delay = 300) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    const searchProductForRow = debounce(async (query, rowIndex) => {
        if (!query || query.trim().length < 1) {
            setProductSearchResults(prev => ({ ...prev, [rowIndex]: [] }));
            return;
        }
        try {
            setProductSearchLoading(prev => ({ ...prev, [rowIndex]: true }));
            const results = await productService.search(query);
            setProductSearchResults(prev => ({ ...prev, [rowIndex]: results }));
        } catch (error) {
            console.error('Error buscando productos:', error);
            setProductSearchResults(prev => ({ ...prev, [rowIndex]: [] }));
        } finally {
            setProductSearchLoading(prev => ({ ...prev, [rowIndex]: false }));
        }
    }, 300);

    const selectProductForRow = (rowIndex, product) => {
        const copy = [...editingItems];
        copy[rowIndex] = {
            ...copy[rowIndex],
            producto_id: product.id,
            producto_nombre: product.descripcion || product.nombre || '',
            producto_codigo: product.codigo || product.producto_codigo || '',
            precio_unitario: Number(product.pre_general || product.precio_unitario || 0),
            cantidad: copy[rowIndex].cantidad || 1,
        };
        copy[rowIndex].subtotal = Number(copy[rowIndex].cantidad || 0) * Number(copy[rowIndex].precio_unitario || 0);
        setEditingItems(copy);
        recalcEditingTotals(copy);
        // Limpiar resultados para ese row
        setProductSearchResults(prev => ({ ...prev, [rowIndex]: [] }));
    };

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

    const filteredCotizaciones = cotizaciones.filter(cot => 
        cot.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cot.id?.toString().includes(searchTerm) ||
        cot.total?.toString().includes(searchTerm)
    );

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
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i className="bi bi-file-text me-2"></i>
                    Cotizaciones Guardadas
                </h2>
                <button 
                    className="btn btn-outline-primary"
                    onClick={loadCotizaciones}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Actualizar
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            {/* Barra de búsqueda */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por cliente, ID o total..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="d-flex align-items-center">
                        <span className="me-2">
                            <i className="bi bi-info-circle text-info"></i>
                        </span>
                        <small className="text-muted">
                            Total de cotizaciones: {filteredCotizaciones.length}
                        </small>
                    </div>
                </div>
            </div>

            {/* Tabla de cotizaciones */}
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Método Pago</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCotizaciones.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-4">
                                    <div className="text-muted">
                                        <i className="bi bi-inbox display-4 d-block mb-2"></i>
                                        {searchTerm ? 'No se encontraron cotizaciones que coincidan con la búsqueda' : 'No hay cotizaciones guardadas'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCotizaciones.map((cotizacion) => (
                                <tr key={cotizacion.id}>
                                    <td>
                                        <span className="badge bg-info">
                                            COT-{cotizacion.id}
                                        </span>
                                    </td>
                                    <td>{formatDate(cotizacion.fecha_creacion)}</td>
                                    <td>
                                        <div>
                                            <strong>{cotizacion.cliente_nombre || 'Cliente no especificado'}</strong>
                                            {cotizacion.cliente_documento && (
                                                <div className="text-muted small">
                                                    {cotizacion.cliente_documento}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-secondary">
                                            {cotizacion.total_items || 0} items
                                        </span>
                                    </td>
                                    <td>
                                        <strong className="text-success">
                                            ${(cotizacion.total || 0).toLocaleString()}
                                        </strong>
                                        {cotizacion.comision_tarjeta > 0 && (
                                            <div className="text-muted small">
                                                +${cotizacion.comision_tarjeta.toLocaleString()} comisión
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${
                                            cotizacion.metodo_pago === 'efectivo' ? 'bg-success' :
                                            cotizacion.metodo_pago === 'tarjeta' ? 'bg-warning' :
                                            cotizacion.metodo_pago === 'yape' ? 'bg-info' :
                                            cotizacion.metodo_pago === 'plin' ? 'bg-dark' : 'bg-primary'
                                        }`}>
                                            {cotizacion.metodo_pago?.toUpperCase() || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-warning">
                                            Pendiente
                                        </span>
                                    </td>
                                    <td>
                                        <div className="btn-group" role="group">
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={async () => {
                                                    setSelectedCotizacion(cotizacion);
                                                    setShowDetalle(true);
                                                    await loadCotizacionDetalle(cotizacion.id);
                                                }}
                                                title="Ver detalle"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => convertirAVenta(cotizacion)}
                                                title="Ir a página de Venta"
                                            >
                                                <i className="bi bi-cart-check"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => openEditor(cotizacion)}
                                                title="Editar cotización"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => imprimirCotizacion(cotizacion)}
                                                title="Imprimir cotización"
                                            >
                                                <i className="bi bi-printer"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteCotizacion(cotizacion.id)}
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

            {/* Modal de detalle de cotización */}
            {showDetalle && selectedCotizacion && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title">
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
                                                <strong>Adelanto:</strong> ${selectedCotizacion.adelanto.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Totales</h6>
                                        <p className="mb-1">
                                            <strong>Total Items:</strong> {selectedCotizacion.total_items || 0}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Subtotal:</strong> ${(selectedCotizacion.subtotal || 0).toLocaleString()}
                                        </p>
                                        {selectedCotizacion.comision_tarjeta > 0 && (
                                            <p className="mb-1">
                                                <strong>Comisión Tarjeta:</strong> ${selectedCotizacion.comision_tarjeta.toLocaleString()}
                                            </p>
                                        )}
                                        <p className="mb-1">
                                            <strong className="text-success">Total Final:</strong> ${(selectedCotizacion.total || 0).toLocaleString()}
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
                                                            <td>${producto.precio_unitario.toLocaleString()}</td>
                                                            <td className="text-success">
                                                                <strong>${producto.subtotal.toLocaleString()}</strong>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="table-info">
                                                        <th colSpan="3" className="text-end">Total:</th>
                                                        <th className="text-success">
                                                            ${cotizacionDetalle.resumen?.total_productos?.toLocaleString() || '0'}
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

            {showEditor && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Editar Cotización {editingCotizacionId ? `COT-${editingCotizacionId}` : ''}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditor(false)} aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>Cliente:</strong> {selectedCotizacion?.cliente_nombre || 'No especificado'}
                                    </div>
                                    <div>
                                        <button className="btn btn-sm btn-outline-success me-2" onClick={addEditingRow}><i className="bi bi-plus"></i> Agregar fila</button>
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
                                                        <td style={{position: 'relative'}}>
                                                            <input type="text" className="form-control form-control-sm" value={it.producto_nombre || ''} onChange={(e) => { const v = e.target.value; const copy = [...editingItems]; copy[idx].producto_nombre = v; setEditingItems(copy); searchProductForRow(v, idx); }} placeholder="Buscar producto por nombre o código" />
                                                            <input type="text" className="form-control form-control-sm mt-1" value={it.producto_codigo || ''} onChange={(e) => { const v = e.target.value; const copy = [...editingItems]; copy[idx].producto_codigo = v; setEditingItems(copy); }} placeholder="Código" />
                                                            {/* Dropdown de resultados */}
                                                            {productSearchLoading[idx] && (
                                                                <div className="position-absolute bg-white border rounded p-2" style={{zIndex: 50, top: '68px', left: 0, right: 0}}>
                                                                    <div className="small text-muted">Buscando...</div>
                                                                </div>
                                                            )}
                                                            {productSearchResults[idx] && productSearchResults[idx].length > 0 && (
                                                                <div className="position-absolute bg-white border rounded" style={{zIndex: 50, top: '68px', left: 0, right: 0, maxHeight: 240, overflowY: 'auto'}}>
                                                                    {productSearchResults[idx].map(prod => (
                                                                        <div key={prod.id} className="p-2 list-group-item list-group-item-action" style={{cursor: 'pointer'}} onClick={() => selectProductForRow(idx, prod)}>
                                                                            <div><strong>{prod.descripcion}</strong> <small className="text-muted">{prod.codigo}</small></div>
                                                                            <div className="small text-muted">S/ {Number(prod.pre_general || prod.precio_unitario || 0).toLocaleString()}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <input type="number" min="0" className="form-control form-control-sm text-end" value={it.cantidad} onChange={(e) => updateEditingItem(idx, 'cantidad', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input type="number" min="0" step="0.01" className="form-control form-control-sm text-end" value={it.precio_unitario} onChange={(e) => updateEditingItem(idx, 'precio_unitario', e.target.value)} />
                                                        </td>
                                                        <td className="text-end">
                                                            S/ {Number(it.subtotal || 0).toLocaleString()}
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeEditingRow(idx)}><i className="bi bi-trash"></i></button>
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditor(false)}>Cerrar</button>
                                <button type="button" className="btn btn-primary" onClick={saveEditedDetalle} disabled={savingEdit}>
                                    {savingEdit ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                                    ) : (
                                        <>Guardar cambios</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal editor inline para editar items de una cotización */}
            <div className="modal fade" id="cotizacionEditorModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">Editar Cotización {editingCotizacionId ? `COT-${editingCotizacionId}` : ''}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Cliente:</strong> {selectedCotizacion?.cliente_nombre || 'No especificado'}
                                </div>
                                <div>
                                    <button className="btn btn-sm btn-outline-success me-2" onClick={addEditingRow}><i className="bi bi-plus"></i> Agregar fila</button>
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
                                                        <input type="text" className="form-control form-control-sm" value={it.producto_nombre || ''} onChange={(e) => { const v = e.target.value; const copy = [...editingItems]; copy[idx].producto_nombre = v; setEditingItems(copy); }} placeholder="Nombre del producto" />
                                                        <input type="text" className="form-control form-control-sm mt-1" value={it.producto_codigo || ''} onChange={(e) => { const v = e.target.value; const copy = [...editingItems]; copy[idx].producto_codigo = v; setEditingItems(copy); }} placeholder="Código" />
                                                    </td>
                                                    <td>
                                                        <input type="number" min="0" className="form-control form-control-sm text-end" value={it.cantidad} onChange={(e) => updateEditingItem(idx, 'cantidad', e.target.value)} />
                                                    </td>
                                                    <td>
                                                        <input type="number" min="0" step="0.01" className="form-control form-control-sm text-end" value={it.precio_unitario} onChange={(e) => updateEditingItem(idx, 'precio_unitario', e.target.value)} />
                                                    </td>
                                                    <td className="text-end">
                                                        S/ {Number(it.subtotal || 0).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeEditingRow(idx)}><i className="bi bi-trash"></i></button>
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
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" className="btn btn-primary" onClick={saveEditedDetalle} disabled={savingEdit}>
                                {savingEdit ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                                ) : (
                                    <>Guardar cambios</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cotizaciones;