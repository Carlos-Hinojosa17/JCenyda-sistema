import React, { useState } from 'react';
import { clientService } from '../services/apiServices';

export default function Clientes() {
    const [formData, setFormData] = useState({
        nombre: '',
        documento: '',
        telefono: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [clientes, setClientes] = useState([]);
    const [showClientes, setShowClientes] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos', 'todos', 'inactivos'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validaciones
        if (!formData.nombre.trim()) {
            setError('El nombre es obligatorio');
            setLoading(false);
            return;
        }

        if (!formData.documento.trim()) {
            setError('El documento es obligatorio');
            setLoading(false);
            return;
        }

        // Validar que el documento sea numérico (para INTEGER en BD)
        const documentoNumerico = parseInt(formData.documento);
        if (isNaN(documentoNumerico) || documentoNumerico <= 0) {
            setError('El documento debe ser un número válido');
            setLoading(false);
            return;
        }

        try {
            console.log('📝 Creando nuevo cliente:', formData);

            const response = await clientService.create(formData);
            
            if (response.success) {
                setSuccess(`Cliente "${formData.nombre}" creado exitosamente`);
                
                // Optimización: Agregar el nuevo cliente a la lista local
                // en lugar de recargar toda la lista
                if (showClientes && response.data) {
                    setClientes(prevClientes => [...prevClientes, response.data]);
                }
                
                // Limpiar formulario
                setFormData({
                    nombre: '',
                    documento: '',
                    telefono: ''
                });
            } else {
                throw new Error(response.message || 'Error al crear cliente');
            }
        } catch (error) {
            console.error('❌ Error al crear cliente:', error);
            setError(error.message || 'Error al crear el cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Array filtrado de clientes según el estado seleccionado
    const clientesFiltrados = clientes.filter(cliente => {
        if (filtroEstado === 'activos') return cliente.estado;
        if (filtroEstado === 'inactivos') return !cliente.estado;
        return true; // 'todos'
    });

    const cargarClientes = async () => {
        try {
            setLoading(true);
            const response = await clientService.getAll();
            console.log('📋 Clientes obtenidos:', response);
            setClientes(response || []);
            setShowClientes(true);
        } catch (error) {
            console.error('❌ Error al cargar clientes:', error);
            setError('Error al cargar la lista de clientes');
        } finally {
            setLoading(false);
        }
    };

    const eliminarCliente = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el cliente "${nombre}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await clientService.delete(id);
            if (response.success) {
                setSuccess(`Cliente "${nombre}" eliminado exitosamente`);
                
                // Optimización: Actualizar el estado del cliente en la lista local
                setClientes(prevClientes => 
                    prevClientes.map(cliente => 
                        cliente.id === id 
                            ? { ...cliente, estado: false }
                            : cliente
                    )
                );
            } else {
                throw new Error(response.message || 'Error al eliminar cliente');
            }
        } catch (error) {
            console.error('❌ Error al eliminar cliente:', error);
            setError(error.message || 'Error al eliminar el cliente');
        } finally {
            setLoading(false);
        }
    };

    // Reactivar cliente
    const reactivarCliente = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que deseas reactivar el cliente "${nombre}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await clientService.update(id, { estado: true });
            if (response.success) {
                setSuccess(`Cliente "${nombre}" reactivado exitosamente`);
                
                // Optimización: Actualizar el estado del cliente en la lista local
                setClientes(prevClientes => 
                    prevClientes.map(cliente => 
                        cliente.id === id 
                            ? { ...cliente, estado: true }
                            : cliente
                    )
                );
            } else {
                throw new Error(response.message || 'Error al reactivar cliente');
            }
        } catch (error) {
            console.error('❌ Error al reactivar cliente:', error);
            setError(error.message || 'Error al reactivar el cliente');
        } finally {
            setLoading(false);
        }
    };

    const iniciarEdicion = (cliente) => {
        setEditingClient(cliente);
        setFormData({
            nombre: cliente.nombre,
            documento: cliente.documento,
            telefono: cliente.telefono || ''
        });
        setShowEditModal(true);
        setError('');
        setSuccess('');
    };

    const cancelarEdicion = () => {
        setEditingClient(null);
        setShowEditModal(false);
        setFormData({
            nombre: '',
            documento: '',
            telefono: ''
        });
        setError('');
        setSuccess('');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validaciones
        if (!formData.nombre.trim()) {
            setError('El nombre es obligatorio');
            setLoading(false);
            return;
        }

        if (!formData.documento.trim()) {
            setError('El documento es obligatorio');
            setLoading(false);
            return;
        }

        // Validar que el documento sea numérico (para INTEGER en BD)
        const documentoNumerico = parseInt(formData.documento);
        if (isNaN(documentoNumerico) || documentoNumerico <= 0) {
            setError('El documento debe ser un número válido');
            setLoading(false);
            return;
        }

        try {
            console.log('✏️ Actualizando cliente:', editingClient.id);

            const response = await clientService.update(editingClient.id, formData);
            
            if (response.success) {
                setSuccess(`Cliente "${formData.nombre}" actualizado exitosamente`);
                
                // Optimización: Actualizar solo el cliente en la lista local
                // en lugar de recargar toda la lista desde el servidor
                setClientes(prevClientes => 
                    prevClientes.map(cliente => 
                        cliente.id === editingClient.id 
                            ? { ...cliente, ...formData }
                            : cliente
                    )
                );
                
                cancelarEdicion();
            } else {
                throw new Error(response.message || 'Error al actualizar cliente');
            }
        } catch (error) {
            console.error('❌ Error al actualizar cliente:', error);
            setError(error.message || 'Error al actualizar el cliente');
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
                            <i className="bi bi-people-fill me-2"></i>
                            Gestión de Clientes
                        </h2>
                        <button 
                            className="btn btn-outline-info"
                            onClick={cargarClientes}
                            disabled={loading}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            {showClientes ? 'Ocultar' : 'Ver'} Clientes
                        </button>
                    </div>

                    {/* Filtros de estado */}
                    {showClientes && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="btn-group" role="group">
                                    <button
                                        className={`btn ${filtroEstado === 'activos' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setFiltroEstado('activos')}
                                    >
                                        <i className="bi bi-check-circle me-1"></i>
                                        Activos ({clientes.filter(c => c.estado).length})
                                    </button>
                                    <button
                                        className={`btn ${filtroEstado === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setFiltroEstado('todos')}
                                    >
                                        <i className="bi bi-list me-1"></i>
                                        Todos ({clientes.length})
                                    </button>
                                    <button
                                        className={`btn ${filtroEstado === 'inactivos' ? 'btn-danger' : 'btn-outline-danger'}`}
                                        onClick={() => setFiltroEstado('inactivos')}
                                    >
                                        <i className="bi bi-x-circle me-1"></i>
                                        Inactivos ({clientes.filter(c => !c.estado).length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="row">
                {/* Formulario de clientes */}
                <div className={`col-lg-${showClientes ? '6' : '8'} mb-4`}>
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-person-plus me-2"></i>
                                {editingClient ? 'Editando Cliente' : 'Crear Nuevo Cliente'}
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
                                            <i className="bi bi-person me-1"></i>
                                            Nombre Completo *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            placeholder="Ej: Juan Pérez García"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-card-text me-1"></i>
                                            Documento *
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="documento"
                                            value={formData.documento}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            placeholder="Ej: 12345678"
                                            min="1"
                                            max="999999999"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <i className="bi bi-telephone me-1"></i>
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Ej: +569 1234 5678"
                                    />
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
                                                Creando Cliente...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-plus me-2"></i>
                                                Crear Cliente
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Lista de clientes */}
                {showClientes && (
                    <div className="col-lg-6">
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="bi bi-people me-2"></i>
                                    Clientes Registrados ({clientes.length})
                                </h5>
                            </div>
                            <div className="card-body">
                                {clientes.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-people display-1"></i>
                                        <p className="mt-3">No hay clientes registrados</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Documento</th>
                                                    <th>Teléfono</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clientesFiltrados.map((cliente) => (
                                                    <tr key={cliente.id}>
                                                        <td>
                                                            <i className="bi bi-person-circle me-2"></i>
                                                            {cliente.nombre}
                                                        </td>
                                                        <td>
                                                            <code>{cliente.documento}</code>
                                                        </td>
                                                        <td>
                                                            {cliente.telefono ? (
                                                                <span>
                                                                    <i className="bi bi-telephone me-1"></i>
                                                                    {cliente.telefono}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">Sin teléfono</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${cliente.estado ? 'bg-success' : 'bg-danger'}`}>
                                                                {cliente.estado ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group" role="group">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary me-1"
                                                                    onClick={() => iniciarEdicion(cliente)}
                                                                    disabled={loading}
                                                                    title="Editar cliente"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                {cliente.estado ? (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => eliminarCliente(cliente.id, cliente.nombre)}
                                                                        disabled={loading}
                                                                        title="Eliminar cliente"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-success"
                                                                        onClick={() => reactivarCliente(cliente.id, cliente.nombre)}
                                                                        disabled={loading}
                                                                        title="Reactivar cliente"
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

            {/* Modal para editar cliente */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Editar Cliente: {editingClient?.nombre}
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
                                                <i className="bi bi-person me-1"></i>
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="Ej: Juan Pérez García"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-card-text me-1"></i>
                                                Documento *
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="documento"
                                                value={formData.documento}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="Ej: 12345678"
                                                min="1"
                                                max="999999999"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-telephone me-1"></i>
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            placeholder="Ej: +569 1234 5678"
                                        />
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
                                            Actualizar Cliente
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
