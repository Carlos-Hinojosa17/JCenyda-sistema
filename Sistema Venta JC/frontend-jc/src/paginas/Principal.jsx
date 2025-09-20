import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, salesService, quotationService } from '../services/apiServices';

export default function Principal() {
    const [_metrics, setMetrics] = useState({
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
    const [_actividadReciente, setActividadReciente] = useState([]);
    const [ventasHoy, setVentasHoy] = useState(0);
    const [montoVentasHoy, setMontoVentasHoy] = useState(0);

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
                
                // Calcular ventas del día
                const hoy = new Date();
                const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
                
                const ventasDelDia = mapped.filter(v => {
                    const fechaVenta = new Date(v.fecha);
                    return fechaVenta >= inicioDelDia && fechaVenta < finDelDia;
                });
                
                const cantidadVentasHoy = ventasDelDia.length;
                const montoTotalHoy = ventasDelDia.reduce((total, venta) => {
                    return total + (Number(venta.total) || 0);
                }, 0);
                
                setVentasHoy(cantidadVentasHoy);
                setMontoVentasHoy(montoTotalHoy);
                
                // Generar actividad reciente basada en ventas
                const actividadVentas = mapped.slice(0, 5).map(v => ({
                    tipo: 'venta',
                    id: v.id,
                    descripcion: `Venta ${v.id} registrada`,
                    detalles: `Cliente: ${v.clientes?.nombre || 'N/A'} - Total: S/ ${Number(v.total || 0).toLocaleString()}`,
                    fecha: v.fecha || new Date().toISOString()
                }));
                
                // cargar cotizaciones para el card
                try {
                    const resp = await quotationService.getAll();
                    // En el servicio Cotizaciones, getAll devuelve response.data con la propiedad data
                    const cotis = resp?.data || resp || [];
                    setCotizacionesLista(cotis.slice(0, 20));
                    
                    // Agregar actividad de cotizaciones
                    const actividadCotizaciones = cotis.slice(0, 3).map(c => ({
                        tipo: 'cotizacion',
                        id: c.id,
                        descripcion: `Cotización COT-${c.id} creada`,
                        detalles: `Cliente: ${c.cliente_nombre || 'N/A'} - Total: S/ ${Number(c.total || c.total_items || 0).toLocaleString()}`,
                        fecha: c.fecha || c.created_at || new Date().toISOString()
                    }));
                    
                    // Combinar y ordenar por fecha
                    const todasActividades = [...actividadVentas, ...actividadCotizaciones]
                        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                        .slice(0, 10);
                    
                    setActividadReciente(todasActividades);
                } catch (err) {
                    console.error('No se pudieron cargar cotizaciones:', err);
                    // Si no hay cotizaciones, usar solo actividad de ventas
                    setActividadReciente(actividadVentas);
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

    const _obtenerDatos = () => {
        loadMetrics();
    };

    // fallback display counts en caso el conteo principal no se haya actualizado
    const _displayedPendientes = (pendientesCount && pendientesCount > 0) ? pendientesCount : (ventasPendientesLista.filter(v => (v._estadoNormalized || (v.estado||'')).toString().toLowerCase() === 'pendiente').length);
    const _displayedParciales = (parcialesCount && parcialesCount > 0) ? parcialesCount : (ventasPendientesLista.filter(v => (v._estadoNormalized || (v.estado||'')).toString().toLowerCase().includes('parcial')).length);

    return (
        <div 
            className='d-flex flex-column min-vh-100'
            style={{
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                width: '100%',
                overflow: 'hidden'
            }}
        >
            {/* CSS for pulse animation */}
            <style>
                {`
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
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
                                <i className='bi bi-speedometer2' style={{ fontSize: '2rem', color: 'white' }}></i>
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
                                    Dashboard Principal
                                </h1>
                                <p className='mb-0 opacity-75 mt-1' style={{ fontSize: '1.1rem' }}>
                                    Panel de control ejecutivo
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
                                <i className='bi bi-building me-2'></i>
                                JC ENYDA AUTOPARTS
                            </span>
                            <span 
                                className='badge px-3 py-2'
                                style={{
                                    background: 'rgba(240, 152, 54, 0.2)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(240, 152, 54, 0.3)'
                                }}
                            >
                                <i className='bi bi-calendar3 me-2'></i>
                                {new Date().toLocaleDateString('es-ES', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                    
                    <div className='d-flex align-items-center gap-3'>
                        
                        {/* Botones de acción mejorados */}
                        <div className='d-flex gap-2'>
                            <button 
                                className='btn d-flex align-items-center gap-2' 
                                onClick={loadMetrics} 
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
                                onClick={() => navigate('/layouts/venta')}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(240, 152, 54, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(240, 152, 54, 0.4)';
                                }}
                            >
                                <i className='bi bi-cart-plus'></i>
                                <span>Nueva Venta</span>
                            </button>
                        </div>
                        
                        {/* Métrica de Ventas */}
                        <div 
                            className='d-flex align-items-center px-4 py-3'
                            style={{
                                background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                borderRadius: '12px',
                                color: 'white',
                                boxShadow: '0 4px 16px rgba(240, 152, 54, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                minWidth: '200px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 152, 54, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0px)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(240, 152, 54, 0.3)';
                            }}
                        >
                            {/* Icono */}
                            <div 
                                className='me-3 d-flex align-items-center justify-content-center'
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <i 
                                    className='bi bi-graph-up-arrow' 
                                    style={{ 
                                        fontSize: '1.5rem',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                    }}
                                ></i>
                            </div>
                            
                            {/* Contenido */}
                            <div className='flex-grow-1'>
                                <div className='d-flex align-items-baseline justify-content-between'>
                                    {/* Número principal y etiqueta */}
                                    <div>
                                        <div 
                                            className='fw-bold d-flex align-items-baseline gap-2'
                                            style={{
                                                fontSize: '1.8rem',
                                                lineHeight: '1.2',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {loading ? (
                                                <span 
                                                    className='spinner-border spinner-border-sm'
                                                    style={{ width: '20px', height: '20px' }}
                                                ></span>
                                            ) : (
                                                <span>{ventasHoy}</span>
                                            )}
                                            <span 
                                                style={{ 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: '600',
                                                    opacity: 0.9,
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                VENTAS
                                            </span>
                                        </div>
                                        
                                        {/* Monto */}
                                        <div 
                                            className='fw-semibold'
                                            style={{ 
                                                fontSize: '1rem', 
                                                opacity: 0.95,
                                                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                                marginTop: '2px'
                                            }}
                                        >
                                            S/ {loading ? '...' : montoVentasHoy.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    
                                    {/* Fecha */}
                                    <div className='text-end'>
                                        <div 
                                            style={{ 
                                                fontSize: '0.75rem', 
                                                opacity: 0.8,
                                                fontWeight: '500',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            HOY
                                        </div>
                                        <div 
                                            style={{ 
                                                fontSize: '0.7rem', 
                                                opacity: 0.7,
                                                fontWeight: '500'
                                            }}
                                        >
                                            {new Date().toLocaleDateString('es-ES', { 
                                                day: '2-digit', 
                                                month: 'short' 
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div 
                className='flex-grow-1 p-4'
                style={{
                    height: 'calc(100vh - 140px)',
                    overflow: 'hidden'
                }}
            >
                {error && (
                    <div 
                        className='alert mb-4'
                        style={{
                            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                            border: '1px solid #f5c6cb',
                            borderRadius: '12px',
                            color: '#721c24'
                        }}
                    >
                        <i className='bi bi-exclamation-triangle me-2'></i>
                        {error}
                    </div>
                )}

                {/* Main Content Mejorado */}
                <div 
                    className='flex-grow-1 p-4 p-md-5'
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px 24px 0 0',
                        marginTop: '-20px',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    <div className='row g-4' style={{ height: '100%' }}>
                    {/* Reportes Column */}
                    <div className='col-12 col-lg-6' style={{ height: '100%' }}>
                        <div 
                            className='card border-0 shadow-sm'
                            style={{
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                height: '100%'
                            }}
                        >
                            <div className='card-body p-4'>
                                <div className='d-flex justify-content-between align-items-center mb-3'>
                                    <div>
                                        <h5 className='mb-1 fw-bold d-flex align-items-center' style={{ color: '#2C3E50' }}>
                                            <i className='bi bi-bar-chart-line-fill me-2' style={{ color: '#F09836' }}></i>
                                            Reportes
                                        </h5>
                                        <div className='small text-muted'>
                                            Pendientes: <span className='fw-semibold' style={{ color: '#F09836' }}>{pendientesCount}</span> • 
                                            Parciales: <span className='fw-semibold' style={{ color: '#17a2b8' }}>{parcialesCount}</span>
                                        </div>
                                    </div>
                                    <button 
                                        className='btn btn-sm'
                                        style={{
                                            background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: '500'
                                        }}
                                        onClick={() => navigate('/layouts/reportes')}
                                    >
                                        Ver Reportes <i className='bi bi-arrow-right ms-1'></i>
                                    </button>
                                </div>

                                <div 
                                    style={{ 
                                        height: 'calc(100vh - 280px)', 
                                        overflowY: 'auto',
                                        paddingRight: '8px'
                                    }}
                                >
                                    {ventasPendientesLista.length === 0 ? (
                                        <div 
                                            className='text-center py-5 text-muted'
                                            style={{
                                                background: 'rgba(240, 152, 54, 0.05)',
                                                borderRadius: '12px',
                                                border: '1px dashed rgba(240, 152, 54, 0.3)'
                                            }}
                                        >
                                            <i className='bi bi-check-circle display-6 mb-2' style={{ color: '#F09836' }}></i>
                                            <div>No hay ventas pendientes</div>
                                        </div>
                                    ) : (
                                        <div className='d-flex flex-column gap-2'>
                                            {ventasPendientesLista.map((v) => (
                                                <div 
                                                    key={v.id} 
                                                    className='p-3 rounded cursor-pointer'
                                                    style={{
                                                        background: 'rgba(240, 152, 54, 0.05)',
                                                        border: '1px solid rgba(240, 152, 54, 0.1)',
                                                        transition: 'all 0.3s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => navigate(`/layouts/reportes?ventaId=${v.id}&estado=${v._estadoNormalized || ''}`)}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = 'rgba(240, 152, 54, 0.1)';
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(240, 152, 54, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = 'rgba(240, 152, 54, 0.05)';
                                                        e.target.style.transform = 'translateY(0px)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <div className='d-flex justify-content-between align-items-start'>
                                                        <div>
                                                            <div className='fw-bold mb-1' style={{ color: '#2C3E50' }}>
                                                                ID {v.id} - {v.clientes?.nombre || 'Cliente N/A'}
                                                            </div>
                                                            <div className='small text-muted'>
                                                                {new Date(v.fecha).toLocaleDateString('es-ES')} • {new Date(v.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className='text-end'>
                                                            <div className='fw-bold mb-1' style={{ color: '#F09836' }}>
                                                                S/ {Number(v.total || 0).toLocaleString()}
                                                            </div>
                                                            <span 
                                                                className='badge'
                                                                style={{
                                                                    background: (v._estadoNormalized || v.estado || '').includes('parcial') 
                                                                        ? 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)'
                                                                        : 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                                                    color: 'white',
                                                                    fontSize: '0.7rem',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                {(v._estadoNormalized || v.estado || 'pendiente').includes('parcial') ? 'PARCIAL' : 'PENDIENTE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cotizaciones Column */}
                    <div className='col-12 col-lg-6' style={{ height: '100%' }}>
                        <div 
                            className='card border-0 shadow-sm'
                            style={{
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                height: '100%'
                            }}
                        >
                            <div className='card-body p-4'>
                                <div className='d-flex justify-content-between align-items-center mb-3'>
                                    <div>
                                        <h5 className='mb-1 fw-bold d-flex align-items-center' style={{ color: '#2C3E50' }}>
                                            <i className='bi bi-file-text-fill me-2' style={{ color: '#20c997' }}></i>
                                            Cotizaciones
                                        </h5>
                                        <div className='small text-muted'>Últimas cotizaciones realizadas</div>
                                    </div>
                                    <button 
                                        className='btn btn-sm'
                                        style={{
                                            background: 'linear-gradient(135deg, #20c997 0%, #17a2b8 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: '500'
                                        }}
                                        onClick={() => navigate('/layouts/cotizaciones')}
                                    >
                                        Ver Cotizaciones <i className='bi bi-arrow-right ms-1'></i>
                                    </button>
                                </div>

                                <div style={{ height: 'calc(100vh - 280px)', overflowY: 'auto', padding: '16px 0' }}>
                                    {cotizacionesLista.length === 0 ? (
                                        <div 
                                            className='text-center py-5 text-muted'
                                            style={{
                                                background: 'rgba(32, 201, 151, 0.05)',
                                                borderRadius: '12px',
                                                border: '1px dashed rgba(32, 201, 151, 0.3)'
                                            }}
                                        >
                                            <i className='bi bi-file-plus display-6 mb-2' style={{ color: '#20c997' }}></i>
                                            <div>No hay cotizaciones</div>
                                        </div>
                                    ) : (
                                        <div className='d-flex flex-column gap-2'>
                                            {cotizacionesLista.map((c) => (
                                                <div 
                                                    key={c.id} 
                                                    className='p-3 rounded cursor-pointer'
                                                    style={{
                                                        background: 'rgba(32, 201, 151, 0.05)',
                                                        border: '1px solid rgba(32, 201, 151, 0.1)',
                                                        transition: 'all 0.3s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => navigate(`/layouts/cotizaciones?cotId=${c.id}`)}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = 'rgba(32, 201, 151, 0.1)';
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(32, 201, 151, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = 'rgba(32, 201, 151, 0.05)';
                                                        e.target.style.transform = 'translateY(0px)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <div className='d-flex justify-content-between align-items-start'>
                                                        <div>
                                                            <div className='fw-bold mb-1' style={{ color: '#2C3E50' }}>
                                                                COT-{c.id} - {c.cliente_nombre || 'Cliente N/A'}
                                                            </div>
                                                            <div className='small text-muted'>
                                                                {new Date(c.fecha || c.created_at).toLocaleDateString('es-ES')} • {new Date(c.fecha || c.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className='text-end'>
                                                            <div className='fw-bold' style={{ color: '#20c997' }}>
                                                                S/ {Number(c.total || c.total_items || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
