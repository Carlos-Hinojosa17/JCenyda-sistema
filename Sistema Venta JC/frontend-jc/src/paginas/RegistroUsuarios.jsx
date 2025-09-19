import React, { useState, useEffect } from 'react';
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
    const [editingUser, setEditingUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Estados para búsqueda y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filtroTipo, setFiltroTipo] = useState('todos');

    // Cargar usuarios al montar el componente
    useEffect(() => {
        cargarUsuarios();
    }, []);

    // Filtrado y búsqueda
    const usuariosFiltrados = usuarios.filter(usuario => {
        const nombre = usuario.nombre?.toLowerCase() || '';
        const nombreUsuario = usuario.usuario?.toLowerCase() || '';
        const termino = searchTerm.toLowerCase();
        
        const coincideBusqueda = nombre.includes(termino) || nombreUsuario.includes(termino);
        
        if (filtroTipo === 'todos') return coincideBusqueda;
        if (filtroTipo === 'admin') return coincideBusqueda && usuario.tipo === 'admin';
        if (filtroTipo === 'vendedor') return coincideBusqueda && usuario.tipo === 'vendedor';
        
        return coincideBusqueda;
    });

    // Cálculos de paginación
    const totalItems = usuariosFiltrados.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const usuariosPaginados = usuariosFiltrados.slice(startIndex, endIndex);

    // Función para cambiar página
    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
            setCurrentPage(nuevaPagina);
        }
    };

    // Resetear página cuando cambie el filtro o búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [filtroTipo, searchTerm]);

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
                // Actualizar lista de usuarios
                cargarUsuarios();
                // Cerrar modal
                setShowModal(false);
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
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const cancelarEdicion = () => {
        setEditingUser(null);
        setShowModal(false);
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

    const toggleModal = () => {
        setShowModal(!showModal);
        // Si se está editando, cancelar la edición
        if (editingUser) {
            cancelarEdicion();
        }
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
        <div 
            className='d-flex flex-column'
            style={{
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                width: '100%'
            }}
        >
            {/* Header Section */}
            <div 
                className='p-3 p-md-4 border-bottom'
                style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    borderBottom: '2px solid rgba(107, 66, 193, 0.1)'
                }}
            >
                <div className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
                    <div>
                        <h2 
                            className='mb-1 fw-bold'
                            style={{
                                background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)'
                            }}
                        >
                            <i className='bi bi-person-plus-fill me-2 me-md-3' style={{ color: '#6f42c1' }}></i>
                            Gestión de Usuarios
                        </h2>
                        <p className='mb-0 text-muted'>Administra los usuarios del sistema</p>
                    </div>
                    
                    <div className='d-flex align-items-center gap-2 gap-md-3'>
                        {/* Botón de agregar usuario */}
                        <button 
                            className='btn d-flex align-items-center gap-1 gap-md-2' 
                            onClick={toggleModal}
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                padding: '8px 12px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                boxShadow: '0 4px 16px rgba(40, 167, 69, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 24px rgba(40, 167, 69, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(0px)';
                                    e.target.style.boxShadow = '0 4px 16px rgba(40, 167, 69, 0.3)';
                                }
                            }}
                        >
                            {loading ? (
                                <span className='spinner-border spinner-border-sm'></span>
                            ) : (
                                <i className='bi bi-person-plus'></i>
                            )}
                            <span className='d-none d-sm-inline'>Nuevo </span>
                            <span>Usuario</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div 
                className='flex-grow-1 p-3 p-md-4'
                style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                }}
            >
                {/* Alertas */}
                {error && (
                    <div 
                        className='alert mb-4'
                        style={{
                            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                            border: '1px solid rgba(220, 53, 69, 0.2)',
                            borderRadius: '12px',
                            color: '#721c24'
                        }}
                    >
                        <i className='bi bi-exclamation-triangle me-2'></i>
                        {error}
                        <button 
                            type="button" 
                            className="btn-close float-end" 
                            onClick={() => setError('')}
                            style={{ fontSize: '0.8rem' }}
                        ></button>
                    </div>
                )}

                {success && (
                    <div 
                        className='alert mb-4'
                        style={{
                            background: 'linear-gradient(135deg, #d1edff 0%, #a7d8f0 100%)',
                            border: '1px solid rgba(13, 110, 253, 0.2)',
                            borderRadius: '12px',
                            color: '#004085'
                        }}
                    >
                        <i className='bi bi-check-circle me-2'></i>
                        {success}
                        <button 
                            type="button" 
                            className="btn-close float-end" 
                            onClick={() => setSuccess('')}
                            style={{ fontSize: '0.8rem' }}
                        ></button>
                    </div>
                )}

                {/* Main Content */}
                <div className='row g-4'>
                    {/* Lista de Usuarios Column - Ocupa todo el ancho */}
                    <div className='col-12'>
                        <div 
                            className='card border-0 shadow-sm'
                            style={{
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                            }}
                        >
                            <div 
                                className='card-header border-0 p-3 p-md-4'
                                style={{
                                    background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                    color: 'white'
                                }}
                            >
                                <div className='d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2'>
                                    <h5 className='mb-0 fw-semibold d-flex align-items-center'>
                                        <i className='bi bi-people-fill me-2'></i>
                                        <span className='d-none d-sm-inline'>Lista de </span>Usuarios
                                    </h5>
                                    <span 
                                        className='badge'
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {totalItems} de {usuarios.length}
                                    </span>
                                </div>

                                {/* Buscador */}
                                <div className='mb-3'>
                                    <div className='position-relative'>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Buscar por nombre o usuario..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                paddingLeft: '45px',
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                        <i 
                                            className='bi bi-search position-absolute'
                                            style={{
                                                left: '15px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: '#6c757d',
                                                fontSize: '1rem'
                                            }}
                                        ></i>
                                    </div>
                                </div>

                                {/* Filtros de tipo */}
                                <div className='mb-0'>
                                    <div className='d-flex flex-column flex-sm-row gap-2 d-sm-none'>
                                        {/* Vista móvil - botones apilados */}
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroTipo('admin')}
                                            style={{
                                                background: filtroTipo === 'admin' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-shield-fill me-1'></i>
                                            Admin ({usuarios.filter(u => u.tipo === 'admin').length})
                                        </button>
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroTipo('todos')}
                                            style={{
                                                background: filtroTipo === 'todos' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-list me-1'></i>
                                            Todos ({usuarios.length})
                                        </button>
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroTipo('vendedor')}
                                            style={{
                                                background: filtroTipo === 'vendedor' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-person-fill me-1'></i>
                                            Vendedor ({usuarios.filter(u => u.tipo === 'vendedor').length})
                                        </button>
                                    </div>
                                    
                                    {/* Vista desktop - botones en grupo horizontal */}
                                    <div className='btn-group w-100 d-none d-sm-flex' role='group'>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroTipo('admin')}
                                            style={{
                                                background: filtroTipo === 'admin' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-shield-fill me-1'></i>
                                            Admin ({usuarios.filter(u => u.tipo === 'admin').length})
                                        </button>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroTipo('todos')}
                                            style={{
                                                background: filtroTipo === 'todos' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-list me-1'></i>
                                            Todos ({usuarios.length})
                                        </button>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroTipo('vendedor')}
                                            style={{
                                                background: filtroTipo === 'vendedor' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-person-fill me-1'></i>
                                            Vendedor ({usuarios.filter(u => u.tipo === 'vendedor').length})
                                        </button>
                                    </div>
                                </div>
                            </div>
                            </div>

                            <div 
                                className='card-body p-0'
                                style={{ 
                                    maxHeight: '60vh', 
                                    overflowY: 'auto',
                                    padding: '0 !important'
                                }}
                            >
                                {usuariosPaginados.length === 0 ? (
                                    <div 
                                        className='text-center py-5 text-muted'
                                        style={{
                                            background: 'rgba(111, 66, 193, 0.05)',
                                            margin: '20px',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        <i className='bi bi-people display-1' style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                                        <h5 className='mt-3 mb-2'>No hay usuarios</h5>
                                        <p className='text-muted'>
                                            {searchTerm ? 'No se encontraron usuarios con esos criterios' : 'No hay usuarios registrados aún'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className='list-group list-group-flush'>
                                        {usuariosPaginados.map((usuario) => {
                                            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                            const isCurrentUser = currentUser.id === usuario.id;
                                            
                                            return (

                                                <div 
                                                    key={usuario.id}
                                                    className='list-group-item border-0'
                                                    style={{
                                                        background: isCurrentUser 
                                                            ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)'
                                                            : 'transparent',
                                                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    <div className='d-flex justify-content-between align-items-center py-2'>
                                                        <div className='d-flex flex-column gap-1'>
                                                            <div className='d-flex align-items-center gap-2'>
                                                                <div 
                                                                    className='rounded-circle d-flex align-items-center justify-content-center'
                                                                    style={{
                                                                        width: '40px',
                                                                        height: '40px',
                                                                        background: usuario.tipo === 'admin' 
                                                                            ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                                            : 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                                                        color: 'white',
                                                                        fontSize: '1.1rem'
                                                                    }}
                                                                >
                                                                    <i className={`bi ${usuario.tipo === 'admin' ? 'bi-shield-fill' : 'bi-person-fill'}`}></i>
                                                                </div>
                                                                <div>
                                                                    <h6 className='mb-0 fw-semibold d-flex align-items-center gap-2'>
                                                                        {usuario.nombre}
                                                                        {isCurrentUser && (
                                                                            <span 
                                                                                className='badge'
                                                                                style={{
                                                                                    background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                                                                                    color: '#000',
                                                                                    fontSize: '0.7rem',
                                                                                    borderRadius: '6px'
                                                                                }}
                                                                            >
                                                                                <i className='bi bi-person-check me-1'></i>
                                                                                Tú
                                                                            </span>
                                                                        )}
                                                                    </h6>
                                                                    <div className='d-flex align-items-center gap-2 text-muted small'>
                                                                        <i className='bi bi-at'></i>
                                                                        <code style={{ fontSize: '0.85rem' }}>{usuario.usuario}</code>
                                                                        <span 
                                                                            className='badge ms-2'
                                                                            style={{
                                                                                background: usuario.tipo === 'admin' 
                                                                                    ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                                                    : 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                                                                color: 'white',
                                                                                fontSize: '0.7rem',
                                                                                borderRadius: '6px'
                                                                            }}
                                                                        >
                                                                            {usuario.tipo === 'admin' ? 'Administrador' : 'Vendedor'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className='d-flex gap-2'>
                                                            <button
                                                                className='btn btn-sm'
                                                                onClick={() => iniciarEdicion(usuario)}
                                                                disabled={loading}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    color: 'white',
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="Editar usuario"
                                                            >
                                                                <i className='bi bi-pencil'></i>
                                                            </button>
                                                            <button
                                                                className='btn btn-sm'
                                                                onClick={() => eliminarUsuario(usuario.id, usuario.usuario)}
                                                                disabled={loading || isCurrentUser}
                                                                style={{
                                                                    background: isCurrentUser || loading 
                                                                        ? '#6c757d' 
                                                                        : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    color: 'white',
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    opacity: isCurrentUser || loading ? 0.5 : 1
                                                                }}
                                                                title={isCurrentUser ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
                                                            >
                                                                <i className='bi bi-trash'></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer con paginación */}
                            {totalItems > 0 && (
                                <div 
                                    className='card-footer border-0 p-3'
                                    style={{
                                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                        borderTop: '1px solid rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {/* Vista móvil */}
                                    <div className='d-flex flex-column gap-3 d-md-none'>
                                        {/* Información y selector en móvil */}
                                        <div className='d-flex justify-content-between align-items-center'>
                                            <span className='text-muted small'>
                                                {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                                            </span>
                                            
                                            <div className='d-flex align-items-center gap-2'>
                                                <label className='text-muted small mb-0'>Por página:</label>
                                                <select
                                                    className='form-select form-select-sm'
                                                    value={itemsPerPage}
                                                    onChange={(e) => {
                                                        setItemsPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    style={{
                                                        width: 'auto',
                                                        minWidth: '60px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #dee2e6',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Controles de paginación en móvil */}
                                        {totalPages > 1 && (
                                            <div className='d-flex justify-content-center align-items-center gap-1'>
                                                {/* Primera y anterior */}
                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(1)}
                                                    disabled={currentPage === 1}
                                                    style={{
                                                        background: currentPage === 1 ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === 1 ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '28px',
                                                        height: '28px',
                                                        fontSize: '0.7rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-double-left"></i>
                                                </button>

                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    style={{
                                                        background: currentPage === 1 ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === 1 ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '28px',
                                                        height: '28px',
                                                        fontSize: '0.7rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>

                                                {/* Páginas visibles - solo 3 en móvil */}
                                                {(() => {
                                                    const maxVisible = 3;
                                                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                                                    
                                                    if (endPage - startPage < maxVisible - 1) {
                                                        startPage = Math.max(1, endPage - maxVisible + 1);
                                                    }

                                                    const pages = [];
                                                    for (let i = startPage; i <= endPage; i++) {
                                                        pages.push(
                                                            <button
                                                                key={i}
                                                                className='btn btn-sm'
                                                                onClick={() => cambiarPagina(i)}
                                                                style={{
                                                                    background: currentPage === i 
                                                                        ? 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)' 
                                                                        : 'white',
                                                                    border: '1px solid #dee2e6',
                                                                    color: currentPage === i ? 'white' : '#495057',
                                                                    borderRadius: '6px',
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: currentPage === i ? '600' : 'normal'
                                                                }}
                                                            >
                                                                {i}
                                                            </button>
                                                        );
                                                    }
                                                    return pages;
                                                })()}

                                                {/* Siguiente y última */}
                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    style={{
                                                        background: currentPage === totalPages ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === totalPages ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '28px',
                                                        height: '28px',
                                                        fontSize: '0.7rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>

                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(totalPages)}
                                                    disabled={currentPage === totalPages}
                                                    style={{
                                                        background: currentPage === totalPages ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === totalPages ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '28px',
                                                        height: '28px',
                                                        fontSize: '0.7rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-double-right"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vista desktop */}
                                    <div className='d-none d-md-flex justify-content-between align-items-center flex-wrap gap-3'>
                                        {/* Información de registros */}
                                        <div className='d-flex align-items-center gap-3'>
                                            <span className='text-muted small'>
                                                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                                            </span>
                                            
                                            {/* Selector de elementos por página */}
                                            <div className='d-flex align-items-center gap-2'>
                                                <label className='text-muted small mb-0'>Por página:</label>
                                                <select
                                                    className='form-select form-select-sm'
                                                    value={itemsPerPage}
                                                    onChange={(e) => {
                                                        setItemsPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    style={{
                                                        width: 'auto',
                                                        minWidth: '70px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #dee2e6',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Controles de paginación en desktop */}
                                        {totalPages > 1 && (
                                            <div className='d-flex align-items-center gap-1'>
                                                {/* Botón Primera página */}
                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(1)}
                                                    disabled={currentPage === 1}
                                                    style={{
                                                        background: currentPage === 1 ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === 1 ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '32px',
                                                        height: '32px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-double-left"></i>
                                                </button>

                                                {/* Botón Página anterior */}
                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    style={{
                                                        background: currentPage === 1 ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === 1 ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '32px',
                                                        height: '32px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>

                                                {/* Números de página */}
                                                {(() => {
                                                    const maxVisible = 5;
                                                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                                                    
                                                    if (endPage - startPage < maxVisible - 1) {
                                                        startPage = Math.max(1, endPage - maxVisible + 1);
                                                    }

                                                    const pages = [];
                                                    for (let i = startPage; i <= endPage; i++) {
                                                        pages.push(
                                                            <button
                                                                key={i}
                                                                className='btn btn-sm'
                                                                onClick={() => cambiarPagina(i)}
                                                                style={{
                                                                    background: currentPage === i 
                                                                        ? 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)' 
                                                                        : 'white',
                                                                    border: '1px solid #dee2e6',
                                                                    color: currentPage === i ? 'white' : '#495057',
                                                                    borderRadius: '6px',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: currentPage === i ? '600' : 'normal'
                                                                }}
                                                            >
                                                                {i}
                                                            </button>
                                                        );
                                                    }
                                                    return pages;
                                                })()}

                                                {/* Botón Página siguiente */}
                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    style={{
                                                        background: currentPage === totalPages ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === totalPages ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '32px',
                                                        height: '32px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>

                                                {/* Botón Última página */}
                                                <button
                                                    className='btn btn-sm'
                                                    onClick={() => cambiarPagina(totalPages)}
                                                    disabled={currentPage === totalPages}
                                                    style={{
                                                        background: currentPage === totalPages ? '#f8f9fa' : 'white',
                                                        border: '1px solid #dee2e6',
                                                        color: currentPage === totalPages ? '#6c757d' : '#495057',
                                                        borderRadius: '6px',
                                                        width: '32px',
                                                        height: '32px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-double-right"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal flotante para el formulario */}
                {showModal && (
                    <div>
                        <style>
                            {`
                                @keyframes modalSlideIn {
                                    from {
                                        opacity: 0;
                                        transform: translateY(-50px) scale(0.9);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translateY(0px) scale(1);
                                    }
                                }
                            `}
                        </style>
                        <div 
                            className='position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 1050,
                                backdropFilter: 'blur(4px)'
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setShowModal(false);
                                    cancelarEdicion();
                                }
                            }}
                        >
                            <div 
                                className='card border-0 shadow-lg'
                                style={{
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    width: '90%',
                                    maxWidth: '600px',
                                    maxHeight: '95vh',
                                    animation: 'modalSlideIn 0.3s ease-out'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div 
                                    className='card-header border-0 p-4 d-flex justify-content-between align-items-center'
                                    style={{
                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                        color: 'white',
                                        borderRadius: '20px 20px 0 0'
                                    }}
                                >
                                    <h5 className='mb-0 fw-semibold d-flex align-items-center'>
                                        <i className={`bi ${editingUser ? 'bi-pencil-square' : 'bi-person-plus'} me-2`}></i>
                                        {editingUser ? 'Editando Usuario' : 'Nuevo Usuario'}
                                    </h5>
                                    <button 
                                        className='btn btn-sm'
                                        onClick={() => {
                                            setShowModal(false);
                                            cancelarEdicion();
                                        }}
                                        disabled={loading}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            width: '32px',
                                            height: '32px'
                                        }}
                                    >
                                        <i className='bi bi-x-lg'></i>
                                    </button>
                                </div>

                                <div className='card-body p-4'>
                                    {error && (
                                        <div 
                                            className='alert mb-4'
                                            style={{
                                                background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                                                border: '1px solid rgba(220, 53, 69, 0.2)',
                                                borderRadius: '12px',
                                                color: '#721c24'
                                            }}
                                        >
                                            <i className='bi bi-exclamation-triangle me-2'></i>
                                            {error}
                                            <button 
                                                type="button" 
                                                className="btn-close float-end" 
                                                onClick={() => setError('')}
                                                style={{ fontSize: '0.8rem' }}
                                            ></button>
                                        </div>
                                    )}

                                    <form onSubmit={editingUser ? handleEditSubmit : handleSubmit}>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label 
                                                    className="form-label fw-semibold"
                                                    style={{ color: '#495057' }}
                                                >
                                                    <i className="bi bi-person me-2" style={{ color: '#6f42c1' }}></i>
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
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e9ecef',
                                                        padding: '12px 16px',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label 
                                                    className="form-label fw-semibold"
                                                    style={{ color: '#495057' }}
                                                >
                                                    <i className="bi bi-at me-2" style={{ color: '#6f42c1' }}></i>
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
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e9ecef',
                                                        padding: '12px 16px',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label 
                                                    className="form-label fw-semibold"
                                                    style={{ color: '#495057' }}
                                                >
                                                    <i className="bi bi-lock me-2" style={{ color: '#6f42c1' }}></i>
                                                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                                                </label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="contrasena"
                                                    value={formData.contrasena}
                                                    onChange={handleInputChange}
                                                    required={!editingUser}
                                                    disabled={loading}
                                                    minLength="4"
                                                    placeholder={editingUser ? "Dejar vacío para mantener actual" : "Mínimo 4 caracteres"}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e9ecef',
                                                        padding: '12px 16px',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                                {editingUser && (
                                                    <div className="form-text">
                                                        Dejar vacío si no deseas cambiar la contraseña
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label 
                                                    className="form-label fw-semibold"
                                                    style={{ color: '#495057' }}
                                                >
                                                    <i className="bi bi-lock-fill me-2" style={{ color: '#6f42c1' }}></i>
                                                    Confirmar Contraseña
                                                </label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="confirmarContrasena"
                                                    value={formData.confirmarContrasena}
                                                    onChange={handleInputChange}
                                                    required={!editingUser || formData.contrasena}
                                                    disabled={loading}
                                                    placeholder={editingUser ? "Confirmar nueva contraseña" : "Repetir contraseña"}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e9ecef',
                                                        padding: '12px 16px',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label 
                                                className="form-label fw-semibold"
                                                style={{ color: '#495057' }}
                                            >
                                                <i className="bi bi-shield-check me-2" style={{ color: '#6f42c1' }}></i>
                                                Tipo de Usuario
                                            </label>
                                            <select
                                                className="form-select"
                                                name="tipo"
                                                value={formData.tipo}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #e9ecef',
                                                    padding: '12px 16px',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                <option value="vendedor">Vendedor - Acceso limitado (Productos y Almacén)</option>
                                                <option value="admin">Administrador - Acceso completo</option>
                                            </select>
                                        </div>

                                        <div className='d-flex gap-3 justify-content-end'>
                                            <button 
                                                type="button" 
                                                className='btn'
                                                onClick={() => {
                                                    setShowModal(false);
                                                    cancelarEdicion();
                                                }}
                                                disabled={loading}
                                                style={{
                                                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    color: 'white',
                                                    padding: '12px 24px',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                <i className='bi bi-x-circle me-2'></i>
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                className='btn'
                                                disabled={loading}
                                                style={{
                                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    color: 'white',
                                                    padding: '12px 24px',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '500',
                                                    boxShadow: '0 4px 16px rgba(40, 167, 69, 0.3)'
                                                }}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        {editingUser ? 'Actualizando...' : 'Creando...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className={`bi ${editingUser ? 'bi-check-circle' : 'bi-person-plus'} me-2`}></i>
                                                        {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}