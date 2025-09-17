import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requireRole = null }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Si se requiere un rol específico
    if (requireRole) {
        const userRole = user?.rol;
        
        // Si requireRole es un array, verificar si el usuario tiene alguno de esos roles
        if (Array.isArray(requireRole)) {
            const hasRequiredRole = requireRole.some(role => {
                if (role === 'admin') {
                    return userRole === 'administrador' || userRole === 'admin';
                }
                return userRole === role;
            });
            
            if (!hasRequiredRole) {
                return (
                    <div className="container mt-5">
                        <div className="alert alert-danger text-center">
                            <h4>Acceso Denegado</h4>
                            <p>No tienes permisos para acceder a esta página.</p>
                            <p>Rol requerido: {requireRole.join(' o ')}</p>
                            <p>Tu rol actual: {userRole}</p>
                        </div>
                    </div>
                );
            }
        } else {
            // Si requireRole es un string
            let hasPermission = false;
            
            if (requireRole === 'admin') {
                hasPermission = userRole === 'administrador' || userRole === 'admin';
            } else {
                hasPermission = userRole === requireRole;
            }
            
            if (!hasPermission) {
                return (
                    <div className="container mt-5">
                        <div className="alert alert-danger text-center">
                            <h4>Acceso Denegado</h4>
                            <p>No tienes permisos para acceder a esta página.</p>
                            <p>Rol requerido: {requireRole}</p>
                            <p>Tu rol actual: {userRole}</p>
                        </div>
                    </div>
                );
            }
        }
    }

    return children;
};

export default ProtectedRoute;