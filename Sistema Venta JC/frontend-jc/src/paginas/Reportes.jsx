import React, { useEffect, useState } from 'react';
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
  const [searchParams] = useSearchParams();

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
    } catch (e) { return 'Error desconocido'; }
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

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-receipt me-2"></i> Reporte de Ventas</h2>
        <button className="btn btn-outline-primary" onClick={loadVentas}><i className="bi bi-arrow-clockwise me-2"></i>Actualizar</button>
      </div>

      <div className="mb-3">
        <div className="btn-group" role="group" aria-label="Filtro estados">
          {['todos','pagada','pendiente','parcial','anulada'].map((st) => {
            const labelMap = { todos: 'Todas', pagada: 'Pagadas', pendiente: 'Pendientes', parcial: 'Parciales', anulada: 'Anuladas' };
            return (
              <button key={st} className={"btn btn-sm " + (selectedEstado === st ? 'btn-primary' : 'btn-outline-secondary')} onClick={() => setSelectedEstado(st)}>{labelMap[st]}</button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" role="status"></div></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredVentas = (ventas || []).filter(v => {
                  if (selectedEstado === 'todos') return true;
                  const estadoLower = (v.estado || (Number(v.adelanto||0) >= Number(v.total||0) ? 'pagada' : 'pendiente')).toString().toLowerCase();
                  if (selectedEstado === 'parcial') return estadoLower.includes('parcial');
                  return estadoLower === selectedEstado;
                });
                return filteredVentas.map(v => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{new Date(v.fecha).toLocaleString()}</td>
                    <td>{v.clientes?.nombre || ''} <div className="small text-muted">{v.clientes?.documento || ''}</div></td>
                    <td>{v.usuarios?.nombre || v.usuarios?.usuario || ''}</td>
                    <td className="text-success">S/ {Number(v.total || 0).toLocaleString()}</td>
                    <td>{(() => { const b = getEstadoBadge(v); return <span className={"badge " + b.className}>{b.display}</span>; })()}</td>
                    <td>
                      {(() => {
                        const estadoLower = (v.estado || (Number(v.adelanto||0) >= Number(v.total||0) ? 'pagada' : 'pendiente')).toString().toLowerCase();
                        if (estadoLower === 'anulada') {
                          return (<button className="btn btn-sm btn-outline-primary" onClick={() => openDetalle(v.id)}><i className="bi bi-eye"></i> Detalle</button>);
                        }
                        return (
                          <>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openDetalle(v.id)}><i className="bi bi-eye"></i> Detalle</button>
                            {['parcial','pendiente'].includes(estadoLower) && (
                              <button className="btn btn-sm btn-outline-success me-2" onClick={() => { setPagoVenta(v); setPagoData({ monto: '', metodo_pago: 'efectivo', codigo_operacion: '', ultimos_digitos: '', comision_tarjeta: '' }); setShowPagoModal(true); }}><i className="bi bi-check2-circle"></i> Marcar pagada</button>
                            )}
                            <button className="btn btn-sm btn-outline-danger" onClick={() => anular(v)}><i className="bi bi-x-circle"></i> Anular</button>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      {selectedVenta && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Detalle Venta {selectedVenta.id}</h5>
                <button className="btn-close btn-close-white" onClick={() => setSelectedVenta(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Fecha:</strong> {new Date(selectedVenta.fecha).toLocaleString()}</p>
                <p><strong>Cliente:</strong> {selectedVenta.clientes?.nombre} ({selectedVenta.clientes?.documento})</p>
                <p><strong>Vendedor:</strong> {selectedVenta.usuarios?.nombre || selectedVenta.usuarios?.usuario}</p>
                <p><strong>Total:</strong> S/ {Number(selectedVenta.total || 0).toLocaleString()}</p>
                <p><strong>Adelanto:</strong> S/ {Number(selectedVenta.adelanto || 0).toLocaleString()}</p>
                <p><strong>Restante:</strong> S/ {Number(selectedVenta.diferencia !== undefined ? selectedVenta.diferencia : (selectedVenta.total - (selectedVenta.adelanto || 0))).toLocaleString()}</p>
                <p><strong>Estado:</strong> {(() => { const b = getEstadoBadge(selectedVenta); return <span className={"badge " + b.className}>{b.display}</span>; })()}</p>

                {selectedVenta.detalle && Array.isArray(selectedVenta.detalle) ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Unit.</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVenta.detalle.map((d, i) => (
                          <tr key={i}>
                            <td>{(d.productos && (d.productos.descripcion || d.productos.nombre)) || d.producto_nombre || d.nombre}</td>
                            <td>{d.cantidad}</td>
                            <td>S/ {Number(d.precio_unitario || d.precio || (d.productos && (d.productos.pre_general || d.productos.precio_unitario)) || 0).toLocaleString()}</td>
                            <td className="text-success">S/ {Number(d.subtotal || (d.cantidad * (d.precio_unitario || d.precio || 0))).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-secondary d-flex justify-content-between align-items-center">
                    <div>No hay detalle disponible para esta venta.</div>
                    <div>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => reloadDetalle(selectedVenta)}>
                        <i className="bi bi-arrow-clockwise"></i> Recargar detalle
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedVenta(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPagoModal && pagoVenta && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Marcar como pagada - Venta {pagoVenta.id}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowPagoModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Total:</strong> S/ {Number(pagoVenta.total || 0).toLocaleString()}</p>
                <p><strong>Adelanto actual:</strong> S/ {Number(pagoVenta.adelanto || 0).toLocaleString()}</p>
                <p><strong>Restante:</strong> S/ {Number(pagoVenta.diferencia !== undefined ? pagoVenta.diferencia : (pagoVenta.total - (pagoVenta.adelanto || 0))).toLocaleString()}</p>

                <div className="mb-3">
                  <label className="form-label">Monto a pagar</label>
                  <input type="number" className="form-control" value={pagoData.monto} onChange={(e) => setPagoData({...pagoData, monto: e.target.value})} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Método de pago</label>
                  <select className="form-select" value={pagoData.metodo_pago} onChange={(e) => setPagoData({...pagoData, metodo_pago: e.target.value})}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                {pagoData.metodo_pago === 'tarjeta' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Últimos dígitos</label>
                      <input type="text" className="form-control" value={pagoData.ultimos_digitos} onChange={(e) => setPagoData({...pagoData, ultimos_digitos: e.target.value})} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Comisión tarjeta</label>
                      <input type="number" step="0.01" className="form-control" value={pagoData.comision_tarjeta} onChange={(e) => setPagoData({...pagoData, comision_tarjeta: e.target.value})} />
                    </div>
                  </>
                )}

                {pagoData.metodo_pago === 'transferencia' && (
                  <div className="mb-3">
                    <label className="form-label">Código de operación</label>
                    <input type="text" className="form-control" value={pagoData.codigo_operacion} onChange={(e) => setPagoData({...pagoData, codigo_operacion: e.target.value})} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button className="btn btn-success" onClick={async () => {
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
                }}>Confirmar pago</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

