import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, salesService, quotationService } from '../services/apiServices';

export default function Principal() {
    const [metrics, setMetrics] = useState({
        ventas: 0,
        productos: 0,
        clientes: 0,
        stockBajo: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
        const [pendientesCount, setPendientesCount] = useState(0);
        const [parcialesCount, setParcialesCount] = useState(0);
            const [ventasPendientesLista, setVentasPendientesLista] = useState([]);
            const [cotizacionesLista, setCotizacionesLista] = useState([]);

        const navigate = useNavigate();

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getMetrics();
            setMetrics(data || {});
            setError('');
            // también cargar conteo de ventas por estado
            try {
                const ventas = await salesService.getAll();
                // Normalizar estado por venta y luego calcular conteos basados en la normalización
                const mapped = (ventas || []).map(v => {
                    const estadoCalc = (v.estado || (Number(v.adelanto || 0) >= Number(v.total || 0) ? 'pagada' : 'pendiente')).toString().toLowerCase();
                    return { ...v, _estadoNormalized: estadoCalc };
                });

                const pendientesList = mapped.filter(v => v._estadoNormalized === 'pendiente' || v._estadoNormalized.includes('parcial')).slice(0, 10);
                const pendientes = mapped.filter(v => v._estadoNormalized === 'pendiente').length;
                const parciales = mapped.filter(v => v._estadoNormalized.includes('parcial')).length;
                setPendientesCount(pendientes);
                setParcialesCount(parciales);
                setVentasPendientesLista(pendientesList);
                // cargar cotizaciones para el card
                try {
                    const resp = await quotationService.getAll();
                    // En el servicio Cotizaciones, getAll devuelve response.data con la propiedad data
                    const cotis = resp?.data || resp || [];
                    setCotizacionesLista(cotis.slice(0, 20));
                } catch (err) {
                    console.error('No se pudieron cargar cotizaciones:', err);
                }
            } catch (e) {
                console.error('No se pudieron cargar ventas para conteos:', e);
            }
        } catch (error) {
            setError(error.message || 'Error al cargar métricas');
            console.error('Error loading metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    // fallback display counts en caso el conteo principal no se haya actualizado
    const displayedPendientes = (pendientesCount && pendientesCount > 0) ? pendientesCount : (ventasPendientesLista.filter(v => (v._estadoNormalized || (v.estado||'')).toString().toLowerCase() === 'pendiente').length);
    const displayedParciales = (parcialesCount && parcialesCount > 0) ? parcialesCount : (ventasPendientesLista.filter(v => (v._estadoNormalized || (v.estado||'')).toString().toLowerCase().includes('parcial')).length);

    return (
        <div className='container-fluid'>
            <div className='d-flex justify-content-between align-items-center mb-4'>
                <div>
                    <h2 className='mb-0'>Dashboard Principal</h2>
                    <small className='text-muted'>Resumen rápido de ventas, productos y clientes</small>
                </div>
                <div>
                    <button className='btn btn-sm btn-outline-secondary me-2' onClick={loadMetrics} disabled={loading}>
                        {loading ? (<span className='spinner-border spinner-border-sm'></span>) : (<i className='bi bi-arrow-clockwise'></i>)}
                        <span className='ms-2'>Actualizar</span>
                    </button>
                    <button className='btn btn-sm btn-primary'>Ir a ventas</button>
                </div>
            </div>

            {error && (
                <div className='alert alert-warning' role='alert'>
                    {error}
                </div>
            )}

            <div className='row g-3'>
                <div className='col-12 col-lg-6'>
                    <div className='card mb-3 shadow-sm'>
                        <div className='card-body'>
                            <div className='d-flex justify-content-between align-items-center'>
                                <div>
                                    <h6 className='mb-1'>Reportes</h6>
                                    <div className='small text-muted'>Ventas pendientes: <strong>{pendientesCount}</strong> · Parciales: <strong>{parcialesCount}</strong></div>
                                </div>
                                <div className='text-end'>
                                    <button className='btn btn-sm btn-outline-primary' onClick={() => navigate('/layouts/reportes')}>Ir a reportes <i className='bi bi-arrow-right ms-2'></i></button>
                                </div>
                            </div>

                            <div className='mt-3'>
                                <div className='small text-muted mb-2'>Ventas pendientes y parciales (últimas 10)</div>
                                <div style={{maxHeight: '220px', overflowY: 'auto'}} className='list-group'>
                                    {ventasPendientesLista.length === 0 && (
                                        <div className='list-group-item text-muted'>No hay ventas pendientes o parciales</div>
                                    )}
                                    {ventasPendientesLista.map((v) => (
                                        <button key={v.id} className='list-group-item list-group-item-action d-flex justify-content-between align-items-start' onClick={() => navigate(`/layouts/reportes?ventaId=${v.id}&estado=${v._estadoNormalized || ''}`)}>
                                            <div>
                                                <div className='fw-bold'>ID {v.id} - {v.clientes?.nombre || 'Cliente N/A'}</div>
                                                <div className='small text-muted'>{new Date(v.fecha).toLocaleString()}</div>
                                            </div>
                                            <div className='text-end'>
                                                <div className='fw-semibold'>S/ {Number(v.total || 0).toLocaleString()}</div>
                                                <div className='small text-muted'>{(v._estadoNormalized || v.estado || (Number(v.adelanto||0) >= Number(v.total||0) ? 'pagada' : 'pendiente')).toString()}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='col-12 col-lg-6'>
                    <div className='card mb-3 shadow-sm'>
                        <div className='card-body'>
                            <div className='d-flex justify-content-between align-items-center'>
                                <div>
                                    <h6 className='mb-1'>Cotizaciones</h6>
                                    <div className='small text-muted'>Últimas cotizaciones</div>
                                </div>
                                <div className='text-end'>
                                    <button className='btn btn-sm btn-outline-primary' onClick={() => navigate('/layouts/cotizaciones')}>Ir a cotizaciones <i className='bi bi-arrow-right ms-2'></i></button>
                                </div>
                            </div>

                            <div className='mt-3'>
                                <div style={{maxHeight: '220px', overflowY: 'auto'}} className='list-group'>
                                    {cotizacionesLista.length === 0 && (
                                        <div className='list-group-item text-muted'>No hay cotizaciones</div>
                                    )}
                                    {cotizacionesLista.map((c) => (
                                        <button key={c.id} className='list-group-item list-group-item-action d-flex justify-content-between align-items-start' onClick={() => navigate(`/layouts/cotizaciones?cotId=${c.id}`)}>
                                            <div>
                                                <div className='fw-bold'>COT-{c.id} - {c.cliente_nombre || 'Cliente N/A'}</div>
                                                <div className='small text-muted'>{new Date(c.fecha || c.created_at).toLocaleString()}</div>
                                            </div>
                                            <div className='text-end'>
                                                <div className='fw-semibold'>S/ {Number(c.total || c.total_items || 0).toLocaleString()}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='col-12 col-sm-6 col-md-3'>
                    <div className='card h-100 shadow-sm'>
                        <div className='card-body d-flex align-items-center'>
                            <div className='me-3 display-6 text-primary'><i className='bi bi-cart-fill'></i></div>
                            <div>
                                <div className='text-muted small'>Ventas</div>
                                <div className='h4 mb-0'>{loading ? (<span className='spinner-border spinner-border-sm'></span>) : (metrics.ventas || 0)}</div>
                                <div className='text-muted small'>Ventas totales registradas</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='col-12 col-sm-6 col-md-3'>
                    <div className='card h-100 shadow-sm'>
                        <div className='card-body d-flex align-items-center'>
                            <div className='me-3 display-6 text-success'><i className='bi bi-box-seam'></i></div>
                            <div>
                                <div className='text-muted small'>Productos</div>
                                <div className='h4 mb-0'>{loading ? (<span className='spinner-border spinner-border-sm'></span>) : (metrics.productos || 0)}</div>
                                <div className='text-muted small'>Total productos en catálogo</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='col-12 col-sm-6 col-md-3'>
                    <div className='card h-100 shadow-sm'>
                        <div className='card-body d-flex align-items-center'>
                            <div className='me-3 display-6 text-info'><i className='bi bi-people-fill'></i></div>
                            <div>
                                <div className='text-muted small'>Clientes</div>
                                <div className='h4 mb-0'>{loading ? (<span className='spinner-border spinner-border-sm'></span>) : (metrics.clientes || 0)}</div>
                                <div className='text-muted small'>Clientes registrados</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='col-12 col-sm-6 col-md-3'>
                    <div className='card h-100 shadow-sm'>
                        <div className='card-body d-flex align-items-center'>
                            <div className='me-3 display-6 text-warning'><i className='bi bi-exclamation-triangle-fill'></i></div>
                            <div>
                                <div className='text-muted small'>Stock bajo</div>
                                <div className='h4 mb-0'>{loading ? (<span className='spinner-border spinner-border-sm'></span>) : (metrics.stockBajo || 0)}</div>
                                <div className='text-muted small'>Productos con stock crítico</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='row mt-4'>
                <div className='col-12 col-lg-8'>
                    <div className='card shadow-sm'>
                        <div className='card-body'>
                            <h5 className='card-title'>Actividad reciente</h5>
                            <p className='text-muted small'>Aquí puedes agregar gráficos o una lista de las últimas ventas para tener contexto rápido.</p>
                            <div className='border rounded p-3 text-center text-muted'>Placeholder para gráfico / lista</div>
                        </div>
                    </div>
                </div>
                <div className='col-12 col-lg-4'>
                    <div className='card shadow-sm'>
                        <div className='card-body'>
                            <h5 className='card-title'>Acciones rápidas</h5>
                            <div className='d-grid gap-2'>
                                <button className='btn btn-outline-primary'>Nueva venta</button>
                                <button className='btn btn-outline-secondary'>Nuevo cliente</button>
                                <button className='btn btn-outline-success'>Agregar producto</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
