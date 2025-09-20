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
    const [filtroEstado, setFiltroEstado] = useState('todos'); // nuevo filtro por estado

    // Estados para confirmaciones modernas
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmButtonText, setConfirmButtonText] = useState('');
    const [confirmButtonIcon, setConfirmButtonIcon] = useState('');
    const [confirmButtonLoadingText, setConfirmButtonLoadingText] = useState('');
    const [confirmButtonColor, setConfirmButtonColor] = useState('');

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
        
        // Filtro por tipo de usuario
        let cumpleTipo = true;
        if (filtroTipo === 'admin') cumpleTipo = usuario.tipo === 'admin';
        else if (filtroTipo === 'vendedor') cumpleTipo = usuario.tipo === 'vendedor';
        
        // Filtro por estado del usuario
        let cumpleEstado = true;
        if (filtroEstado === 'activos') cumpleEstado = usuario.estado !== false;
        else if (filtroEstado === 'inactivos') cumpleEstado = usuario.estado === false;
        
        return coincideBusqueda && cumpleTipo && cumpleEstado;
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
    }, [filtroTipo, filtroEstado, searchTerm]);

    // Auto-dismiss para mensajes de éxito y error
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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

    const toggleUsuarioEstado = async (id, usuario, usuarioObj) => {
        // Verificar si es el usuario actual
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id === id) {
            setError('No puedes modificar el estado de tu propio usuario');
            return;
        }

        const estaActivo = usuarioObj.estado !== false; // Por defecto true si no existe la propiedad
        const accion = estaActivo ? 'desactivar' : 'reactivar';
        const iconoAccion = estaActivo ? '🔒' : '✅';

        // Mostrar confirmación moderna con textos dinámicos
        setConfirmTitle(`${iconoAccion} Confirmar ${accion.charAt(0).toUpperCase() + accion.slice(1)}`);
        setConfirmMessage(`¿Estás seguro de que deseas ${accion} el usuario "${usuario}"? ${estaActivo ? 'El usuario no podrá acceder al sistema.' : 'El usuario podrá acceder nuevamente al sistema.'}`);
        
        // Configurar textos dinámicos del botón
        if (estaActivo) {
            // Desactivar usuario
            setConfirmButtonText('Desactivar');
            setConfirmButtonIcon('bi-lock');
            setConfirmButtonLoadingText('Desactivando...');
            setConfirmButtonColor('linear-gradient(135deg, #dc3545 0%, #c82333 100%)');
        } else {
            // Reactivar usuario
            setConfirmButtonText('Reactivar');
            setConfirmButtonIcon('bi-check-circle');
            setConfirmButtonLoadingText('Reactivando...');
            setConfirmButtonColor('linear-gradient(135deg, #28a745 0%, #20c997 100%)');
        }
        
        setConfirmAction(() => async () => {
            try {
                setLoading(true);
                // Usar la función correcta toggleUserStatus
                const nuevoEstado = !estaActivo;
                const response = await authService.toggleUserStatus(id, nuevoEstado);
                if (response.success) {
                    setSuccess(`Usuario "${usuario}" ${estaActivo ? 'desactivado' : 'reactivado'} exitosamente`);
                    cargarUsuarios();
                } else {
                    throw new Error(response.message || `Error al ${accion} usuario`);
                }
            } catch (error) {
                console.error(`❌ Error al ${accion} usuario:`, error);
                setError(error.message || `Error al ${accion} el usuario`);
            } finally {
                setLoading(false);
            }
        });
            try {
                setLoading(true);
                // Usar la función correcta toggleUserStatus
                const nuevoEstado = !estaActivo;
                const response = await authService.toggleUserStatus(id, nuevoEstado);
                if (response.success) {
                    setSuccess(`Usuario "${usuario}" ${estaActivo ? 'desactivado' : 'reactivado'} exitosamente`);
                    cargarUsuarios();
                } else {
                    throw new Error(response.message || `Error al ${accion} usuario`);
                }
            } catch (error) {
                console.error(`❌ Error al ${accion} usuario:`, error);
                setError(error.message || `Error al ${accion} el usuario`);
            } finally {
                setLoading(false);
            }
        setShowConfirm(true);
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
            className='d-flex flex-column min-vh-100'
            style={{
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                width: '100%'
            }}
        >
            {/* Header Section Mejorado */}
            <div 
                className='p-4 p-md-5'
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
            >
                <div className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
                    <div>
                        <h1 
                            className='mb-2 fw-bold text-white'
                            style={{
                                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                                letterSpacing: '-0.5px',
                                textShadow: '2px 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            <i className='bi bi-people-fill me-3' style={{ color: '#fff' }}></i>
                            Gestión de Usuarios
                        </h1>
                        <p className='mb-0 text-white-50 fs-5'>
                            <i className='bi bi-shield-check me-2'></i>
                            Administra usuarios y permisos del sistema
                        </p>
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
                className='flex-grow-1 p-4 p-md-5'
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px 24px 0 0',
                    marginTop: '-20px',
                    position: 'relative',
                    zIndex: 1
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
                            className='card border-0 shadow-lg'
                            style={{
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)',
                                backdropFilter: 'blur(15px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.1)'
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

                                {/* Filtros por estado */}
                                <div className='mt-3'>
                                    <div className='d-flex flex-column flex-sm-row gap-2 d-sm-none'>
                                        {/* Vista móvil - filtros de estado */}
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroEstado('activos')}
                                            style={{
                                                background: filtroEstado === 'activos' 
                                                    ? 'rgba(40, 167, 69, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-check-circle-fill me-1'></i>
                                            Activos ({usuarios.filter(u => u.estado !== false).length})
                                        </button>
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroEstado('todos')}
                                            style={{
                                                background: filtroEstado === 'todos' 
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
                                            onClick={() => setFiltroEstado('inactivos')}
                                            style={{
                                                background: filtroEstado === 'inactivos' 
                                                    ? 'rgba(220, 53, 69, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-x-circle-fill me-1'></i>
                                            Inactivos ({usuarios.filter(u => u.estado === false).length})
                                        </button>
                                    </div>
                                    
                                    {/* Vista desktop - filtros de estado */}
                                    <div className='btn-group w-100 d-none d-sm-flex' role='group'>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroEstado('activos')}
                                            style={{
                                                background: filtroEstado === 'activos' 
                                                    ? 'rgba(40, 167, 69, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-check-circle-fill me-1'></i>
                                            Activos ({usuarios.filter(u => u.estado !== false).length})
                                        </button>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroEstado('todos')}
                                            style={{
                                                background: filtroEstado === 'todos' 
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
                                            onClick={() => setFiltroEstado('inactivos')}
                                            style={{
                                                background: filtroEstado === 'inactivos' 
                                                    ? 'rgba(220, 53, 69, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-x-circle-fill me-1'></i>
                                            Inactivos ({usuarios.filter(u => u.estado === false).length})
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
                                    padding: '0 !important',
                                    background: 'rgba(255,255,255,0.95)',
                                    backdropFilter: 'blur(5px)',
                                    borderRadius: '0 0 16px 16px'
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
                                        <i className='bi bi-people display-1' style={{ fontSize: '4rem', opacity: 0.5, color: 'white' }}></i>
                                        <h5 className='mt-3 mb-2' style={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>No hay usuarios</h5>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
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
                                                            ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 193, 7, 0.03) 100%)'
                                                            : usuario.estado === false
                                                                ? 'linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(220, 53, 69, 0.02) 100%)'
                                                                : 'white',
                                                        borderBottom: '1px solid rgba(111, 66, 193, 0.08)',
                                                        borderRadius: '12px',
                                                        margin: '4px 8px',
                                                        transition: 'all 0.3s ease',
                                                        cursor: 'default',
                                                        opacity: usuario.estado === false ? 0.7 : 1,
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isCurrentUser) {
                                                            e.target.style.background = 'linear-gradient(135deg, rgba(111, 66, 193, 0.05) 0%, rgba(111, 66, 193, 0.02) 100%)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 16px rgba(111, 66, 193, 0.1)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isCurrentUser) {
                                                            e.target.style.background = 'transparent';
                                                            e.target.style.transform = 'translateY(0px)';
                                                            e.target.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    <div className='d-flex justify-content-between align-items-center py-3 px-2'>
                                                        <div className='d-flex flex-column gap-1'>
                                                            <div className='d-flex align-items-center gap-3'>
                                                                <div 
                                                                    className='rounded-circle d-flex align-items-center justify-content-center position-relative'
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        background: usuario.tipo === 'admin' 
                                                                            ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                                            : 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                                                        color: 'white',
                                                                        fontSize: '1.2rem',
                                                                        fontWeight: '600',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                                        border: '3px solid rgba(255,255,255,0.9)'
                                                                    }}
                                                                >
                                                                    {/* Iniciales del usuario */}
                                                                    {usuario.nombre ? 
                                                                        usuario.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() 
                                                                        : 'U'
                                                                    }
                                                                    
                                                                    {/* Icono de tipo de usuario en esquina */}
                                                                    <div 
                                                                        className='position-absolute d-flex align-items-center justify-content-center'
                                                                        style={{
                                                                            bottom: '-2px',
                                                                            right: '-2px',
                                                                            width: '20px',
                                                                            height: '20px',
                                                                            borderRadius: '50%',
                                                                            background: usuario.tipo === 'admin' ? '#fff' : '#fff',
                                                                            color: usuario.tipo === 'admin' ? '#dc3545' : '#17a2b8',
                                                                            fontSize: '0.7rem',
                                                                            border: '2px solid #fff',
                                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                                                        }}
                                                                    >
                                                                        <i className={`bi ${usuario.tipo === 'admin' ? 'bi-shield-fill' : 'bi-person-fill'}`}></i>
                                                                    </div>

                                                                    {/* Indicador de usuario inactivo */}
                                                                    {usuario.estado === false && (
                                                                        <div 
                                                                            className='position-absolute d-flex align-items-center justify-content-center'
                                                                            style={{
                                                                                top: '-5px',
                                                                                left: '-5px',
                                                                                width: '24px',
                                                                                height: '24px',
                                                                                borderRadius: '50%',
                                                                                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                                                                color: 'white',
                                                                                fontSize: '0.7rem',
                                                                                border: '2px solid #fff',
                                                                                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.4)',
                                                                                zIndex: 10
                                                                            }}
                                                                            title="Usuario inactivo"
                                                                        >
                                                                            <i className="bi bi-x-lg"></i>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h6 className='mb-1 fw-semibold d-flex align-items-center gap-2'>
                                                                        <span style={{ fontSize: '1.1rem', color: '#2c3e50' }}>
                                                                            {usuario.nombre}
                                                                        </span>
                                                                        {isCurrentUser && (
                                                                            <span 
                                                                                className='badge'
                                                                                style={{
                                                                                    background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                                                                                    color: '#000',
                                                                                    fontSize: '0.7rem',
                                                                                    borderRadius: '8px',
                                                                                    padding: '4px 8px',
                                                                                    fontWeight: '600'
                                                                                }}
                                                                            >
                                                                                <i className='bi bi-person-check me-1'></i>
                                                                                Tú
                                                                            </span>
                                                                        )}
                                                                        
                                                                        {/* Badge de estado del usuario */}
                                                                        <span 
                                                                            className='badge'
                                                                            style={{
                                                                                background: usuario.estado === false 
                                                                                    ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                                                    : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                                                color: 'white',
                                                                                fontSize: '0.65rem',
                                                                                borderRadius: '6px',
                                                                                padding: '3px 6px',
                                                                                fontWeight: '600',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}
                                                                        >
                                                                            <i className={`bi ${usuario.estado === false ? 'bi-x-circle-fill' : 'bi-check-circle-fill'} me-1`}></i>
                                                                            {usuario.estado === false ? 'Inactivo' : 'Activo'}
                                                                        </span>
                                                                    </h6>
                                                                    
                                                                    <div className='d-flex align-items-center gap-3 mb-2'>
                                                                        <div className='d-flex align-items-center gap-1 text-muted'>
                                                                            <i className='bi bi-at' style={{ fontSize: '0.8rem' }}></i>
                                                                            <code style={{ 
                                                                                fontSize: '0.85rem',
                                                                                background: 'rgba(111, 66, 193, 0.1)',
                                                                                color: '#6f42c1',
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                fontWeight: '500'
                                                                            }}>
                                                                                {usuario.usuario}
                                                                            </code>
                                                                        </div>
                                                                        
                                                                        <span 
                                                                            className='badge'
                                                                            style={{
                                                                                background: usuario.tipo === 'admin' 
                                                                                    ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                                                    : 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                                                                color: 'white',
                                                                                fontSize: '0.7rem',
                                                                                borderRadius: '8px',
                                                                                padding: '4px 8px',
                                                                                fontWeight: '500',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
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
                                                                    borderRadius: '10px',
                                                                    color: 'white',
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                                                                    transition: 'all 0.3s ease',
                                                                    fontSize: '0.9rem'
                                                                }}
                                                                title="Editar usuario"
                                                                onMouseEnter={(e) => {
                                                                    if (!loading) {
                                                                        e.target.style.transform = 'translateY(-2px)';
                                                                        e.target.style.boxShadow = '0 8px 20px rgba(0, 123, 255, 0.4)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!loading) {
                                                                        e.target.style.transform = 'translateY(0px)';
                                                                        e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                                                                    }
                                                                }}
                                                            >
                                                                <i className='bi bi-pencil-square'></i>
                                                            </button>
                                                            <button
                                                                className='btn btn-sm'
                                                                onClick={() => toggleUsuarioEstado(usuario.id, usuario.usuario, usuario)}
                                                                disabled={loading || isCurrentUser}
                                                                style={{
                                                                    background: isCurrentUser || loading 
                                                                        ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' 
                                                                        : usuario.estado !== false
                                                                            ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'  // Rojo para desactivar
                                                                            : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', // Verde para reactivar
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    color: 'white',
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxShadow: isCurrentUser || loading 
                                                                        ? '0 4px 12px rgba(108, 117, 125, 0.3)' 
                                                                        : usuario.estado !== false
                                                                            ? '0 4px 12px rgba(220, 53, 69, 0.3)'
                                                                            : '0 4px 12px rgba(40, 167, 69, 0.3)',
                                                                    transition: 'all 0.3s ease',
                                                                    fontSize: '0.9rem',
                                                                    cursor: isCurrentUser || loading ? 'not-allowed' : 'pointer'
                                                                }}
                                                                title={
                                                                    isCurrentUser 
                                                                        ? "No puedes modificar tu propio usuario" 
                                                                        : usuario.estado !== false 
                                                                            ? "Desactivar usuario" 
                                                                            : "Reactivar usuario"
                                                                }
                                                                onMouseEnter={(e) => {
                                                                    if (!loading && !isCurrentUser) {
                                                                        e.target.style.transform = 'translateY(-2px)';
                                                                        const shadowColor = usuario.estado !== false 
                                                                            ? 'rgba(220, 53, 69, 0.4)' 
                                                                            : 'rgba(40, 167, 69, 0.4)';
                                                                        e.target.style.boxShadow = `0 8px 20px ${shadowColor}`;
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!loading && !isCurrentUser) {
                                                                        e.target.style.transform = 'translateY(0px)';
                                                                        const shadowColor = usuario.estado !== false 
                                                                            ? 'rgba(220, 53, 69, 0.3)'
                                                                            : 'rgba(40, 167, 69, 0.3)';
                                                                        e.target.style.boxShadow = `0 4px 12px ${shadowColor}`;
                                                                    }
                                                                }}
                                                            >
                                                                <i className={`bi ${usuario.estado !== false ? 'bi-lock-fill' : 'bi-unlock-fill'}`}></i>
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
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        borderTop: '1px solid rgba(111, 66, 193, 0.1)',
                                        backdropFilter: 'blur(5px)',
                                        borderRadius: '0 0 16px 16px'
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

                {/* Modal de Confirmación Moderno */}
                {showConfirm && (
                    <div>
                        <style>
                            {`
                                @keyframes confirmSlideIn {
                                    from {
                                        opacity: 0;
                                        transform: translateY(-20px) scale(0.95);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translateY(0px) scale(1);
                                    }
                                }
                                
                                @keyframes confirmPulse {
                                    0%, 100% { transform: scale(1); }
                                    50% { transform: scale(1.05); }
                                }
                            `}
                        </style>
                        <div 
                            className='position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                zIndex: 1060,
                                backdropFilter: 'blur(8px)'
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setShowConfirm(false);
                                    setConfirmAction(null);
                                }
                            }}
                        >
                            <div 
                                className='card border-0 shadow-lg mx-3'
                                style={{
                                    borderRadius: '24px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    width: '100%',
                                    maxWidth: '500px',
                                    animation: 'confirmSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    overflow: 'hidden'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header con gradiente de peligro */}
                                <div 
                                    className='p-4 text-center position-relative'
                                    style={{
                                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                        color: 'white'
                                    }}
                                >
                                    <div 
                                        className='d-inline-flex align-items-center justify-content-center mb-3'
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.15)',
                                            animation: 'confirmPulse 2s infinite'
                                        }}
                                    >
                                        <i 
                                            className='bi bi-exclamation-triangle-fill'
                                            style={{ 
                                                fontSize: '2.5rem',
                                                color: '#fff'
                                            }}
                                        ></i>
                                    </div>
                                    <h4 className='mb-0 fw-bold'>{confirmTitle}</h4>
                                </div>

                                {/* Cuerpo del mensaje */}
                                <div className='p-4 text-center'>
                                    <p 
                                        className='mb-4 text-muted'
                                        style={{ 
                                            fontSize: '1.1rem',
                                            lineHeight: '1.5'
                                        }}
                                    >
                                        {confirmMessage}
                                    </p>

                                    {/* Botones de acción */}
                                    <div className='d-flex gap-3 justify-content-center'>
                                        <button
                                            className='btn px-4 py-2'
                                            onClick={() => {
                                                setShowConfirm(false);
                                                setConfirmAction(null);
                                            }}
                                            disabled={loading}
                                            style={{
                                                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontWeight: '500',
                                                minWidth: '120px',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 8px 20px rgba(108, 117, 125, 0.3)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = 'translateY(0px)';
                                                    e.target.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            <i className='bi bi-x-lg me-2'></i>
                                            Cancelar
                                        </button>

                                        <button
                                            className='btn px-4 py-2'
                                            onClick={async () => {
                                                if (confirmAction) {
                                                    setShowConfirm(false);
                                                    await confirmAction();
                                                    setConfirmAction(null);
                                                }
                                            }}
                                            disabled={loading}
                                            style={{
                                                background: confirmButtonColor,
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontWeight: '500',
                                                minWidth: '120px',
                                                boxShadow: '0 4px 16px rgba(220, 53, 69, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 8px 24px rgba(220, 53, 69, 0.4)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = 'translateY(0px)';
                                                    e.target.style.boxShadow = '0 4px 16px rgba(220, 53, 69, 0.3)';
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className='spinner-border spinner-border-sm me-2'></span>
                                                    {confirmButtonLoadingText}
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`bi ${confirmButtonIcon} me-2`}></i>
                                                    {confirmButtonText}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}