import React, { useState } from 'react';
import { authService } from '../services/apiServices';

export default function RegistroUsuarios() {
    const [formData, setFormData] = useState({
        nombre: '',
        usuario: '',
        contrasena: '',
        confirmarContrasena: '',
        tipo: 'vendedor'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [showUsuarios, setShowUsuarios] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validaciones
        if (formData.contrasena !== formData.confirmarContrasena) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (formData.contrasena.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            setLoading(false);
            return;
        }

        try {
            console.log('📝 Registrando nuevo usuario:', { 
                nombre: formData.nombre, 
                usuario: formData.usuario, 
                tipo: formData.tipo 
            });

            // Crear objeto sin confirmarContrasena
            const userData = {
                nombre: formData.nombre,
                usuario: formData.usuario,
                contrasena: formData.contrasena,
                tipo: formData.tipo
            };

            const response = await authService.createUser(userData);
            
            if (response.success) {
                setSuccess(`Usuario "${formData.usuario}" creado exitosamente`);
                // Limpiar formulario
                setFormData({
                    nombre: '',
                    usuario: '',
                    contrasena: '',
                    confirmarContrasena: '',
                    tipo: 'vendedor'
                });
                // Actualizar lista de usuarios si está visible
                if (showUsuarios) {
                    cargarUsuarios();
                }
            } else {
                throw new Error(response.message || 'Error al crear usuario');
            }
        } catch (error) {
            console.error('❌ Error al registrar usuario:', error);
            setError(error.message || 'Error al crear el usuario');
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

    const cargarUsuarios = async () => {
        try {
            setLoading(true);
            const response = await authService.getAllUsers();
            if (response.success) {
                setUsuarios(response.data || []);
                setShowUsuarios(true);
            } else {
                throw new Error(response.message || 'Error al cargar usuarios');
            }
        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error);
            setError('Error al cargar la lista de usuarios');
        } finally {
            setLoading(false);
        }
    };

    const eliminarUsuario = async (id, usuario) => {
        // Verificar si es el usuario actual
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id === id) {
            setError('No puedes eliminar tu propio usuario');
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar el usuario "${usuario}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await authService.deleteUser(id);
            if (response.success) {
                setSuccess(`Usuario "${usuario}" eliminado exitosamente`);
                cargarUsuarios();
            } else {
                throw new Error(response.message || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            setError(error.message || 'Error al eliminar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const iniciarEdicion = (usuario) => {
        setEditingUser(usuario);
        setFormData({
            nombre: usuario.nombre,
            usuario: usuario.usuario,
            contrasena: '',
            confirmarContrasena: '',
            tipo: usuario.tipo
        });
        setShowEditModal(true);
        setError('');
        setSuccess('');
    };

    const cancelarEdicion = () => {
        setEditingUser(null);
        setShowEditModal(false);
        setFormData({
            nombre: '',
            usuario: '',
            contrasena: '',
            confirmarContrasena: '',
            tipo: 'vendedor'
        });
        setError('');
        setSuccess('');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Solo validar contraseñas si se están cambiando
        if (formData.contrasena || formData.confirmarContrasena) {
            if (formData.contrasena !== formData.confirmarContrasena) {
                setError('Las contraseñas no coinciden');
                setLoading(false);
                return;
            }

            if (formData.contrasena.length < 4) {
                setError('La contraseña debe tener al menos 4 caracteres');
                setLoading(false);
                return;
            }
        }

        try {
            console.log('✏️ Actualizando usuario:', editingUser.id);

            // Crear objeto de actualización
            const updateData = {
                nombre: formData.nombre,
                usuario: formData.usuario,
                tipo: formData.tipo
            };

            // Solo incluir contraseña si se está cambiando
            if (formData.contrasena) {
                updateData.contrasena = formData.contrasena;
            }

            const response = await authService.updateUser(editingUser.id, updateData);
            
            if (response.success) {
                setSuccess(`Usuario "${formData.usuario}" actualizado exitosamente`);
                cancelarEdicion();
                // Actualizar lista de usuarios
                cargarUsuarios();
            } else {
                throw new Error(response.message || 'Error al actualizar usuario');
            }
        } catch (error) {
            console.error('❌ Error al actualizar usuario:', error);
            setError(error.message || 'Error al actualizar el usuario');
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
                            <i className="bi bi-person-plus-fill me-2"></i>
                            Registro de Usuarios
                        </h2>
                        <button 
                            className="btn btn-outline-info"
                            onClick={cargarUsuarios}
                            disabled={loading}
                        >
                            <i className="bi bi-people-fill me-2"></i>
                            {showUsuarios ? 'Ocultar' : 'Ver'} Usuarios
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Formulario de registro */}
                <div className={`col-lg-${showUsuarios ? '6' : '8'} mb-4`}>
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-person-add me-2"></i>
                                {editingUser ? 'Editando Usuario' : 'Crear Nuevo Usuario'}
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
                                            Nombre Completo
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-at me-1"></i>
                                            Usuario
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="usuario"
                                            value={formData.usuario}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            placeholder="Ej: juan.perez"
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-lock me-1"></i>
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="contrasena"
                                            value={formData.contrasena}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            minLength="4"
                                            placeholder="Mínimo 4 caracteres"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-lock-fill me-1"></i>
                                            Confirmar Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="confirmarContrasena"
                                            value={formData.confirmarContrasena}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            placeholder="Repetir contraseña"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <i className="bi bi-shield-check me-1"></i>
                                        Tipo de Usuario
                                    </label>
                                    <select
                                        className="form-select"
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="vendedor">Vendedor - Acceso limitado (Productos y Almacén)</option>
                                        <option value="admin">Administrador - Acceso completo</option>
                                    </select>
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
                                                Creando Usuario...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-plus me-2"></i>
                                                Crear Usuario
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Lista de usuarios */}
                {showUsuarios && (
                    <div className="col-lg-6">
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="bi bi-people me-2"></i>
                                    Usuarios Registrados ({usuarios.length})
                                </h5>
                            </div>
                            <div className="card-body">
                                {usuarios.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-people display-1"></i>
                                        <p className="mt-3">No hay usuarios registrados</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Usuario</th>
                                                    <th>Tipo</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usuarios.map((usuario) => {
                                                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                                    const isCurrentUser = currentUser.id === usuario.id;
                                                    
                                                    return (
                                                        <tr key={usuario.id} className={isCurrentUser ? 'table-warning' : ''}>
                                                            <td>
                                                                <i className="bi bi-person-circle me-2"></i>
                                                                {usuario.nombre}
                                                                {isCurrentUser && (
                                                                    <span className="badge bg-warning text-dark ms-2">
                                                                        <i className="bi bi-person-check me-1"></i>
                                                                        Tú
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <code>{usuario.usuario}</code>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${
                                                                    usuario.tipo === 'admin' 
                                                                        ? 'bg-danger' 
                                                                        : 'bg-info'
                                                                }`}>
                                                                    {usuario.tipo === 'admin' ? 'Administrador' : 'Vendedor'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="btn-group" role="group">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary me-1"
                                                                        onClick={() => iniciarEdicion(usuario)}
                                                                        disabled={loading}
                                                                        title="Editar usuario"
                                                                    >
                                                                        <i className="bi bi-pencil"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => eliminarUsuario(usuario.id, usuario.usuario)}
                                                                        disabled={loading || isCurrentUser}
                                                                        title={isCurrentUser ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para editar usuario */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Editar Usuario: {editingUser?.usuario}
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
                                                Nombre Completo
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="Ej: Juan Pérez"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-at me-1"></i>
                                                Usuario
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="usuario"
                                                value={formData.usuario}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="Ej: juan.perez"
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-lock me-1"></i>
                                                Nueva Contraseña (opcional)
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="contrasena"
                                                value={formData.contrasena}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                minLength="4"
                                                placeholder="Dejar vacío para mantener actual"
                                            />
                                            <div className="form-text">
                                                Dejar vacío si no deseas cambiar la contraseña
                                            </div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="bi bi-lock-fill me-1"></i>
                                                Confirmar Nueva Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="confirmarContrasena"
                                                value={formData.confirmarContrasena}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                placeholder="Confirmar nueva contraseña"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            <i className="bi bi-shield-check me-1"></i>
                                            Tipo de Usuario
                                        </label>
                                        <select
                                            className="form-select"
                                            name="tipo"
                                            value={formData.tipo}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="vendedor">Vendedor - Acceso limitado (Productos y Almacén)</option>
                                            <option value="admin">Administrador - Acceso completo</option>
                                        </select>
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
                                            Actualizar Usuario
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