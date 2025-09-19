import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { salesService } from '../services/apiServices';

export default function Reportes() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoVenta, setPagoVenta] = useState(null);
  const [pagoData, setPagoData] = useState({ monto: '', metodo_pago: 'efectivo', codigo_operacion: '', ultimos_digitos: '', comision_tarjeta: '' });
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchParams] = useSearchParams();

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (!ventas.length) return { totalVentas: 0, ingresosHoy: 0, ingresosMes: 0, ventasPendientes: 0, ventasPagadas: 0 };
    
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    return ventas.reduce((acc, venta) => {
      const fechaVenta = new Date(venta.fecha);
      const total = Number(venta.total || 0);
      const estado = venta.estado || (Number(venta.adelanto || 0) >= total ? 'pagada' : 'pendiente');
      
      acc.totalVentas += total;
      
      if (fechaVenta >= inicioHoy) {
        acc.ingresosHoy += total;
      }
      
      if (fechaVenta >= inicioMes) {
        acc.ingresosMes += total;
      }
      
      if (estado.toLowerCase() === 'pendiente' || estado.toLowerCase().includes('parcial')) {
        acc.ventasPendientes += 1;
      } else if (estado.toLowerCase() === 'pagada') {
        acc.ventasPagadas += 1;
      }
      
      return acc;
    }, { totalVentas: 0, ingresosHoy: 0, ingresosMes: 0, ventasPendientes: 0, ventasPagadas: 0 });
  }, [ventas]);

  useEffect(() => { loadVentas(); }, []);

  useEffect(() => {
    // Leer params tras cargar ventas
    const ventaId = searchParams.get('ventaId');
    const estadoParam = searchParams.get('estado');
    if (estadoParam) setSelectedEstado(estadoParam);
    if (ventaId) {
      // Abrir detalle después de un pequeño delay para asegurar que loadVentas ya corrió
      setTimeout(() => { openDetalle(ventaId); }, 300);
    }
  }, [searchParams]);

  const loadVentas = async () => {
    try { setLoading(true); const data = await salesService.getAll(); setVentas(data || []); }
    catch (err) { console.error('Error al cargar ventas:', err); alert('Error al cargar ventas'); }
    finally { setLoading(false); }
  };

  const openDetalle = async (id) => {
    try {
      setLoadingDetalle(true);
      const detalle = await salesService.getById(id);
      if (detalle && (!detalle.detalle || detalle.detalle.length === 0)) {
        try { const fallback = await (await import('../services/apiServices')).detailService.getByVentaId(id); detalle.detalle = fallback || []; }
        catch (err) { console.error('Fallback detalle error:', err); detalle.detalle = []; }
      }
      setSelectedVenta(detalle);
    } catch (err) { console.error('Error al obtener detalle:', err); alert('Error al obtener detalle de la venta'); }
    finally { setLoadingDetalle(false); }
  };

  const getErrorMessage = (err) => {
    try {
      if (!err) return 'Error desconocido';
      if (typeof err === 'string' && err.trim() !== '') return err.trim();
      if (err.response && err.response.data) {
        const data = err.response.data; const candidate = data.message || (typeof data === 'string' ? data : JSON.stringify(data));
        if (candidate && candidate.toString().trim() !== '') return candidate.toString();
      }
      if (err.message && err.message.toString().trim() !== '') return err.message.toString();
      const str = JSON.stringify(err); if (str && str !== '{}' && str !== 'null') return str;
      return 'Error desconocido';
    } catch {return 'Error desconocido'; }
  };

  const anular = async (venta) => {
    const confirm = window.confirm(`¿Está seguro que desea anular la venta ${venta.id}? Esta acción requiere credenciales de administrador.`);
    if (!confirm) return;
    const usuario = window.prompt('Usuario administrador:'); if (!usuario) return alert('Usuario requerido');
    const contrasena = window.prompt('Contraseña del administrador:'); if (!contrasena) return alert('Contraseña requerida');
    try { setLoading(true); const res = await (await import('../services/apiServices')).salesService.anularVenta(venta.id, { usuario, contrasena }); alert(res.message || 'Venta anulada'); loadVentas(); if (selectedVenta && selectedVenta.id === venta.id) setSelectedVenta(null); }
    catch (err) { console.error('Error al anular:', err); alert(getErrorMessage(err) || 'No se pudo anular la venta'); }
    finally { setLoading(false); }
  };

  const getEstadoBadge = (venta) => {
    const estadoReal = (venta && venta.estado) || (Number(venta?.adelanto || 0) >= Number(venta?.total || 0) ? 'pagada' : 'pendiente');
    const estadoLower = (estadoReal || '').toString().toLowerCase();
    let className = 'bg-secondary';
    switch (estadoLower) {
      case 'pagada': className = 'bg-success text-white'; break;
      case 'pendiente': className = 'bg-warning text-dark'; break;
      case 'anulada':
      case 'cancelada': className = 'bg-danger text-white'; break;
      case 'parcial':
      case 'parcialmente_pagada': className = 'bg-info text-white'; break;
      default: className = 'bg-secondary text-white';
    }
    const label = estadoReal ? estadoReal.toString() : String(estadoReal);
    const display = label ? label.charAt(0).toUpperCase() + label.slice(1) : 'N/A';
    return { className, display };
  };

  const reloadDetalle = async (venta) => {
    try { setLoadingDetalle(true); const fallback = await (await import('../services/apiServices')).detailService.getByVentaId(venta.id); const updated = { ...venta, detalle: fallback || [] }; setSelectedVenta(updated); }
    catch (err) { console.error('Error al recargar detalle:', err); alert('No se pudo recargar el detalle'); }
    finally { setLoadingDetalle(false); }
  };

  // Filtrado de ventas
  const filteredVentas = useMemo(() => {
    let filtered = (ventas || []).filter(v => {
      if (selectedEstado === 'todos') return true;
      const estadoLower = (v.estado || (Number(v.adelanto||0) >= Number(v.total||0) ? 'pagada' : 'pendiente')).toString().toLowerCase();
      if (selectedEstado === 'parcial') return estadoLower.includes('parcial');
      return estadoLower === selectedEstado;
    });
    
    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(v => 
        (v.clientes?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.clientes?.documento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.usuarios?.nombre || v.usuarios?.usuario || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por rango de fechas
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(v => {
        const fechaVenta = new Date(v.fecha);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
        
        if (start && fechaVenta < start) return false;
        if (end && fechaVenta > end) return false;
        return true;
      });
    }
    
    return filtered;
  }, [ventas, selectedEstado, searchTerm, dateRange]);

  // Cálculos de paginación
  const totalItems = filteredVentas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVentas.slice(startIndex, endIndex);

  // Función para cambiar página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll al top de la tabla cuando cambie de página
    document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Función para cambiar items por página
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset a primera página
  };

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEstado, searchTerm, dateRange]);

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Encabezado corporativo JC ENYDA */}
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ 
              background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 25%, #17a2b8 100%)',
              borderRadius: '0 0 30px 30px',
              marginBottom: '2rem'
            }}>
              <div className="card-body text-white p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                  <div className="text-center text-md-start mb-3 mb-md-0">
                    <h1 className="display-6 fw-bold mb-2 fade-in-up">
                      <i className="bi bi-graph-up-arrow me-3"></i>
                      Reportes de Ventas
                    </h1>
                    <p className="lead mb-0 opacity-75">Panel de control y análisis JC ENYDA</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-light btn-lg shadow-sm"
                      onClick={loadVentas}
                      disabled={loading}
                    >
                      <i className={`bi ${loading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'} me-2`}></i>
                      Actualizar
                    </button>
                    <button className="btn btn-outline-light btn-lg">
                      <i className="bi bi-download me-2"></i>
                      Exportar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de métricas */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Ingreso Total</h6>
                <h3 className="card-text fw-bold text-success mb-0">
                  S/ {metrics.totalVentas.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Ingresos Hoy</h6>
                <h3 className="card-text fw-bold text-warning mb-0">
                  S/ {metrics.ingresosHoy.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Ventas Pagadas</h6>
                <h3 className="card-text fw-bold text-primary mb-0">
                  {metrics.ventasPagadas}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Ventas por Revisar</h6>
                <h3 className="card-text fw-bold text-danger mb-0">
                  {metrics.ventasPendientes}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de filtros mejorado */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-search me-2"></i>Buscar cliente o vendedor
                </label>
                <input 
                  type="text" 
                  className="form-control form-control-lg" 
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-calendar-range me-2"></i>Rango de fechas
                </label>
                <div className="d-flex gap-2">
                  <div className="position-relative">
                    <input 
                      type="date" 
                      className="form-control" 
                      placeholder="Fecha inicio"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <i className="bi bi-calendar3 position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                  </div>
                  <div className="position-relative">
                    <input 
                      type="date" 
                      className="form-control" 
                      placeholder="Fecha fin"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <i className="bi bi-calendar3 position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                  </div>
                </div>
                <div className="d-flex gap-1 mt-2">
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      const hoy = new Date().toISOString().split('T')[0];
                      setDateRange({start: hoy, end: hoy});
                    }}
                  >
                    Hoy
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      const hoy = new Date();
                      const semanaAntes = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
                      setDateRange({
                        start: semanaAntes.toISOString().split('T')[0],
                        end: hoy.toISOString().split('T')[0]
                      });
                    }}
                  >
                    7 días
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      const hoy = new Date();
                      const mesAntes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                      setDateRange({
                        start: mesAntes.toISOString().split('T')[0],
                        end: hoy.toISOString().split('T')[0]
                      });
                    }}
                  >
                    Este mes
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setDateRange({start: '', end: ''})}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </div>
              </div>              
              <div className="col-12">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-filter me-2"></i>Filtrar por estado
                </label>
                <div className="btn-group w-100" role="group">
                  {['todos','pagada','pendiente','parcial','anulada'].map((st) => {
                    const labelMap = { todos: 'Todas', pagada: 'Pagadas', pendiente: 'Pendientes', parcial: 'Parciales', anulada: 'Anuladas' };
                    const iconMap = { todos: 'bi-list', pagada: 'bi-check-circle', pendiente: 'bi-clock', parcial: 'bi-hourglass-split', anulada: 'bi-x-circle' };
                    return (
                      <button 
                        key={st} 
                        className={`btn ${selectedEstado === st ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center gap-1`}
                        onClick={() => setSelectedEstado(st)}
                        style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)' }}
                      >
                        <i className={iconMap[st]}></i>
                        <span className="d-none d-sm-inline">{labelMap[st]}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3 text-muted">Cargando reportes...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: 'linear-gradient(90deg, #6f42c1, #563d7c)', color: 'white' }}>
                    <tr>
                      <th className="border-0 py-3 ps-4 fw-semibold">
                        <i className="bi bi-calendar3 me-2"></i>Fecha
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-person me-2"></i>Cliente
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-person-badge me-2"></i>Vendedor
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-currency-dollar me-2"></i>Total
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-check-circle me-2"></i>Estado
                      </th>
                      <th className="border-0 py-3 fw-semibold text-center">
                        <i className="bi bi-gear me-2"></i>Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map(v => (
                      <tr key={v.id} className="align-middle">
                        <td className="py-3 ps-4">
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{new Date(v.fecha).toLocaleDateString()}</span>
                            <small className="text-muted">{new Date(v.fecha).toLocaleTimeString()}</small>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{v.clientes?.nombre || 'Sin nombre'}</span>
                            <small className="text-muted">
                              <i className="bi bi-card-text me-1"></i>
                              {v.clientes?.documento || 'Sin documento'}
                            </small>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary bg-gradient d-flex align-items-center justify-content-center me-2" 
                                 style={{ width: '32px', height: '32px' }}>
                              <i className="bi bi-person text-white"></i>
                            </div>
                            <span className="fw-semibold">{v.usuarios?.nombre || v.usuarios?.usuario || 'Sin vendedor'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="fw-bold text-success fs-5">
                            S/ {Number(v.total || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3">
                          {(() => { 
                            const b = getEstadoBadge(v); 
                            return (
                              <span className={`badge ${b.className} px-3 py-2 fs-6`}>
                                {b.display}
                              </span>
                            ); 
                          })()}
                        </td>
                        <td className="py-3 text-center">
                          {(() => {
                            const estadoLower = (v.estado || (Number(v.adelanto||0) >= Number(v.total||0) ? 'pagada' : 'pendiente')).toString().toLowerCase();
                            if (estadoLower === 'anulada') {
                              return (
                                <button 
                                  className="btn btn-outline-primary btn-sm rounded-pill" 
                                  onClick={() => openDetalle(v.id)}
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  Detalle
                                </button>
                              );
                            }
                            return (
                              <div className="d-flex gap-1 justify-content-center flex-wrap">
                                <button 
                                  className="btn btn-outline-primary btn-sm rounded-pill" 
                                  onClick={() => openDetalle(v.id)}
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  Ver
                                </button>
                                {['parcial','pendiente'].includes(estadoLower) && (
                                  <button 
                                    className="btn btn-outline-success btn-sm rounded-pill" 
                                    onClick={() => { 
                                      setPagoVenta(v); 
                                      setPagoData({ monto: '', metodo_pago: 'efectivo', codigo_operacion: '', ultimos_digitos: '', comision_tarjeta: '' }); 
                                      setShowPagoModal(true); 
                                    }}
                                  >
                                    <i className="bi bi-check2-circle me-1"></i>
                                    Pagar
                                  </button>
                                )}
                                <button 
                                  className="btn btn-outline-danger btn-sm rounded-pill" 
                                  onClick={() => anular(v)}
                                >
                                  <i className="bi bi-x-circle me-1"></i>
                                  Anular
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Paginación modernizada */}
            {!loading && filteredVentas.length > 0 && (
              <div className="card-footer border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                <div className="row align-items-center">
                  {/* Información de paginación */}
                  <div className="col-12 col-md-6 mb-3 mb-md-0">
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-muted">
                        <i className="bi bi-list-ol me-2"></i>
                        Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} registros
                      </span>
                      
                      {/* Selector de items por página */}
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small">Ver:</span>
                        <select 
                          className="form-select form-select-sm" 
                          style={{ width: 'auto' }}
                          value={itemsPerPage}
                          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Controles de paginación */}
                  <div className="col-12 col-md-6">
                    <nav aria-label="Paginación de reportes">
                      <ul className="pagination pagination-sm justify-content-md-end justify-content-center mb-0">
                        {/* Botón anterior */}
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link rounded-pill me-1"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{ 
                              background: currentPage === 1 ? '#f8f9fa' : 'linear-gradient(45deg, #6f42c1, #563d7c)',
                              border: 'none',
                              color: currentPage === 1 ? '#6c757d' : 'white'
                            }}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        
                        {/* Números de página */}
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                          
                          // Ajustar si estamos cerca del final
                          if (endPage - startPage + 1 < maxVisiblePages) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                          }
                          
                          // Primera página si no está visible
                          if (startPage > 1) {
                            pages.push(
                              <li key={1} className="page-item">
                                <button 
                                  className="page-link rounded-pill me-1"
                                  onClick={() => handlePageChange(1)}
                                  style={{ 
                                    background: 'linear-gradient(45deg, #6f42c1, #563d7c)',
                                    border: 'none',
                                    color: 'white'
                                  }}
                                >
                                  1
                                </button>
                              </li>
                            );
                            if (startPage > 2) {
                              pages.push(
                                <li key="ellipsis1" className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                          }
                          
                          // Páginas visibles
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                <button 
                                  className="page-link rounded-pill me-1"
                                  onClick={() => handlePageChange(i)}
                                  style={{ 
                                    background: currentPage === i 
                                      ? 'linear-gradient(45deg, #17a2b8, #20c997)' 
                                      : 'linear-gradient(45deg, #6f42c1, #563d7c)',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: currentPage === i ? 'bold' : 'normal'
                                  }}
                                >
                                  {i}
                                </button>
                              </li>
                            );
                          }
                          
                          // Última página si no está visible
                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push(
                                <li key="ellipsis2" className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            pages.push(
                              <li key={totalPages} className="page-item">
                                <button 
                                  className="page-link rounded-pill me-1"
                                  onClick={() => handlePageChange(totalPages)}
                                  style={{ 
                                    background: 'linear-gradient(45deg, #6f42c1, #563d7c)',
                                    border: 'none',
                                    color: 'white'
                                  }}
                                >
                                  {totalPages}
                                </button>
                              </li>
                            );
                          }
                          
                          return pages;
                        })()}
                        
                        {/* Botón siguiente */}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link rounded-pill"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{ 
                              background: currentPage === totalPages ? '#f8f9fa' : 'linear-gradient(45deg, #6f42c1, #563d7c)',
                              border: 'none',
                              color: currentPage === totalPages ? '#6c757d' : 'white'
                            }}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle de venta modernizado */}
      {selectedVenta && (
        <div className="modal show d-block" tabIndex="-1" style={{
          backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)'
        }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 p-4" style={{ 
                background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 50%, #17a2b8 100%)' 
              }}>
                <div className="d-flex align-items-center text-white">
                  <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                    <i className="bi bi-receipt-cutoff fs-4"></i>
                  </div>
                  <div>
                    <h4 className="modal-title mb-1">Detalle de Venta #{selectedVenta.id}</h4>
                    <p className="mb-0 opacity-75">Información completa de la transacción</p>
                  </div>
                </div>
                <button 
                  className="btn-close btn-close-white" 
                  onClick={() => setSelectedVenta(null)}
                ></button>
              </div>
              
              <div className="modal-body p-4">
                {/* Información general */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 h-100" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                      <div className="card-body">
                        <h6 className="card-title text-muted mb-3">
                          <i className="bi bi-info-circle me-2"></i>Información General
                        </h6>
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-calendar3 text-primary me-3"></i>
                          <div>
                            <small className="text-muted d-block">Fecha</small>
                            <span className="fw-semibold">{new Date(selectedVenta.fecha).toLocaleDateString()}</span>
                            <small className="text-muted ms-2">{new Date(selectedVenta.fecha).toLocaleTimeString()}</small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-person text-primary me-3"></i>
                          <div>
                            <small className="text-muted d-block">Cliente</small>
                            <span className="fw-semibold">{selectedVenta.clientes?.nombre || 'Sin nombre'}</span>
                            <small className="text-muted d-block">{selectedVenta.clientes?.documento || 'Sin documento'}</small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-badge text-primary me-3"></i>
                          <div>
                            <small className="text-muted d-block">Vendedor</small>
                            <span className="fw-semibold">{selectedVenta.usuarios?.nombre || selectedVenta.usuarios?.usuario || 'Sin vendedor'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card border-0 h-100" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)' }}>
                      <div className="card-body">
                        <h6 className="card-title text-muted mb-3">
                          <i className="bi bi-currency-dollar me-2"></i>Resumen Financiero
                        </h6>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Total:</span>
                          <span className="fs-4 fw-bold text-success">S/ {Number(selectedVenta.total || 0).toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Adelanto:</span>
                          <span className="fs-5 fw-semibold text-info">S/ {Number(selectedVenta.adelanto || 0).toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Restante:</span>
                          <span className="fs-5 fw-semibold text-warning">S/ {Number(selectedVenta.diferencia !== undefined ? selectedVenta.diferencia : (selectedVenta.total - (selectedVenta.adelanto || 0))).toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Estado:</span>
                          {(() => { 
                            const b = getEstadoBadge(selectedVenta); 
                            return <span className={`badge ${b.className} px-3 py-2 fs-6`}>{b.display}</span>; 
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle de productos */}
                <div className="card border-0">
                  <div className="card-header" style={{ background: 'linear-gradient(90deg, #6f42c1, #563d7c)', color: 'white' }}>
                    <h6 className="mb-0">
                      <i className="bi bi-list-ul me-2"></i>Detalle de Productos
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    {selectedVenta.detalle && Array.isArray(selectedVenta.detalle) ? (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="py-3">Producto</th>
                              <th className="py-3">Cantidad</th>
                              <th className="py-3">Precio Unit.</th>
                              <th className="py-3">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedVenta.detalle.map((d, i) => (
                              <tr key={i} className="align-middle">
                                <td className="py-3">
                                  <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-gradient me-3 d-flex align-items-center justify-content-center" 
                                         style={{ width: '32px', height: '32px' }}>
                                      <i className="bi bi-box text-white"></i>
                                    </div>
                                    <span className="fw-semibold">
                                      {(d.productos && (d.productos.descripcion || d.productos.nombre)) || d.producto_nombre || d.nombre}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className="badge bg-secondary bg-gradient fs-6 px-3 py-2">
                                    {d.cantidad}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className="fw-semibold">
                                    S/ {Number(d.precio_unitario || d.precio || (d.productos && (d.productos.pre_general || d.productos.precio_unitario)) || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className="fw-bold text-success fs-5">
                                    S/ {Number(d.subtotal || (d.cantidad * (d.precio_unitario || d.precio || 0))).toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <div className="mb-3">
                          <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h6 className="text-muted mb-3">No hay detalle disponible para esta venta</h6>
                        <button 
                          className="btn btn-outline-primary btn-lg" 
                          onClick={() => reloadDetalle(selectedVenta)}
                          disabled={loadingDetalle}
                        >
                          <i className={`bi ${loadingDetalle ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'} me-2`}></i>
                          Recargar detalle
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer border-0 p-4 bg-light">
                <button 
                  className="btn btn-secondary btn-lg px-4" 
                  onClick={() => setSelectedVenta(null)}
                >
                  <i className="bi bi-x-lg me-2"></i>Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago modernizado */}
      {showPagoModal && pagoVenta && (
        <div className="modal show d-block" tabIndex="-1" style={{
          backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)'
        }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 p-4" style={{ 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
              }}>
                <div className="d-flex align-items-center text-white">
                  <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                    <i className="bi bi-credit-card fs-4"></i>
                  </div>
                  <div>
                    <h4 className="modal-title mb-1">Registrar Pago</h4>
                    <p className="mb-0 opacity-75">Venta #{pagoVenta.id}</p>
                  </div>
                </div>
                <button 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowPagoModal(false)}
                ></button>
              </div>
              
              <div className="modal-body p-4">
                {/* Resumen de la venta */}
                <div className="card border-0 mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-receipt me-2"></i>Resumen de la Venta
                    </h6>
                    <div className="row g-3">
                      <div className="col-4">
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-success">S/ {Number(pagoVenta.total || 0).toLocaleString()}</div>
                          <small className="text-muted">Total</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-info">S/ {Number(pagoVenta.adelanto || 0).toLocaleString()}</div>
                          <small className="text-muted">Adelanto</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-warning">S/ {Number(pagoVenta.diferencia !== undefined ? pagoVenta.diferencia : (pagoVenta.total - (pagoVenta.adelanto || 0))).toLocaleString()}</div>
                          <small className="text-muted">Restante</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de pago */}
                <div className="row g-4">
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-currency-dollar me-2"></i>Monto a pagar
                    </label>
                    <input 
                      type="number" 
                      className="form-control form-control-lg" 
                      placeholder="0.00"
                      value={pagoData.monto} 
                      onChange={(e) => setPagoData({...pagoData, monto: e.target.value})} 
                    />
                  </div>
                  
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-credit-card me-2"></i>Método de pago
                    </label>
                    <select 
                      className="form-select form-select-lg" 
                      value={pagoData.metodo_pago} 
                      onChange={(e) => setPagoData({...pagoData, metodo_pago: e.target.value})}
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">🏦 Transferencia</option>
                    </select>
                  </div>

                  {pagoData.metodo_pago === 'tarjeta' && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Últimos dígitos</label>
                        <input 
                          type="text" 
                          className="form-control form-control-lg" 
                          placeholder="****"
                          maxLength="4"
                          value={pagoData.ultimos_digitos} 
                          onChange={(e) => setPagoData({...pagoData, ultimos_digitos: e.target.value})} 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Comisión tarjeta</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="form-control form-control-lg" 
                          placeholder="0.00"
                          value={pagoData.comision_tarjeta} 
                          onChange={(e) => setPagoData({...pagoData, comision_tarjeta: e.target.value})} 
                        />
                      </div>
                    </>
                  )}

                  {pagoData.metodo_pago === 'transferencia' && (
                    <div className="col-12">
                      <label className="form-label fw-semibold">Código de operación</label>
                      <input 
                        type="text" 
                        className="form-control form-control-lg" 
                        placeholder="Código de la transferencia"
                        value={pagoData.codigo_operacion} 
                        onChange={(e) => setPagoData({...pagoData, codigo_operacion: e.target.value})} 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer border-0 p-4 bg-light">
                <button 
                  className="btn btn-secondary btn-lg px-4 me-2" 
                  onClick={() => setShowPagoModal(false)}
                >
                  <i className="bi bi-x-lg me-2"></i>Cancelar
                </button>
                <button 
                  className="btn btn-success btn-lg px-4" 
                  disabled={loading}
                  onClick={async () => {
                    const montoNum = Number(pagoData.monto || 0);
                    if (!montoNum || montoNum <= 0) return alert('Ingrese un monto válido');
                    try {
                      setLoading(true);
                      const res = await (await import('../services/apiServices')).salesService.marcarPagada(pagoVenta.id, {
                        monto: montoNum,
                        metodo_pago: pagoData.metodo_pago,
                        codigo_operacion: pagoData.codigo_operacion,
                        ultimos_digitos: pagoData.ultimos_digitos,
                        comision_tarjeta: pagoData.comision_tarjeta,
                      });
                      alert(res.message || 'Pago registrado');
                      setShowPagoModal(false);
                      setPagoVenta(null);
                      loadVentas();
                      if (selectedVenta && selectedVenta.id === pagoVenta.id) reloadDetalle(selectedVenta);
                    } catch (err) {
                      console.error('Error al marcar pagada:', err);
                      alert(getErrorMessage(err) || 'Error al registrar pago');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-check-lg'} me-2`}></i>
                  {loading ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}