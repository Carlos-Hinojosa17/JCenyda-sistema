import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const [credentials, setCredentials] = useState({ usuario: '', contrasena: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldState, setFieldState] = useState({
        usuario: 'normal', // normal, error
        contrasena: 'normal' // normal, error
    });
    const navigate = useNavigate();
    const { login: authLogin, isAuthenticated } = useAuth();

    useEffect(() => {
        console.log('🔍 Verificando autenticación. isAuthenticated:', isAuthenticated);
        if (isAuthenticated) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    const userRole = userData?.rol || userData?.tipo;
                    console.log('✅ Usuario ya autenticado con rol:', userRole);
                    
                    if (userRole === 'administrador' || userRole === 'admin') {
                        console.log('🚀 Redirigiendo admin ya autenticado a /layouts/principal');
                        navigate('/layouts/principal');
                    } else if (userRole === 'vendedor') {
                        console.log('🚀 Redirigiendo vendedor ya autenticado a /layouts/producto');
                        navigate('/layouts/producto');
                    } else {
                        console.log('🚀 Redirigiendo a productos por defecto');
                        navigate('/layouts/producto');
                    }
                } catch (error) {
                    console.error('Error al parsear usuario:', error);
                    navigate('/layouts/producto');
                }
            }
        }
    }, [isAuthenticated, navigate]);

    // Nota: la lógica para listar clientes fue removida temporalmente para evitar
    // errores en desarrollo (se usará una prueba de conexión independiente).

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldState({ usuario: 'normal', contrasena: 'normal' });

        try {
            console.log('🔄 Iniciando proceso de login...');
            const response = await authService.login(credentials);
            console.log('📤 Respuesta del login:', response);
            
            if (response.user && response.token) {
                console.log('✅ Datos válidos, guardando en contexto...');
                console.log('👤 Usuario:', response.user);
                console.log('🔑 Token:', response.token);
                
                authLogin(response.user, response.token);
                
                // Redirigir según el rol del usuario
                const userRole = response.user.rol || response.user.tipo;
                console.log('📋 Rol del usuario:', userRole);
                
                if (userRole === 'administrador' || userRole === 'admin') {
                    console.log('🚀 Redirigiendo admin a /layouts/principal');
                    navigate('/layouts/principal');
                } else if (userRole === 'vendedor') {
                    console.log('🚀 Redirigiendo vendedor a /layouts/producto');
                    navigate('/layouts/producto');
                } else {
                    console.log('⚠️ Rol no reconocido, redirigiendo a productos por defecto');
                    navigate('/layouts/producto');
                }
                
                // Verificar si la navegación funcionó
                setTimeout(() => {
                    console.log('📍 URL actual después de navigate:', window.location.pathname);
                }, 100);
            } else {
                throw new Error('Respuesta invalida del servidor');
            }
        } catch (error) {
            console.error('❌ Error en handleSubmit:', error);
            const errorMessage = error.message || 'Error al iniciar sesion';
            
            // Manejar errores específicos
            if (errorMessage.toLowerCase().includes('desactivad') || 
                errorMessage.toLowerCase().includes('inactiv') ||
                errorMessage.toLowerCase().includes('deshabilitad') ||
                errorMessage.toLowerCase().includes('bloquead') ||
                errorMessage.toLowerCase().includes('contacta al administrador')) {
                
                // Usuario desactivado - mostrar mensaje específico sin marcar campos como error
                setError('🔒 Tu cuenta ha sido desactivada. Contacta al administrador para reactivarla.');
                setFieldState({ usuario: 'normal', contrasena: 'normal' });
                
            } else if (errorMessage.toLowerCase().includes('usuario') || 
                errorMessage.toLowerCase().includes('user') ||
                errorMessage.toLowerCase().includes('no encontrado') ||
                errorMessage.toLowerCase().includes('not found')) {
                
                // Usuario incorrecto - limpiar contraseña y marcar usuario como error
                setCredentials(prev => ({ ...prev, contrasena: '' }));
                setFieldState({ usuario: 'error', contrasena: 'normal' });
                setError('Usuario no encontrado');
                
            } else if (errorMessage.toLowerCase().includes('contraseña') || 
                       errorMessage.toLowerCase().includes('password') ||
                       errorMessage.toLowerCase().includes('credencial')) {
                
                // Contraseña incorrecta - marcar solo contraseña como error
                setFieldState({ usuario: 'normal', contrasena: 'error' });
                setError('Contraseña incorrecta');
                
            } else {
                // Error general
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
                background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                overflow: 'hidden'
            }}
        >
            {/* Overlay pattern */}
            <div 
                className="position-absolute w-100 h-100"
                style={{
                    background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23F09836" fill-opacity="0.08"%3E%3Ccircle cx="40" cy="40" r="6"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    zIndex: 1
                }}
            />
            
            <div className="position-relative" style={{ zIndex: 2 }}>
                <div 
                    className="card shadow-lg border-0" 
                    style={{
                        width: '420px',
                        borderRadius: '16px',
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255, 255, 255, 0.95)'
                    }}
                >
                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <h2 
                            className="fw-bold mb-2"
                            style={{
                                fontSize: '4.2rem',
                                background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                letterSpacing: '-0.5px'
                            }}
                        >
                            JC ENYDA
                        </h2>
                        <p className="fw-semibold mb-1" style={{ 
                            fontSize: '1.1rem', 
                            color: '#2C3E50',
                            letterSpacing: '0.5px' 
                        }}>
                            AUTOPARTS
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                            Sistema de Gestión de Ventas
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div 
                                className="alert d-flex align-items-center" 
                                role="alert"
                                style={{
                                    background: error.includes('desactivada') || error.includes('❌') 
                                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' 
                                        : '#f8d7da',
                                    border: error.includes('desactivada') || error.includes('❌') 
                                        ? '1px solid #ff6b6b' 
                                        : '1px solid #f5c6cb',
                                    borderRadius: '12px',
                                    color: error.includes('desactivada') || error.includes('❌') 
                                        ? 'white' 
                                        : '#721c24',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    boxShadow: error.includes('desactivada') || error.includes('❌') 
                                        ? '0 4px 15px rgba(255, 107, 107, 0.3)' 
                                        : 'none'
                                }}
                            >
                                {error.includes('desactivada') || error.includes('❌') && (
                                    <i className="bi bi-shield-exclamation me-2" style={{ fontSize: '1.2rem' }}></i>
                                )}
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="fw-semibold" style={{ 
                                fontSize: '0.95rem',
                                color: fieldState.usuario === 'error' ? '#dc3545' : '#2C3E50' 
                            }}>
                                Usuario
                            </label>
                            <input
                                type="text"
                                className="form-control py-3"
                                style={{
                                    borderRadius: '12px',
                                    border: `2px solid ${fieldState.usuario === 'error' ? '#dc3545' : '#e9ecef'}`,
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: fieldState.usuario === 'error' ? '#fff5f5' : 'white'
                                }}
                                value={credentials.usuario}
                                onChange={(e) => {
                                    setCredentials({...credentials, usuario: e.target.value});
                                    // Limpiar error cuando el usuario empiece a escribir
                                    if (fieldState.usuario === 'error') {
                                        setFieldState(prev => ({ ...prev, usuario: 'normal' }));
                                    }
                                }}
                                required
                                disabled={loading}
                                onFocus={(e) => {
                                    if (fieldState.usuario !== 'error') {
                                        e.target.style.borderColor = '#F09836';
                                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(240, 152, 54, 0.25)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (fieldState.usuario !== 'error') {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="fw-semibold" style={{ 
                                fontSize: '0.95rem',
                                color: fieldState.contrasena === 'error' ? '#dc3545' : '#2C3E50' 
                            }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                className="form-control py-3"
                                style={{
                                    borderRadius: '12px',
                                    border: `2px solid ${fieldState.contrasena === 'error' ? '#dc3545' : '#e9ecef'}`,
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: fieldState.contrasena === 'error' ? '#fff5f5' : 'white'
                                }}
                                value={credentials.contrasena}
                                onChange={(e) => {
                                    setCredentials({...credentials, contrasena: e.target.value});
                                    // Limpiar error cuando el usuario empiece a escribir
                                    if (fieldState.contrasena === 'error') {
                                        setFieldState(prev => ({ ...prev, contrasena: 'normal' }));
                                    }
                                }}
                                required
                                disabled={loading}
                                onFocus={(e) => {
                                    if (fieldState.contrasena !== 'error') {
                                        e.target.style.borderColor = '#F09836';
                                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(240, 152, 54, 0.25)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (fieldState.contrasena !== 'error') {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn w-100 py-3 fw-semibold"
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1.1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(240, 152, 54, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(240, 152, 54, 0.6)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(0px)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(240, 152, 54, 0.4)';
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    );
}
