import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiServices';
import { checkBackendConnection } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const [credentials, setCredentials] = useState({ usuario: '', contrasena: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [showConnectionAlert, setShowConnectionAlert] = useState(false);
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

    useEffect(() => {
        const verifyConnection = async () => {
            const status = await checkBackendConnection();
            setConnectionStatus(status);
            setShowConnectionAlert(true);
            setTimeout(() => {
                setShowConnectionAlert(false);
            }, 5000);
        };
        verifyConnection();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
                console.log('� Rol del usuario:', userRole);
                
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
            setError(error.message || 'Error al iniciar sesion');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        const status = await checkBackendConnection();
        setConnectionStatus(status);
        setShowConnectionAlert(true);
        setLoading(false);
        setTimeout(() => {
            setShowConnectionAlert(false);
        }, 5000);
    };

    return (
        <div className="container vh-100 d-flex justify-content-center align-items-center">
            {showConnectionAlert && connectionStatus && (
                <div
                    className={
                        "alert alert-" +
                        (connectionStatus.connected ? "success" : "danger") +
                        " position-fixed"
                    }
                    style={{ top: "20px", right: "20px", zIndex: 1050, minWidth: "300px" }}
                >
                    <div className="d-flex align-items-center">
                        <div>
                            <strong>{connectionStatus.connected ? "Backend Conectado" : "Error de Conexion"}</strong>
                            <br />
                            <small>{connectionStatus.message}</small>
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{width: '400px'}}>
                <div className="card-body">
                    <h3 className="card-title text-center mb-4">Sistema JC - Login</h3>
                    
                    <div className="alert alert-info mb-3">
                        <h6 className="mb-2">👥 Usuarios Disponibles:</h6>
                        <div className="small">
                            <strong>Administradores:</strong><br/>
                            • admin / admin123<br/>
                            • CarlosH (consulta tu contraseña)<br/>
                            <br/>
                            <strong>Vendedor:</strong><br/>
                            • vendedor / vendedor123<br/>
                            <br/>
                            <em>✅ Conectado a base de datos Supabase</em>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="form-label">Usuario</label>
                            <input
                                type="text"
                                className="form-control"
                                value={credentials.usuario}
                                onChange={(e) => setCredentials({...credentials, usuario: e.target.value})}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Contrasena</label>
                            <input
                                type="password"
                                className="form-control"
                                value={credentials.contrasena}
                                onChange={(e) => setCredentials({...credentials, contrasena: e.target.value})}
                                required
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
                        </button>
                        
                        <div className="mt-3">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary w-100"
                                onClick={testConnection}
                                disabled={loading}
                            >
                                Probar Conexion Backend
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
