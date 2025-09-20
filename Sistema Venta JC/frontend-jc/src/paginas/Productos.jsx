import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/apiServices';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showReactivarModal, setShowReactivarModal] = useState(false);
  const [productoAReactivar, setProductoAReactivar] = useState(null);
  const [showDesactivarModal, setShowDesactivarModal] = useState(false);
  const [productoADesactivar, setProductoADesactivar] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    stock: 0,
    pre_compra: '',
    pre_especial: '',
    pre_por_mayor: '',
    pre_general: ''
  });

  // Cargar productos al iniciar
  useEffect(() => {
    cargarProductos();
  }, []);

  // Auto-ocultar mensajes de éxito después de 4 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 4000); // 4 segundos

      return () => clearTimeout(timer); // Limpiar timer si el componente se desmonta o cambia el success
    }
  }, [success]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (!productos.length) return { totalProductos: 0, productosActivos: 0, productosAgotados: 0 };
    
    return productos.reduce((acc, producto) => {
      acc.totalProductos += 1;
      
      if (producto.estado) {
        acc.productosActivos += 1;
      }
      
      if (producto.stock <= 5) {
        acc.productosAgotados += 1;
      }
      
      return acc;
    }, { totalProductos: 0, productosActivos: 0, productosAgotados: 0 });
  }, [productos]);

  // Filtrado de productos
  const filteredProductos = useMemo(() => {
    let filtered = productos.filter(producto => {
      // Filtro por estado
      switch(filtroEstado) {
        case 'activos':
          if (!producto.estado) return false;
          break;
        case 'inactivos':
          if (producto.estado) return false;
          break;
        case 'agotados':
          if (producto.stock > 5) return false;
          break;
        case 'todos':
        default:
          break;
      }
      
      // Filtro por búsqueda
      if (searchTerm) {
        return (
          producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return true;
    });
    
    return filtered;
  }, [productos, filtroEstado, searchTerm]);

  // Cálculos de paginación
  const totalItems = filteredProductos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredProductos.slice(startIndex, endIndex);

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Cargar productos
  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProductos(response || []);
      setError('');
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
      setError(error.message || 'Error al cargar los productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      codigo: '',
      descripcion: '',
      stock: 0,
      pre_compra: '',
      pre_especial: '',
      pre_por_mayor: '',
      pre_general: ''
    });
    setEditingProduct(null);
    setError('');
    setSuccess('');
  };

  // Abrir modal para registrar producto
  const abrirModalRegistro = () => {
    limpiarFormulario();
    setShowRegistroModal(true);
  };

  // Cerrar modal de registro
  const cerrarModalRegistro = () => {
    setShowRegistroModal(false);
    limpiarFormulario();
  };

  // Crear/actualizar producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.codigo.trim()) {
      setError('El código es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      setLoading(false);
      return;
    }

    const stockNumerico = parseInt(formData.stock);
    if (isNaN(stockNumerico) || stockNumerico < 0) {
      setError('El stock debe ser un número válido mayor o igual a 0');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        ...formData,
        stock: stockNumerico,
        pre_compra: formData.pre_compra ? parseFloat(formData.pre_compra) : null,
        pre_especial: formData.pre_especial ? parseFloat(formData.pre_especial) : null,
        pre_por_mayor: formData.pre_por_mayor ? parseFloat(formData.pre_por_mayor) : null,
        pre_general: formData.pre_general ? parseFloat(formData.pre_general) : null
      };

      let response;
      if (editingProduct) {
        response = await productService.update(editingProduct.id, productData);
        if (response.success) {
          setSuccess(`Producto "${formData.descripcion}" actualizado exitosamente`);
          setProductos(prevProductos => 
            prevProductos.map(producto => 
              producto.id === editingProduct.id 
                ? { ...producto, ...productData }
                : producto
            )
          );
        }
      } else {
        response = await productService.create(productData);
        if (response.success) {
          setSuccess(`Producto "${formData.descripcion}" creado exitosamente`);
          if (response.data) {
            setProductos(prevProductos => [...prevProductos, response.data]);
          } else {
            // Recargar productos si no tenemos el nuevo producto
            await cargarProductos();
          }
        }
      }

      if (!response.success) {
        throw new Error(response.message || 'Error al procesar el producto');
      }

      cerrarModalRegistro();
    } catch (error) {
      console.error('❌ Error al procesar producto:', error);
      setError(error.message || 'Error al procesar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición
  const iniciarEdicion = (producto) => {
    setEditingProduct(producto);
    setFormData({
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      stock: producto.stock || 0,
      pre_compra: producto.pre_compra || '',
      pre_especial: producto.pre_especial || '',
      pre_por_mayor: producto.pre_por_mayor || '',
      pre_general: producto.pre_general || ''
    });
    setShowRegistroModal(true);
  };

  // Eliminar producto (cambiar estado a inactivo, conservando todos los datos)
  const eliminarProducto = async (id) => {
    const producto = productos.find(p => p.id === id);
    setProductoADesactivar(producto);
    setShowDesactivarModal(true);
  };

  // Confirmar desactivación de producto
  const confirmarDesactivacion = async () => {
    try {
      setLoading(true);
      // Solo cambiar el estado a false, preservando TODOS los datos existentes
      const response = await productService.update(productoADesactivar.id, { 
        codigo: productoADesactivar.codigo,
        descripcion: productoADesactivar.descripcion,
        stock: productoADesactivar.stock,
        pre_compra: productoADesactivar.pre_compra,
        pre_especial: productoADesactivar.pre_especial,
        pre_por_mayor: productoADesactivar.pre_por_mayor,
        pre_general: productoADesactivar.pre_general,
        estado: false 
      });
      if (response.success) {
        setSuccess(`Producto "${productoADesactivar.descripcion}" desactivado exitosamente. Los datos se conservaron.`);
        setProductos(prevProductos => 
          prevProductos.map(producto => 
            producto.id === productoADesactivar.id 
              ? { ...producto, estado: false }
              : producto
          )
        );
      } else {
        throw new Error(response.message || 'Error al desactivar producto');
      }
    } catch (error) {
      console.error('❌ Error al desactivar producto:', error);
      setError(error.message || 'Error al desactivar el producto');
    } finally {
      setLoading(false);
      setShowDesactivarModal(false);
      setProductoADesactivar(null);
    }
  };

  // Abrir modal de confirmación para reactivar
  const abrirModalReactivar = (producto) => {
    setProductoAReactivar(producto);
    setShowReactivarModal(true);
  };

  // Confirmar reactivación del producto
  const confirmarReactivacion = async () => {
    if (!productoAReactivar) return;

    try {
      setLoading(true);
      const response = await productService.update(productoAReactivar.id, { estado: true });
      if (response.success) {
        // Actualizar el producto en la lista
        setProductos(prevProductos => 
          prevProductos.map(producto => 
            producto.id === productoAReactivar.id 
              ? { ...producto, estado: true }
              : producto
          )
        );

        // Cerrar modal de reactivación
        setShowReactivarModal(false);
        
        // Abrir modal de edición automáticamente para completar datos
        iniciarEdicion({...productoAReactivar, estado: true});
        
        setSuccess(`Producto "${productoAReactivar.descripcion}" reactivado. Complete los datos necesarios.`);
        setProductoAReactivar(null);
      } else {
        throw new Error(response.message || 'Error al reactivar producto');
      }
    } catch (error) {
      console.error('❌ Error al reactivar producto:', error);
      setError(error.message || 'Error al reactivar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar reactivación
  const cancelarReactivacion = () => {
    setShowReactivarModal(false);
    setProductoAReactivar(null);
  };

  // Función para cambiar página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Función para cambiar items por página
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado, searchTerm]);

  // Obtener badge de estado
  const getEstadoBadge = (producto) => {
    if (!producto.estado) {
      return { className: 'bg-danger text-white', display: 'Inactivo' };
    }
    if (producto.stock <= 0) {
      return { className: 'bg-secondary text-white', display: 'Agotado' };
    }
    if (producto.stock <= 5) {
      return { className: 'bg-warning text-dark', display: 'Poco Stock' };
    }
    return { className: 'bg-success text-white', display: 'Activo' };
  };

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
                      <i className="bi bi-box-seam-fill me-3"></i>
                      Gestión de Inventario
                    </h1>
                    <p className="lead mb-0 opacity-75">Sistema de productos y control de stock JC ENYDA</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-light btn-lg shadow-sm"
                      onClick={cargarProductos}
                      disabled={loading}
                    >
                      <i className={`bi ${loading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'} me-2`}></i>
                      Actualizar
                    </button>
                    <button 
                      className="btn btn-outline-light btn-lg"
                      onClick={abrirModalRegistro}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Registrar Producto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de métricas */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Total Productos</h6>
                <h3 className="card-text fw-bold text-primary mb-0">
                  {metrics.totalProductos}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Productos Activos</h6>
                <h3 className="card-text fw-bold text-success mb-0">
                  {metrics.productosActivos}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 metric-glow">
              <div className="card-body text-center p-4">
                <h6 className="card-title text-muted mb-3">Poco Stock</h6>
                <h3 className="card-text fw-bold text-warning mb-0">
                  {metrics.productosAgotados}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de búsqueda y filtros */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-6">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-search me-2"></i>Buscar por código o descripción
                </label>
                <input 
                  type="text" 
                  className="form-control form-control-lg" 
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="col-12 col-md-6 col-lg-6">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-filter me-2"></i>Filtrar por estado
                </label>
                <div className="btn-group w-100" role="group">
                  {[
                    { key: 'todos', label: 'Todos', icon: 'bi-list', count: productos.length },
                    { key: 'activos', label: 'Activos', icon: 'bi-check-circle', count: productos.filter(p => p.estado).length },
                    { key: 'inactivos', label: 'Inactivos', icon: 'bi-x-circle', count: productos.filter(p => !p.estado).length },
                    { key: 'agotados', label: 'Poco Stock', icon: 'bi-exclamation-triangle', count: productos.filter(p => p.stock <= 5).length }
                  ].map((filtro) => (
                    <button 
                      key={filtro.key}
                      className={`btn ${filtroEstado === filtro.key ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center gap-1`}
                      onClick={() => setFiltroEstado(filtro.key)}
                      style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)' }}
                    >
                      <i className={filtro.icon}></i>
                      <span className="d-none d-sm-inline">{filtro.label}</span>
                      <span className="badge bg-secondary ms-1">{filtro.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="alert alert-danger alert-dismissible mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError('')}
            ></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess('')}
            ></button>
          </div>
        )}

        {/* Tabla de productos */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading && !productos.length ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Cargando productos...</span>
                </div>
                <p className="mt-3 text-muted">Cargando inventario...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: 'linear-gradient(90deg, #6f42c1, #563d7c)', color: 'white' }}>
                    <tr>
                      <th className="border-0 py-3 ps-4 fw-semibold">
                        <i className="bi bi-upc-scan me-2"></i>Código
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-card-text me-2"></i>Descripción
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-box me-2"></i>Stock
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-currency-dollar me-2"></i>P. Compra
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-star me-2"></i>P. Especial
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-people me-2"></i>P. Mayor
                      </th>
                      <th className="border-0 py-3 fw-semibold">
                        <i className="bi bi-tag me-2"></i>P. General
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
                    {currentItems.map(producto => (
                      <tr key={producto.id} className="align-middle">
                        <td className="py-3 ps-4">
                          <code className="bg-light p-2 rounded text-primary fw-bold">
                            {producto.codigo}
                          </code>
                        </td>
                        <td className="py-3">
                          <span className="fw-semibold">{producto.descripcion}</span>
                        </td>
                        <td className="py-3">
                          <span className={`badge ${
                            producto.stock <= 0 ? 'bg-danger' : 
                            producto.stock <= 5 ? 'bg-warning text-dark' : 
                            'bg-success'
                          } fs-6 px-3 py-2`}>
                            {producto.stock}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-muted">
                            {producto.pre_compra ? `S/ ${Number(producto.pre_compra).toLocaleString()}` : 'No definido'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-warning fw-semibold">
                            {producto.pre_especial ? `S/ ${Number(producto.pre_especial).toLocaleString()}` : 'No definido'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-info fw-semibold">
                            {producto.pre_por_mayor ? `S/ ${Number(producto.pre_por_mayor).toLocaleString()}` : 'No definido'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-success fw-bold fs-5">
                            {producto.pre_general ? `S/ ${Number(producto.pre_general).toLocaleString()}` : 'No definido'}
                          </span>
                        </td>
                        <td className="py-3">
                          {(() => { 
                            const badge = getEstadoBadge(producto); 
                            return (
                              <span className={`badge ${badge.className} px-3 py-2 fs-6`}>
                                {badge.display}
                              </span>
                            ); 
                          })()}
                        </td>
                        <td className="py-3 text-center">
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            <button 
                              className="btn btn-outline-primary btn-sm rounded-pill" 
                              onClick={() => iniciarEdicion(producto)}
                              disabled={loading}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Editar
                            </button>
                            {producto.estado ? (
                              <button 
                                className="btn btn-outline-warning btn-sm rounded-pill" 
                                onClick={() => eliminarProducto(producto.id)}
                                disabled={loading}
                              >
                                <i className="bi bi-pause-circle me-1"></i>
                                Desactivar
                              </button>
                            ) : (
                              <button 
                                className="btn btn-outline-success btn-sm rounded-pill" 
                                onClick={() => abrirModalReactivar(producto)}
                                disabled={loading}
                              >
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Reactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Paginación modernizada */}
            {!loading && filteredProductos.length > 0 && (
              <div className="card-footer border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                <div className="row align-items-center">
                  <div className="col-12 col-md-6 mb-3 mb-md-0">
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-muted">
                        <i className="bi bi-list-ol me-2"></i>
                        Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} productos
                      </span>
                      
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
                  
                  <div className="col-12 col-md-6">
                    <nav aria-label="Paginación de productos">
                      <ul className="pagination pagination-sm justify-content-md-end justify-content-center mb-0">
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
                        
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                          
                          if (endPage - startPage + 1 < maxVisiblePages) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                          }
                          
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

      {/* Modal de confirmación de reactivación */}
      {showReactivarModal && productoAReactivar && (
        <div className="modal show d-block" tabIndex="-1" style={{
          backgroundColor: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(10px)'
        }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 p-4" style={{ 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
              }}>
                <div className="d-flex align-items-center text-white">
                  <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                    <i className="bi bi-arrow-clockwise fs-4"></i>
                  </div>
                  <div>
                    <h4 className="modal-title mb-1">Reactivar Producto</h4>
                    <p className="mb-0 opacity-75">Confirme la reactivación del producto</p>
                  </div>
                </div>
              </div>
              
              <div className="modal-body p-4">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="bg-light rounded-3 p-4 mb-3">
                      <i className="bi bi-box-seam display-1 text-success mb-3"></i>
                      <h5 className="fw-bold mb-2">{productoAReactivar.descripcion}</h5>
                      <p className="text-muted mb-1">
                        <i className="bi bi-upc-scan me-2"></i>
                        Código: <code className="bg-secondary text-white px-2 py-1 rounded">{productoAReactivar.codigo}</code>
                      </p>
                      <p className="text-muted">
                        <i className="bi bi-box me-2"></i>
                        Stock actual: <span className="fw-bold">{productoAReactivar.stock}</span>
                      </p>
                    </div>
                    
                    <div className="alert alert-info border-0" style={{ background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)' }}>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle-fill text-info me-3 fs-4"></i>
                        <div className="text-start">
                          <h6 className="alert-heading mb-1">¿Qué sucederá?</h6>
                          <p className="mb-1">• El producto se marcará como <strong>activo</strong></p>
                          <p className="mb-1">• Se abrirá automáticamente el <strong>formulario de edición</strong></p>
                          <p className="mb-0">• Podrá <strong>completar los datos</strong> faltantes (precios, descripción, etc.)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer border-0 p-4 bg-light">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-lg px-4 me-2" 
                  onClick={cancelarReactivacion}
                  disabled={loading}
                >
                  <i className="bi bi-x-lg me-2"></i>Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success btn-lg px-4"
                  onClick={confirmarReactivacion}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Reactivando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Sí, Reactivar y Editar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para desactivar producto */}
      {showDesactivarModal && productoADesactivar && (
        <div className="modal show d-block" tabIndex="-1" style={{
          backgroundColor: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(10px)'
        }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 p-4" style={{ 
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' 
              }}>
                <div className="d-flex align-items-center text-white">
                  <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                    <i className="bi bi-pause-circle fs-4"></i>
                  </div>
                  <div>
                    <h4 className="modal-title mb-1">Desactivar Producto</h4>
                    <p className="mb-0 opacity-75">Confirme la desactivación del producto</p>
                  </div>
                </div>
              </div>
              
              <div className="modal-body p-4">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="bg-light rounded-3 p-4 mb-3">
                      <i className="bi bi-box-seam display-1 text-warning mb-3"></i>
                      <h5 className="fw-bold mb-2">{productoADesactivar.descripcion}</h5>
                      <p className="text-muted mb-1">
                        <i className="bi bi-upc-scan me-2"></i>
                        Código: <code className="bg-secondary text-white px-2 py-1 rounded">{productoADesactivar.codigo}</code>
                      </p>
                      <p className="text-muted mb-1">
                        <i className="bi bi-box me-2"></i>
                        Stock actual: <span className="fw-bold">{productoADesactivar.stock}</span>
                      </p>
                      <p className="text-muted">
                        <i className="bi bi-currency-dollar me-2"></i>
                        Precio general: <span className="fw-bold text-success">${productoADesactivar.pre_general}</span>
                      </p>
                    </div>
                    
                    <div className="alert alert-warning border-0" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-shield-check text-warning me-3 fs-4"></i>
                        <div className="text-start">
                          <h6 className="alert-heading mb-1 text-warning-emphasis">Tranquilidad Total</h6>
                          <p className="mb-1 text-warning-emphasis">• <strong>TODOS los datos se conservarán</strong> (precios, stock, descripción)</p>
                          <p className="mb-1 text-warning-emphasis">• El producto solo se <strong>ocultará</strong> de las ventas</p>
                          <p className="mb-0 text-warning-emphasis">• Podrá <strong>reactivarlo en cualquier momento</strong> sin perder información</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer border-0 p-4 bg-light">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-lg px-4 me-2" 
                  onClick={() => {
                    setShowDesactivarModal(false);
                    setProductoADesactivar(null);
                  }}
                  disabled={loading}
                >
                  <i className="bi bi-x-lg me-2"></i>Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning btn-lg px-4"
                  onClick={confirmarDesactivacion}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Desactivando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pause-circle me-2"></i>
                      Sí, Desactivar (Conservar Datos)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro/edición de producto */}
      {showRegistroModal && (
        <div className="modal show d-block" tabIndex="-1" style={{
          backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)'
        }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 p-4" style={{ 
                background: editingProduct 
                  ? 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)' 
                  : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
              }}>
                <div className="d-flex align-items-center text-white">
                  <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                    <i className={`bi ${editingProduct ? 'bi-pencil-square' : 'bi-plus-circle'} fs-4`}></i>
                  </div>
                  <div>
                    <h4 className="modal-title mb-1">
                      {editingProduct ? `Editar Producto: ${editingProduct.descripcion}` : 'Registrar Nuevo Producto'}
                    </h4>
                    <p className="mb-0 opacity-75">Complete los campos para {editingProduct ? 'actualizar' : 'crear'} el producto</p>
                  </div>
                </div>
                <button 
                  className="btn-close btn-close-white" 
                  onClick={cerrarModalRegistro}
                  disabled={loading}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-upc-scan me-2"></i>Código del Producto *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="codigo"
                        value={formData.codigo}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Ej: PROD001, ABC123"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-box me-2"></i>Stock Disponible
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        disabled={loading}
                        min="0"
                        placeholder="Cantidad en inventario"
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-card-text me-2"></i>Descripción del Producto *
                      </label>
                      <textarea
                        className="form-control form-control-lg"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        rows="3"
                        placeholder="Descripción detallada del producto"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-currency-dollar me-2"></i>Precio de Compra
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="pre_compra"
                        value={formData.pre_compra}
                        onChange={handleInputChange}
                        disabled={loading}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-star me-2"></i>Precio Especial
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="pre_especial"
                        value={formData.pre_especial}
                        onChange={handleInputChange}
                        disabled={loading}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-people me-2"></i>Precio por Mayor
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="pre_por_mayor"
                        value={formData.pre_por_mayor}
                        onChange={handleInputChange}
                        disabled={loading}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-tag me-2"></i>Precio General
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="pre_general"
                        value={formData.pre_general}
                        onChange={handleInputChange}
                        disabled={loading}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0 p-4 bg-light">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-lg px-4 me-2" 
                    onClick={cerrarModalRegistro}
                    disabled={loading}
                  >
                    <i className="bi bi-x-lg me-2"></i>Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className={`btn ${editingProduct ? 'btn-warning' : 'btn-success'} btn-lg px-4`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {editingProduct ? 'Actualizando...' : 'Creando...'}
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingProduct ? 'bi-check-lg' : 'bi-plus-lg'} me-2`}></i>
                        {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}