import React, { useState, useEffect } from 'react';
import { clientService } from '../services/apiServices';

// Estilos CSS para las animaciones del modal
const modalStyles = `
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @keyframes modalSlideOut {
        from {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
        to {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
        }
    }

    .modal-overlay {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

// Inyectar estilos en el head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = modalStyles;
    document.head.appendChild(styleElement);
}

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
    const [_showClientes, _setShowClientes] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [_showEditModal, _setShowEditModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos', 'todos', 'inactivos'
    
    // Estados para confirmación
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmData, setConfirmData] = useState(null);
    
    // Estados para búsqueda y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Cargar clientes automáticamente al montar el componente
    useEffect(() => {
        cargarClientes();
    }, []);

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

        // Validar teléfono si se proporciona
        if (formData.telefono.trim()) {
            if (formData.telefono.length !== 9) {
                setError('El teléfono debe tener exactamente 9 dígitos');
                setLoading(false);
                return;
            }
            if (!/^\d{9}$/.test(formData.telefono)) {
                setError('El teléfono solo debe contener números');
                setLoading(false);
                return;
            }
        }

        try {
            console.log('📝 Creando nuevo cliente:', formData);

            const response = await clientService.create(formData);
            
            if (response.success) {
                setSuccess(`Cliente "${formData.nombre}" creado exitosamente`);
                
                // Optimización: Agregar el nuevo cliente a la lista local
                // en lugar de recargar toda la lista
                if (response.data) {
                    setClientes(prevClientes => [...prevClientes, response.data]);
                }
                
                // Limpiar formulario y cerrar modal
                setFormData({
                    nombre: '',
                    documento: '',
                    telefono: ''
                });
                setShowModal(false);
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
        
        // Validación específica para el campo teléfono
        if (name === 'telefono') {
            // Solo permitir números y limitar a 9 dígitos
            const numerosSolo = value.replace(/[^0-9]/g, '');
            const telefonoLimitado = numerosSolo.slice(0, 9);
            
            setFormData(prev => ({
                ...prev,
                [name]: telefonoLimitado
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Array filtrado de clientes según el estado seleccionado
    const clientesFiltrados = clientes.filter(cliente => {
        if (filtroEstado === 'activos') return cliente.estado;
        if (filtroEstado === 'inactivos') return !cliente.estado;
        return true; // 'todos'
    });

    // Array filtrado por búsqueda
    const clientesFiltradosPorBusqueda = clientesFiltrados.filter(cliente => {
        if (!searchTerm.trim()) return true;
        
        const termino = searchTerm.toLowerCase().trim();
        const nombre = cliente.nombre.toLowerCase();
        const documento = cliente.documento.toString();
        
        return nombre.includes(termino) || documento.includes(termino);
    });

    // Cálculos de paginación
    const totalItems = clientesFiltradosPorBusqueda.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const clientesPaginados = clientesFiltradosPorBusqueda.slice(startIndex, endIndex);

    // Función para cambiar página
    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
            setCurrentPage(nuevaPagina);
        }
    };

    // Función para limpiar búsqueda
    const limpiarBusqueda = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Resetear página cuando cambie el filtro de estado o búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [filtroEstado, searchTerm]);

    const cargarClientes = async () => {
        try {
            setLoading(true);
            const response = await clientService.getAll();
            console.log('📋 Clientes obtenidos:', response);
            setClientes(response || []);
        } catch (error) {
            console.error('❌ Error al cargar clientes:', error);
            setError('Error al cargar la lista de clientes');
        } finally {
            setLoading(false);
        }
    };

    // Funciones para confirmación moderna
    const showConfirmation = (action, data) => {
        setConfirmAction(action);
        setConfirmData(data);
        setShowConfirmModal(true);
    };

    const executeConfirmAction = async () => {
        if (confirmAction === 'delete') {
            await executeDeleteClient(confirmData.id, confirmData.nombre);
        } else if (confirmAction === 'reactivate') {
            await executeReactivateClient(confirmData.id, confirmData.nombre);
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
    };

    const cancelConfirmAction = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
    };

    const toggleModal = () => {
        setShowModal(!showModal);
        // Si se está editando, cancelar la edición
        if (editingClient) {
            cancelarEdicion();
        }
    };

    const eliminarCliente = (id, nombre) => {
        showConfirmation('delete', { id, nombre });
    };

    const executeDeleteClient = async (id, nombre) => {
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
    const reactivarCliente = (id, nombre) => {
        showConfirmation('reactivate', { id, nombre });
    };

    const executeReactivateClient = async (id, nombre) => {
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
        setError('');
        setSuccess('');
    };

    const cancelarEdicion = () => {
        setEditingClient(null);
        setFormData({
            nombre: '',
            documento: '',
            telefono: ''
        });
        setError('');
        setSuccess('');
        setShowModal(false);
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

        // Validar teléfono si se proporciona
        if (formData.telefono.trim()) {
            if (formData.telefono.length !== 9) {
                setError('El teléfono debe tener exactamente 9 dígitos');
                setLoading(false);
                return;
            }
            if (!/^\d{9}$/.test(formData.telefono)) {
                setError('El teléfono solo debe contener números');
                setLoading(false);
                return;
            }
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
                className='p-4 border-0 position-relative overflow-hidden'
                style={{
                    background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 50%, #17a2b8 100%)',
                    color: 'white',
                    minHeight: '140px'
                }}
            >
                {/* Elementos decorativos de fondo */}
                <div 
                    className='position-absolute'
                    style={{
                        top: '-50%',
                        right: '-10%',
                        width: '300px',
                        height: '300px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        filter: 'blur(80px)'
                    }}
                ></div>
                <div 
                    className='position-absolute'
                    style={{
                        bottom: '-30%',
                        left: '-10%',
                        width: '200px',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '50%',
                        filter: 'blur(60px)'
                    }}
                ></div>

                <div className='position-relative'>
                    <div className='d-flex justify-content-between align-items-center flex-wrap gap-3'>
                        <div className='flex-grow-1'>
                            <div className='d-flex align-items-center mb-2'>
                                <div 
                                    className='me-3 d-flex align-items-center justify-content-center'
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '15px',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)'
                                    }}
                                >
                                    <i className='bi bi-people-fill' style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                                <div>
                                    <h1 
                                        className='mb-1 fw-bold'
                                        style={{
                                            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                                            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                                            letterSpacing: '-0.02em'
                                        }}
                                    >
                                        Gestión de Clientes
                                    </h1>
                                    <p 
                                        className='mb-0'
                                        style={{
                                            fontSize: '1.1rem',
                                            opacity: 0.9,
                                            fontWeight: '300'
                                        }}
                                    >
                                        Administra y gestiona tu cartera de clientes
                                    </p>
                                </div>
                            </div>
                        </div>
                    <div className='d-flex align-items-center gap-3'>
                            {/* Botón de registrar cliente */}
                            <button 
                                className='btn d-flex align-items-center gap-2' 
                                onClick={toggleModal}
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    padding: '10px 16px',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    boxShadow: '0 4px 16px rgba(40, 167, 69, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.target.style.background = 'linear-gradient(135deg, #218838 0%, #1e7e34 100%)';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 24px rgba(40, 167, 69, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) {
                                        e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
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
                                <span>Nuevo Cliente</span>
                            </button>
                    </div>
                    </div>
                        
                    
                </div>

                {/* Métricas del sistema */}
                <div className='row g-3 mt-2'>
                        <div className='col-6 col-md-3'>
                            <div 
                                className='p-3 rounded-3'
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <div className='d-flex align-items-center'>
                                    <i className='bi bi-people me-3' style={{ fontSize: '1.5rem', opacity: 0.9 }}></i>
                                    <div>
                                        <div className='fw-bold' style={{ fontSize: '1.4rem' }}>
                                            {clientes.length}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                            Total Clientes
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-6 col-md-3'>
                            <div 
                                className='p-3 rounded-3'
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <div className='d-flex align-items-center'>
                                    <i className='bi bi-check-circle me-3' style={{ fontSize: '1.5rem', opacity: 0.9 }}></i>
                                    <div>
                                        <div className='fw-bold' style={{ fontSize: '1.4rem' }}>
                                            {clientes.filter(c => c.estado).length}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                            Activos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-6 col-md-3'>
                            <div 
                                className='p-3 rounded-3'
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <div className='d-flex align-items-center'>
                                    <i className='bi bi-x-circle me-3' style={{ fontSize: '1.5rem', opacity: 0.9 }}></i>
                                    <div>
                                        <div className='fw-bold' style={{ fontSize: '1.4rem' }}>
                                            {clientes.filter(c => !c.estado).length}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                            Inactivos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-6 col-md-3'>
                            <div 
                                className='p-3 rounded-3'
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <div className='d-flex align-items-center'>
                                    <i className='bi bi-search me-3' style={{ fontSize: '1.5rem', opacity: 0.9 }}></i>
                                    <div>
                                        <div className='fw-bold' style={{ fontSize: '1.4rem' }}>
                                            {totalItems}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                            Filtrados
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                </div>
            </div>

            {/* Content Area */}
            <div 
                className='flex-grow-1 p-3 p-md-4'
            >
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
                    {/* Lista de Clientes Column - Siempre ocupa todo el ancho */}
                    <div className='col-12'>
                        <div 
                            className='card border-0 shadow-sm'
                            style={{
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                            }}
                        >
                            <div 
                                className='card-header border-0 p-4'
                                style={{
                                    background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 50%, #17a2b8 100%)',
                                    color: 'white',
                                    borderRadius: '16px 16px 0 0',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Efectos decorativos de fondo */}
                                <div 
                                    className='position-absolute'
                                    style={{
                                        top: '-50%',
                                        right: '-20%',
                                        width: '200px',
                                        height: '200px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '50%',
                                        filter: 'blur(60px)'
                                    }}
                                ></div>
                                
                                <div className='position-relative'>
                                    <div className='d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2'>
                                        <h5 className='mb-0 fw-bold d-flex align-items-center'>
                                            <div 
                                                className='me-3 d-flex align-items-center justify-content-center'
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background: 'rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '12px',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.3)'
                                                }}
                                            >
                                                <i className='bi bi-list-ul' style={{ fontSize: '1.2rem' }}></i>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                                                    Lista de Clientes
                                                </div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: '300' }}>
                                                    Gestiona tu cartera de clientes
                                                </div>
                                            </div>
                                        </h5>
                                        <div 
                                            className='badge d-flex align-items-center gap-2'
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.2)',
                                                fontSize: '0.8rem',
                                                padding: '8px 12px',
                                                borderRadius: '10px',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.3)'
                                            }}
                                        >
                                            <i className='bi bi-people'></i>
                                            {totalItems} de {clientes.length}
                                        </div>
                                    </div>

                                {/* Buscador */}
                                <div className='mb-3'>
                                    <div className='position-relative'>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Buscar por nombre o documento..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: 'white',
                                                padding: '10px 45px 10px 15px',
                                                fontSize: '0.9rem'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                            }}
                                        />
                                        <div 
                                            className='position-absolute top-50 end-0 translate-middle-y pe-3'
                                            style={{ pointerEvents: searchTerm ? 'auto' : 'none' }}
                                        >
                                            {searchTerm ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm p-0"
                                                    onClick={limpiarBusqueda}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        fontSize: '1rem'
                                                    }}
                                                    title="Limpiar búsqueda"
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                </button>
                                            ) : (
                                                <i 
                                                    className="bi bi-search" 
                                                    style={{ 
                                                        color: 'rgba(255, 255, 255, 0.6)',
                                                        fontSize: '0.9rem'
                                                    }}
                                                ></i>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Filtros de estado */}
                                <div className='mb-0'>
                                    <div className='d-flex flex-column flex-sm-row gap-2 d-sm-none'>
                                        {/* Vista móvil - botones apilados */}
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroEstado('activos')}
                                            style={{
                                                background: filtroEstado === 'activos' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-check-circle me-1'></i>
                                            Activos ({clientes.filter(c => c.estado).length})
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
                                            Todos ({clientes.length})
                                        </button>
                                        <button
                                            className='btn btn-sm flex-fill'
                                            onClick={() => setFiltroEstado('inactivos')}
                                            style={{
                                                background: filtroEstado === 'inactivos' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className='bi bi-x-circle me-1'></i>
                                            Inactivos ({clientes.filter(c => !c.estado).length})
                                        </button>
                                    </div>
                                    
                                    {/* Vista desktop - botones en grupo horizontal */}
                                    <div className='btn-group w-100 d-none d-sm-flex' role='group'>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroEstado('activos')}
                                            style={{
                                                background: filtroEstado === 'activos' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-check-circle me-1'></i>
                                            Activos ({clientes.filter(c => c.estado).length})
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
                                            Todos ({clientes.length})
                                        </button>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setFiltroEstado('inactivos')}
                                            style={{
                                                background: filtroEstado === 'inactivos' 
                                                    ? 'rgba(255, 255, 255, 0.3)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className='bi bi-x-circle me-1'></i>
                                            Inactivos ({clientes.filter(c => !c.estado).length})
                                        </button>
                                    </div>
                                </div>
                                </div>
                            </div>

                            <div 
                                className='card-body p-0'
                                style={{ 
                                    maxHeight: '70vh', 
                                    overflowY: 'auto',
                                    padding: '0 !important',
                                    minHeight: '400px'
                                }}
                            >
                                {clientesPaginados.length === 0 ? (
                                    <div 
                                        className='text-center py-5 text-muted'
                                        style={{
                                            background: 'rgba(111, 66, 193, 0.05)',
                                            margin: '20px',
                                            borderRadius: '12px',
                                            border: '1px dashed rgba(111, 66, 193, 0.3)'
                                        }}
                                    >
                                        <i className='bi bi-people display-6 mb-2' style={{ color: '#6f42c1' }}></i>
                                        {searchTerm ? (
                                            <div>
                                                <p className='mb-1'>No se encontraron clientes</p>
                                                <p className='mb-0 small'>
                                                    Intenta con otro término de búsqueda
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className='mb-0'>
                                                    {filtroEstado === 'activos' && 'No hay clientes activos'}
                                                    {filtroEstado === 'inactivos' && 'No hay clientes inactivos'}
                                                    {filtroEstado === 'todos' && 'No hay clientes registrados'}
                                                </p>
                                                <p className='mt-2 small'>
                                                    Haz clic en "Registrar Cliente" para comenzar
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className='list-group list-group-flush'>
                                        {clientesPaginados.map((cliente) => (
                                            <div 
                                                key={cliente.id} 
                                                className='list-group-item border-0 p-3'
                                                style={{
                                                    borderBottom: '1px solid rgba(111, 66, 193, 0.1) !important',
                                                    background: 'transparent',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div className='d-flex justify-content-between align-items-center'>
                                                    <div className='flex-grow-1'>
                                                        <div className='d-flex align-items-center mb-1'>
                                                            {/* Avatar con iniciales */}
                                                            <div 
                                                                className='me-3 d-flex align-items-center justify-content-center'
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    background: cliente.estado 
                                                                        ? 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)'
                                                                        : 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                                                                    borderRadius: '10px',
                                                                    color: 'white',
                                                                    fontSize: '1rem',
                                                                    fontWeight: '600',
                                                                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)'
                                                                }}
                                                            >
                                                                {cliente.nombre.charAt(0).toUpperCase()}
                                                            </div>
                                                            
                                                            <div className='flex-grow-1'>
                                                                <div className='d-flex align-items-center mb-1'>
                                                                    <h6 className='mb-0 fw-bold me-2' style={{ 
                                                                        color: '#2d3748',
                                                                        fontSize: '1rem' 
                                                                    }}>
                                                                        {cliente.nombre}
                                                                    </h6>
                                                                    <span 
                                                                        className='badge d-flex align-items-center'
                                                                        style={{
                                                                            background: cliente.estado 
                                                                                ? 'linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(32, 201, 151, 0.2) 100%)'
                                                                                : 'linear-gradient(135deg, rgba(220, 53, 69, 0.2) 0%, rgba(200, 35, 51, 0.2) 100%)',
                                                                            color: cliente.estado ? '#155724' : '#721c24',
                                                                            fontSize: '0.75rem',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '8px',
                                                                            border: `1px solid ${cliente.estado ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`
                                                                        }}
                                                                    >
                                                                        <i className={`bi ${cliente.estado ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                                                        {cliente.estado ? 'Activo' : 'Inactivo'}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className='d-flex flex-wrap gap-3 text-muted' style={{ fontSize: '0.9rem' }}>
                                                                    <div className='d-flex align-items-center'>
                                                                        <i className='bi bi-card-text me-1' style={{ color: '#6f42c1' }}></i>
                                                                        <span style={{ fontWeight: '500' }}>Doc:</span>
                                                                        <span className='ms-1'>{cliente.documento}</span>
                                                                    </div>
                                                                    {cliente.telefono && (
                                                                        <div className='d-flex align-items-center'>
                                                                            <i className='bi bi-telephone me-1' style={{ color: '#17a2b8' }}></i>
                                                                            <span style={{ fontWeight: '500' }}>Tel:</span>
                                                                            <span className='ms-1'>{cliente.telefono}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className='d-flex align-items-center gap-2'>
                                                        <button
                                                            className='btn btn-sm d-flex align-items-center'
                                                            onClick={() => {
                                                                iniciarEdicion(cliente);
                                                                setShowModal(true);
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                color: 'white',
                                                                fontSize: '0.8rem',
                                                                padding: '8px 12px',
                                                                fontWeight: '500',
                                                                boxShadow: '0 3px 12px rgba(255, 193, 7, 0.3)',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-2px)';
                                                                e.target.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.4)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0px)';
                                                                e.target.style.boxShadow = '0 3px 12px rgba(255, 193, 7, 0.3)';
                                                            }}
                                                        >
                                                            <i className='bi bi-pencil me-1'></i>
                                                            <span className='d-none d-sm-inline'>Editar</span>
                                                        </button>
                                                        
                                                        {cliente.estado ? (
                                                            <button
                                                                className='btn btn-sm d-flex align-items-center'
                                                                onClick={() => eliminarCliente(cliente.id, cliente.nombre)}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    color: 'white',
                                                                    fontSize: '0.8rem',
                                                                    padding: '8px 12px',
                                                                    fontWeight: '500',
                                                                    boxShadow: '0 3px 12px rgba(220, 53, 69, 0.3)',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.transform = 'translateY(-2px)';
                                                                    e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.transform = 'translateY(0px)';
                                                                    e.target.style.boxShadow = '0 3px 12px rgba(220, 53, 69, 0.3)';
                                                                }}
                                                            >
                                                                <i className='bi bi-trash me-1'></i>
                                                                <span className='d-none d-sm-inline'>Eliminar</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className='btn btn-sm d-flex align-items-center'
                                                                onClick={() => reactivarCliente(cliente.id, cliente.nombre)}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    color: 'white',
                                                                    fontSize: '0.8rem',
                                                                    padding: '8px 12px',
                                                                    fontWeight: '500',
                                                                    boxShadow: '0 3px 12px rgba(40, 167, 69, 0.3)',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.transform = 'translateY(-2px)';
                                                                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.transform = 'translateY(0px)';
                                                                    e.target.style.boxShadow = '0 3px 12px rgba(40, 167, 69, 0.3)';
                                                                }}
                                                            >
                                                                <i className='bi bi-arrow-clockwise me-1'></i>
                                                                <span className='d-none d-sm-inline'>Reactivar</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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

                                        {/* Controles de paginación en móvil - compactos */}
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
                                                    title="Primera página"
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
                                                    title="Página anterior"
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
                                                    title="Página siguiente"
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
                                                    title="Última página"
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
                                                    title="Primera página"
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
                                                    title="Página anterior"
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
                                                    title="Página siguiente"
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
                                                    title="Última página"
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
                                    background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                    color: 'white'
                                }}
                            >
                                <h5 className='mb-0 fw-semibold d-flex align-items-center'>
                                    <i className='bi bi-person-plus me-2'></i>
                                    {editingClient ? 'Editando Cliente' : 'Nuevo Cliente'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowModal(false);
                                        cancelarEdicion();
                                    }}
                                    style={{
                                        fontSize: '1.2rem',
                                        filter: 'brightness(0) invert(1)'
                                    }}
                                ></button>
                            </div>
                            
                            <div className='card-body p-4'>
                                <form onSubmit={editingClient ? handleEditSubmit : handleSubmit}>
                                    <div className='row'>
                                        <div className='col-md-6 mb-3'>
                                            <label 
                                                className='form-label fw-semibold'
                                                style={{ color: '#495057' }}
                                            >
                                                <i className='bi bi-person me-2' style={{ color: '#6f42c1' }}></i>
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
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #e9ecef',
                                                    padding: '12px 16px',
                                                    fontSize: '0.95rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#6f42c1';
                                                    e.target.style.boxShadow = '0 0 0 0.2rem rgba(111, 66, 193, 0.25)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e9ecef';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                        
                                        <div className='col-md-6 mb-3'>
                                            <label 
                                                className='form-label fw-semibold'
                                                style={{ color: '#495057' }}
                                            >
                                                <i className='bi bi-card-text me-2' style={{ color: '#6f42c1' }}></i>
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
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #e9ecef',
                                                    padding: '12px 16px',
                                                    fontSize: '0.95rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#6f42c1';
                                                    e.target.style.boxShadow = '0 0 0 0.2rem rgba(111, 66, 193, 0.25)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e9ecef';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className='mb-4'>
                                        <label 
                                            className='form-label fw-semibold'
                                            style={{ color: '#495057' }}
                                        >
                                            <i className='bi bi-telephone me-2' style={{ color: '#6f42c1' }}></i>
                                            Teléfono (9 dígitos)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            placeholder="Ej: 987654321"
                                            maxLength="9"
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e9ecef',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#6f42c1';
                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(111, 66, 193, 0.25)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e9ecef';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                        <div className="form-text text-muted">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Ingrese solo números, máximo 9 dígitos
                                        </div>
                                    </div>

                                    <div className='d-flex gap-3 justify-content-end'>
                                        <button 
                                            type="button" 
                                            className="btn"
                                            onClick={() => {
                                                setShowModal(false);
                                                cancelarEdicion();
                                            }}
                                            style={{
                                                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                                padding: '12px 20px',
                                                fontSize: '1rem',
                                                fontWeight: '500',
                                                boxShadow: '0 4px 16px rgba(108, 117, 125, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 8px 24px rgba(108, 117, 125, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0px)';
                                                e.target.style.boxShadow = '0 4px 16px rgba(108, 117, 125, 0.3)';
                                            }}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Cancelar
                                        </button>

                                        <button 
                                            type="submit" 
                                            className="btn"
                                            disabled={loading}
                                            style={{
                                                background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                                padding: '12px 20px',
                                                fontSize: '1rem',
                                                fontWeight: '500',
                                                boxShadow: '0 4px 16px rgba(111, 66, 193, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 8px 24px rgba(111, 66, 193, 0.4)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = 'translateY(0px)';
                                                    e.target.style.boxShadow = '0 4px 16px rgba(111, 66, 193, 0.3)';
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    {editingClient ? 'Actualizando...' : 'Creando...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`bi ${editingClient ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                                                    {editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmación Moderno */}
                {showConfirmModal && (
                    <div 
                        className='position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            zIndex: 1060,
                            backdropFilter: 'blur(6px)'
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                cancelConfirmAction();
                            }
                        }}
                    >
                        <div 
                            className='card border-0 shadow-lg'
                            style={{
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                width: '90%',
                                maxWidth: '480px',
                                animation: 'modalSlideIn 0.3s ease-out',
                                overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del modal con colores según la acción */}
                            <div 
                                className='card-header border-0 p-4 text-center'
                                style={{
                                    background: confirmAction === 'delete' 
                                        ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                        : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    color: 'white'
                                }}
                            >
                                <div className='mb-3'>
                                    <div 
                                        className='mx-auto d-flex align-items-center justify-content-center'
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            borderRadius: '50%',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <i 
                                            className={`bi ${confirmAction === 'delete' ? 'bi-trash' : 'bi-arrow-clockwise'}`}
                                            style={{ fontSize: '1.8rem' }}
                                        ></i>
                                    </div>
                                </div>
                                <h5 className='mb-1 fw-bold'>
                                    {confirmAction === 'delete' ? 'Eliminar Cliente' : 'Reactivar Cliente'}
                                </h5>
                                <p className='mb-0 opacity-90'>
                                    {confirmAction === 'delete' 
                                        ? 'Esta acción cambiará el estado del cliente a inactivo'
                                        : 'Esta acción cambiará el estado del cliente a activo'
                                    }
                                </p>
                            </div>
                            
                            {/* Cuerpo del modal */}
                            <div className='card-body p-4 text-center'>
                                <div className='mb-4'>
                                    <h6 className='mb-3' style={{ color: '#2d3748', fontWeight: '600' }}>
                                        {confirmAction === 'delete' 
                                            ? '¿Estás seguro de que deseas eliminar este cliente?' 
                                            : '¿Estás seguro de que deseas reactivar este cliente?'
                                        }
                                    </h6>
                                    
                                    {confirmData && (
                                        <div 
                                            className='p-3 rounded-3 d-flex align-items-center'
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(111, 66, 193, 0.1) 0%, rgba(23, 162, 184, 0.05) 100%)',
                                                border: '1px solid rgba(111, 66, 193, 0.2)'
                                            }}
                                        >
                                            <div 
                                                className='me-3 d-flex align-items-center justify-content-center'
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                                                    borderRadius: '10px',
                                                    color: 'white',
                                                    fontSize: '1rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {confirmData.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className='text-start'>
                                                <div className='fw-bold mb-1' style={{ color: '#2d3748' }}>
                                                    {confirmData.nombre}
                                                </div>
                                                <div className='text-muted small'>
                                                    Documento: {confirmData.id}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='d-flex gap-3 justify-content-center'>
                                    <button 
                                        type="button" 
                                        className="btn d-flex align-items-center gap-2"
                                        onClick={cancelConfirmAction}
                                        style={{
                                            background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: 'white',
                                            padding: '10px 20px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <i className="bi bi-x-circle"></i>
                                        Cancelar
                                    </button>

                                    <button 
                                        type="button" 
                                        className="btn d-flex align-items-center gap-2"
                                        onClick={executeConfirmAction}
                                        disabled={loading}
                                        style={{
                                            background: confirmAction === 'delete' 
                                                ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: 'white',
                                            padding: '10px 20px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            boxShadow: confirmAction === 'delete' 
                                                ? '0 4px 12px rgba(220, 53, 69, 0.3)'
                                                : '0 4px 12px rgba(40, 167, 69, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm"></span>
                                                {confirmAction === 'delete' ? 'Eliminando...' : 'Reactivando...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className={`bi ${confirmAction === 'delete' ? 'bi-trash' : 'bi-arrow-clockwise'}`}></i>
                                                {confirmAction === 'delete' ? 'Sí, Eliminar' : 'Sí, Reactivar'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}