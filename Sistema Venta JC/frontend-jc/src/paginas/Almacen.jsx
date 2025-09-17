import React, { useState, useEffect } from 'react';
import { productService } from '../services/apiServices';

export default function Almacen() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filtroStock, setFiltroStock] = useState('todos'); // todos, normal, bajo, agotado
    const [busqueda, setBusqueda] = useState('');
    const [stockMinimo, setStockMinimo] = useState(10); // Umbral para stock bajo
    const [showModalStock, setShowModalStock] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidadEntrada, setCantidadEntrada] = useState('');

    // Cargar productos al montar el componente
    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await productService.getAll();
            console.log('📦 Productos cargados:', data);
            setProductos(data);
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            setError(error.message || 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    // Calcular métricas del almacén
    const calcularMetricas = () => {
        const productosActivos = productos.filter(p => p.estado);
        const stockTotal = productosActivos.reduce((total, p) => total + (p.stock || 0), 0);
        const productosConStockBajo = productosActivos.filter(p => (p.stock || 0) <= stockMinimo);
        const productosAgotados = productosActivos.filter(p => (p.stock || 0) === 0);

        return {
            stockTotal,
            totalProductos: productosActivos.length,
            stockBajo: productosConStockBajo.length,
            agotados: productosAgotados.length
        };
    };

    const metricas = calcularMetricas();

    // Filtrar productos según criterios
    const productosFiltrados = productos.filter(producto => {
        if (!producto.estado) return false; // Solo productos activos

        // Filtro por búsqueda
        const cumpleBusqueda = busqueda === '' || 
            producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.codigo?.toLowerCase().includes(busqueda.toLowerCase());

        if (!cumpleBusqueda) return false;

        // Filtro por stock
        const stock = producto.stock || 0;
        switch (filtroStock) {
            case 'agotado':
                return stock === 0;
            case 'bajo':
                return stock > 0 && stock <= stockMinimo;
            case 'normal':
                return stock > stockMinimo;
            case 'todos':
            default:
                return true;
        }
    });

    // Función para agregar stock
    const handleAgregarStock = (producto) => {
        setProductoSeleccionado(producto);
        setCantidadEntrada('');
        setShowModalStock(true);
    };

    const procesarEntradaStock = async () => {
        if (!productoSeleccionado || !cantidadEntrada || cantidadEntrada <= 0) {
            alert('Por favor ingrese una cantidad válida');
            return;
        }

        try {
            setLoading(true);
            const nuevoStock = (productoSeleccionado.stock || 0) + parseInt(cantidadEntrada);
            
            await productService.update(productoSeleccionado.id, {
                ...productoSeleccionado,
                stock: nuevoStock
            });

            // Actualizar localmente
            setProductos(prev => 
                prev.map(p => 
                    p.id === productoSeleccionado.id 
                        ? { ...p, stock: nuevoStock }
                        : p
                )
            );

            setShowModalStock(false);
            alert(`Stock actualizado. Nuevo stock: ${nuevoStock}`);
        } catch (error) {
            console.error('❌ Error al actualizar stock:', error);
            alert('Error al actualizar stock: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='container-fluid p-4'>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className='mb-0'>
                    <i className="bi bi-boxes me-2"></i>
                    Control de Almacén
                </h2>
                <button 
                    className="btn btn-outline-info"
                    onClick={cargarProductos}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    {loading ? 'Cargando...' : 'Actualizar'}
                </button>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}

            {/* Métricas del almacén */}
            <div className='row mb-4'>
                <div className='col-md-3'>
                    <div className='card border-success'>
                        <div className='card-body text-center'>
                            <i className="bi bi-boxes display-4 text-success mb-2"></i>
                            <h5 className='card-title'>Stock Total</h5>
                            <h3 className='text-success'>{metricas.stockTotal.toLocaleString()}</h3>
                            <small className="text-muted">unidades</small>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card border-info'>
                        <div className='card-body text-center'>
                            <i className="bi bi-box-seam display-4 text-info mb-2"></i>
                            <h5 className='card-title'>Productos</h5>
                            <h3 className='text-info'>{metricas.totalProductos}</h3>
                            <small className="text-muted">activos</small>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card border-warning'>
                        <div className='card-body text-center'>
                            <i className="bi bi-exclamation-triangle display-4 text-warning mb-2"></i>
                            <h5 className='card-title'>Stock Bajo</h5>
                            <h3 className='text-warning'>{metricas.stockBajo}</h3>
                            <small className="text-muted">productos</small>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card border-danger'>
                        <div className='card-body text-center'>
                            <i className="bi bi-x-circle display-4 text-danger mb-2"></i>
                            <h5 className='card-title'>Agotados</h5>
                            <h3 className='text-danger'>{metricas.agotados}</h3>
                            <small className="text-muted">productos</small>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filtros y búsqueda */}
            <div className="row mb-3">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por código o descripción..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="btn-group w-100" role="group">
                        <button
                            className={`btn ${filtroStock === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltroStock('todos')}
                        >
                            <i className="bi bi-list me-1"></i>
                            Todos ({productos.filter(p => p.estado).length})
                        </button>
                        <button
                            className={`btn ${filtroStock === 'normal' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setFiltroStock('normal')}
                        >
                            <i className="bi bi-check-circle me-1"></i>
                            Normal ({productos.filter(p => p.estado && (p.stock || 0) > stockMinimo).length})
                        </button>
                        <button
                            className={`btn ${filtroStock === 'bajo' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setFiltroStock('bajo')}
                        >
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Bajo ({productos.filter(p => p.estado && (p.stock || 0) > 0 && (p.stock || 0) <= stockMinimo).length})
                        </button>
                        <button
                            className={`btn ${filtroStock === 'agotado' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setFiltroStock('agotado')}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Agotado ({productos.filter(p => p.estado && (p.stock || 0) === 0).length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Configuración de stock mínimo */}
            <div className="row mb-3">
                <div className="col-md-3">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-gear"></i>
                        </span>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Stock mínimo"
                            value={stockMinimo}
                            onChange={(e) => setStockMinimo(parseInt(e.target.value) || 10)}
                            min="1"
                        />
                        <span className="input-group-text">unidades</span>
                    </div>
                </div>
            </div>

            {/* Tabla de inventario */}
            <div className='card'>
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="bi bi-table me-2"></i>
                        Inventario de Productos
                    </h5>
                    <span className="badge bg-primary">
                        {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        <table className='table table-hover mb-0'>
                            <thead className="table-dark">
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Stock Actual</th>
                                    <th>Precios</th>
                                    <th>Estado Stock</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan='6' className='text-center py-4'>
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                            <div className="mt-2">Cargando productos...</div>
                                        </td>
                                    </tr>
                                ) : productosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan='6' className='text-center py-4'>
                                            <i className="bi bi-inbox display-4 text-muted"></i>
                                            <div className="mt-2 text-muted">
                                                {productos.length === 0 
                                                    ? 'No hay productos en el sistema'
                                                    : 'No se encontraron productos con los filtros aplicados'
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    productosFiltrados.map((producto) => {
                                        const stock = producto.stock || 0;
                                        let estadoStock = 'normal';
                                        let colorStock = 'success';
                                        let iconoStock = 'check-circle';

                                        if (stock === 0) {
                                            estadoStock = 'agotado';
                                            colorStock = 'danger';
                                            iconoStock = 'x-circle';
                                        } else if (stock <= stockMinimo) {
                                            estadoStock = 'bajo';
                                            colorStock = 'warning';
                                            iconoStock = 'exclamation-triangle';
                                        }

                                        return (
                                            <tr key={producto.id} className={stock === 0 ? 'table-danger' : stock <= stockMinimo ? 'table-warning' : ''}>
                                                <td>
                                                    <code className="bg-light px-2 py-1 rounded">
                                                        {producto.codigo}
                                                    </code>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-box-seam me-2 text-primary"></i>
                                                        <div>
                                                            <div className="fw-bold">{producto.descripcion}</div>
                                                            {producto.estado ? (
                                                                <small className="text-success">
                                                                    <i className="bi bi-check-circle me-1"></i>Activo
                                                                </small>
                                                            ) : (
                                                                <small className="text-danger">
                                                                    <i className="bi bi-x-circle me-1"></i>Inactivo
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className={`badge bg-${colorStock} me-2`}>
                                                            {stock.toLocaleString()}
                                                        </span>
                                                        <small className="text-muted">unidades</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="small">
                                                        <div><strong>General:</strong> ${(producto.pre_general || 0).toLocaleString()}</div>
                                                        <div><strong>Especial:</strong> ${(producto.pre_especial || 0).toLocaleString()}</div>
                                                        <div><strong>Mayor:</strong> ${(producto.pre_por_mayor || 0).toLocaleString()}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${colorStock} d-flex align-items-center justify-content-center`} style={{width: '80px'}}>
                                                        <i className={`bi bi-${iconoStock} me-1`}></i>
                                                        {estadoStock === 'normal' ? 'Normal' : 
                                                         estadoStock === 'bajo' ? 'Bajo' : 'Agotado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-success btn-sm"
                                                        onClick={() => handleAgregarStock(producto)}
                                                        title="Agregar stock"
                                                    >
                                                        <i className="bi bi-plus-circle me-1"></i>
                                                        Stock
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para agregar stock */}
            {showModalStock && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Agregar Stock
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setShowModalStock(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {productoSeleccionado && (
                                    <div>
                                        <div className="alert alert-info d-flex align-items-center">
                                            <i className="bi bi-info-circle me-2"></i>
                                            <div>
                                                <strong>Producto:</strong> {productoSeleccionado.descripcion}<br/>
                                                <strong>Código:</strong> {productoSeleccionado.codigo}<br/>
                                                <strong>Stock actual:</strong> {(productoSeleccionado.stock || 0).toLocaleString()} unidades
                                            </div>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label htmlFor="cantidadEntrada" className="form-label">
                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                Cantidad a agregar
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="cantidadEntrada"
                                                    value={cantidadEntrada}
                                                    onChange={(e) => setCantidadEntrada(e.target.value)}
                                                    placeholder="Ingrese cantidad"
                                                    min="1"
                                                    autoFocus
                                                />
                                                <span className="input-group-text">unidades</span>
                                            </div>
                                        </div>

                                        {cantidadEntrada && cantidadEntrada > 0 && (
                                            <div className="alert alert-success">
                                                <i className="bi bi-calculator me-2"></i>
                                                <strong>Nuevo stock:</strong> {((productoSeleccionado.stock || 0) + parseInt(cantidadEntrada)).toLocaleString()} unidades
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowModalStock(false)}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={procesarEntradaStock}
                                    disabled={!cantidadEntrada || cantidadEntrada <= 0 || loading}
                                >
                                    <i className="bi bi-check-lg me-2"></i>
                                    {loading ? 'Procesando...' : 'Agregar Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
