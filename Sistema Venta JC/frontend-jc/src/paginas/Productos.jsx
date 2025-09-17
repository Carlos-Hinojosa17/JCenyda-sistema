import React, { useState } from 'react';
import { productService } from '../services/apiServices';

export default function Productos() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showProductos, setShowProductos] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos', 'todos', 'inactivos'
    
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

    // Manejar cambios en los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Filtrar productos según el estado seleccionado
    const productosFiltrados = productos.filter(producto => {
        switch(filtroEstado) {
            case 'activos':
                return producto.estado === true;
            case 'inactivos':
                return producto.estado === false;
            case 'todos':
            default:
                return true;
        }
    });

    // Manejar cambio de filtro
    const handleFiltroChange = (nuevoFiltro) => {
        setFiltroEstado(nuevoFiltro);
    };

    // Crear nuevo producto
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

        // Validar que el stock sea un número válido
        const stockNumerico = parseInt(formData.stock);
        if (isNaN(stockNumerico) || stockNumerico < 0) {
            setError('El stock debe ser un número válido mayor o igual a 0');
            setLoading(false);
            return;
        }

        try {
            console.log('📝 Creando nuevo producto:', formData);

            // Convertir precios a números
            const productData = {
                ...formData,
                stock: stockNumerico,
                pre_compra: formData.pre_compra ? parseFloat(formData.pre_compra) : null,
                pre_especial: formData.pre_especial ? parseFloat(formData.pre_especial) : null,
                pre_por_mayor: formData.pre_por_mayor ? parseFloat(formData.pre_por_mayor) : null,
                pre_general: formData.pre_general ? parseFloat(formData.pre_general) : null
            };

            const response = await productService.create(productData);
            
            if (response.success) {
                setSuccess(`Producto "${formData.descripcion}" creado exitosamente`);
                
                // Optimización: Agregar el nuevo producto a la lista local
                if (showProductos && response.data) {
                    setProductos(prevProductos => [...prevProductos, response.data]);
                }
                
                // Limpiar formulario
                setFormData({
                    codigo: '',
                    descripcion: '',
                    stock: 0,
                    pre_compra: '',
                    pre_especial: '',
                    pre_por_mayor: '',
                    pre_general: ''
                });
            } else {
                throw new Error(response.message || 'Error al crear producto');
            }
        } catch (error) {
            console.error('❌ Error al crear producto:', error);
            setError(error.message || 'Error al crear el producto');
        } finally {
            setLoading(false);
        }
    };

    // Cargar productos
    const cargarProductos = async () => {
        try {
            setLoading(true);
            const response = await productService.getAll();
            setProductos(response);
            setShowProductos(true);
            setError('');
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            setError(error.message || 'Error al cargar los productos');
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

    // Eliminar producto
    const eliminarProducto = async (id, descripcion) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el producto "${descripcion}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await productService.delete(id);
            if (response.success) {
                setSuccess(`Producto "${descripcion}" eliminado exitosamente`);
                
                // Optimización: Actualizar el estado del producto en la lista local
                setProductos(prevProductos => 
                    prevProductos.map(producto => 
                        producto.id === id 
                            ? { ...producto, estado: false }
                            : producto
                    )
                );
            } else {
                throw new Error(response.message || 'Error al eliminar producto');
            }
        } catch (error) {
            console.error('❌ Error al eliminar producto:', error);
            setError(error.message || 'Error al eliminar el producto');
        } finally {
            setLoading(false);
        }
    };

    // Reactivar producto
    const reactivarProducto = async (id, descripcion) => {
        if (!window.confirm(`¿Estás seguro de que deseas reactivar el producto "${descripcion}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await productService.update(id, { estado: true });
            if (response.success) {
                setSuccess(`Producto "${descripcion}" reactivado exitosamente`);
                
                // Optimización: Actualizar el estado del producto en la lista local
                setProductos(prevProductos => 
                    prevProductos.map(producto => 
                        producto.id === id 
                            ? { ...producto, estado: true }
                            : producto
                    )
                );
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

    // Iniciar edición de producto
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
        setShowEditModal(true);
        setError('');
        setSuccess('');
    };

    // Cancelar edición
    const cancelarEdicion = () => {
        setEditingProduct(null);
        setShowEditModal(false);
        setFormData({
            codigo: '',
            descripcion: '',
            stock: 0,
            pre_compra: '',
            pre_especial: '',
            pre_por_mayor: '',
            pre_general: ''
        });
        setError('');
    };

    // Actualizar producto
    const handleEditSubmit = async (e) => {
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

        // Validar que el stock sea un número válido
        const stockNumerico = parseInt(formData.stock);
        if (isNaN(stockNumerico) || stockNumerico < 0) {
            setError('El stock debe ser un número válido mayor o igual a 0');
            setLoading(false);
            return;
        }

        try {
            console.log('✏️ Actualizando producto:', editingProduct.id);

            // Convertir precios a números
            const productData = {
                ...formData,
                stock: stockNumerico,
                pre_compra: formData.pre_compra ? parseFloat(formData.pre_compra) : null,
                pre_especial: formData.pre_especial ? parseFloat(formData.pre_especial) : null,
                pre_por_mayor: formData.pre_por_mayor ? parseFloat(formData.pre_por_mayor) : null,
                pre_general: formData.pre_general ? parseFloat(formData.pre_general) : null
            };

            const response = await productService.update(editingProduct.id, productData);
            
            if (response.success) {
                setSuccess(`Producto "${formData.descripcion}" actualizado exitosamente`);
                
                // Optimización: Actualizar solo el producto en la lista local
                setProductos(prevProductos => 
                    prevProductos.map(producto => 
                        producto.id === editingProduct.id 
                            ? { ...producto, ...productData }
                            : producto
                    )
                );
                
                cancelarEdicion();
            } else {
                throw new Error(response.message || 'Error al actualizar producto');
            }
        } catch (error) {
            console.error('❌ Error al actualizar producto:', error);
            setError(error.message || 'Error al actualizar el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="mb-0">
                            <i className="bi bi-box-seam-fill me-2"></i>
                            Gestión de Productos
                        </h2>
                        <button 
                            className="btn btn-outline-info"
                            onClick={cargarProductos}
                            disabled={loading}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            {showProductos ? 'Ocultar' : 'Ver'} Productos
                        </button>
                    </div>

                    {/* Filtros de estado */}
                    {showProductos && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="btn-group" role="group">
                                    <button
                                        className={`btn ${filtroEstado === 'activos' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setFiltroEstado('activos')}
                                    >
                                        <i className="bi bi-check-circle me-1"></i>
                                        Activos ({productos.filter(p => p.estado).length})
                                    </button>
                                    <button
                                        className={`btn ${filtroEstado === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setFiltroEstado('todos')}
                                    >
                                        <i className="bi bi-list me-1"></i>
                                        Todos ({productos.length})
                                    </button>
                                    <button
                                        className={`btn ${filtroEstado === 'inactivos' ? 'btn-danger' : 'btn-outline-danger'}`}
                                        onClick={() => setFiltroEstado('inactivos')}
                                    >
                                        <i className="bi bi-x-circle me-1"></i>
                                        Inactivos ({productos.filter(p => !p.estado).length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="row">
                {/* Formulario de productos */}
                <div className={`col-lg-${showProductos ? '6' : '8'} mb-4`}>
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-plus-circle me-2"></i>
                                {editingProduct ? 'Editando Producto' : 'Crear Nuevo Producto'}
                            </h5>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger alert-dismissible" role="alert">
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
                                <div className="alert alert-success alert-dismissible" role="alert">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    {success}
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={() => setSuccess('')}
                                    ></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-upc me-1"></i>
                                            Código *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="codigo"
                                            value={formData.codigo}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            placeholder="Ej: PROD001"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-box me-1"></i>
                                            Stock
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            min="0"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <i className="bi bi-card-text me-1"></i>
                                        Descripción *
                                    </label>
                                    <textarea
                                        className="form-control"
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        rows="3"
                                        placeholder="Descripción detallada del producto"
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-currency-dollar me-1"></i>
                                            Precio de Compra
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="pre_compra"
                                            value={formData.pre_compra}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-star me-1"></i>
                                            Precio Especial
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="pre_especial"
                                            value={formData.pre_especial}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-people me-1"></i>
                                            Precio por Mayor
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="pre_por_mayor"
                                            value={formData.pre_por_mayor}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-tag me-1"></i>
                                            Precio General
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
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

                                <div className="d-grid">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Creando Producto...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-circle me-2"></i>
                                                Crear Producto
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Lista de productos */}
                {showProductos && (
                    <div className="col-lg-6">
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        <i className="bi bi-boxes me-2"></i>
                                        Productos Registrados ({productosFiltrados.length} de {productos.length})
                                    </h5>
                                    
                                    {/* Filtros de estado */}
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button 
                                            type="button" 
                                            className={`btn ${filtroEstado === 'activos' ? 'btn-success' : 'btn-outline-success'}`}
                                            onClick={() => handleFiltroChange('activos')}
                                            title="Solo productos activos"
                                        >
                                            <i className="bi bi-check-circle me-1"></i>
                                            Activos ({productos.filter(p => p.estado === true).length})
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${filtroEstado === 'todos' ? 'btn-info' : 'btn-outline-info'}`}
                                            onClick={() => handleFiltroChange('todos')}
                                            title="Todos los productos"
                                        >
                                            <i className="bi bi-list me-1"></i>
                                            Todos ({productos.length})
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${filtroEstado === 'inactivos' ? 'btn-danger' : 'btn-outline-danger'}`}
                                            onClick={() => handleFiltroChange('inactivos')}
                                            title="Solo productos inactivos"
                                        >
                                            <i className="bi bi-x-circle me-1"></i>
                                            Inactivos ({productos.filter(p => p.estado === false).length})
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {productosFiltrados.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-box display-1"></i>
                                        <p className="mt-3">
                                            {filtroEstado === 'activos' && 'No hay productos activos'}
                                            {filtroEstado === 'inactivos' && 'No hay productos inactivos'}
                                            {filtroEstado === 'todos' && 'No hay productos registrados'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Código</th>
                                                    <th>Descripción</th>
                                                    <th>Stock</th>
                                                    <th>P. General</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {productosFiltrados.map((producto) => (
                                                    <tr key={producto.id}>
                                                        <td>
                                                            <code className="text-primary">{producto.codigo}</code>
                                                        </td>
                                                        <td>
                                                            <span className="fw-medium">{producto.descripcion}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${producto.stock <= 5 ? 'bg-danger' : producto.stock <= 10 ? 'bg-warning' : 'bg-success'}`}>
                                                                {producto.stock}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {producto.pre_general ? (
                                                                <span className="text-success fw-bold">
                                                                    ${parseFloat(producto.pre_general).toFixed(2)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">Sin precio</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${producto.estado ? 'bg-success' : 'bg-danger'}`}>
                                                                {producto.estado ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group" role="group">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary me-1"
                                                                    onClick={() => iniciarEdicion(producto)}
                                                                    disabled={loading}
                                                                    title="Editar producto"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                {producto.estado ? (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => eliminarProducto(producto.id, producto.descripcion)}
                                                                        disabled={loading}
                                                                        title="Eliminar producto"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-success"
                                                                        onClick={() => reactivarProducto(producto.id, producto.descripcion)}
                                                                        disabled={loading}
                                                                        title="Reactivar producto"
                                                                    >
                                                                        <i className="bi bi-arrow-clockwise"></i>
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
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para editar producto */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Editar Producto: {editingProduct?.descripcion}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={cancelarEdicion}
                                    disabled={loading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-danger alert-dismissible" role="alert">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {error}
                                        <button 
                                            type="button" 
                                            className="btn-close" 
                                            onClick={() => setError('')}
                                        ></button>
                                    </div>
                                )}

                                <form onSubmit={handleEditSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-upc me-1"></i>
                                                Código *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="codigo"
                                                value={formData.codigo}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="Ej: PROD001"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-box me-1"></i>
                                                Stock
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                min="0"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-card-text me-1"></i>
                                            Descripción *
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            rows="3"
                                            placeholder="Descripción detallada del producto"
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-currency-dollar me-1"></i>
                                                Precio de Compra
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="pre_compra"
                                                value={formData.pre_compra}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-star me-1"></i>
                                                Precio Especial
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="pre_especial"
                                                value={formData.pre_especial}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-people me-1"></i>
                                                Precio por Mayor
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="pre_por_mayor"
                                                value={formData.pre_por_mayor}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-tag me-1"></i>
                                                Precio General
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
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
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={cancelarEdicion}
                                    disabled={loading}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    onClick={handleEditSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Actualizando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Actualizar Producto
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
