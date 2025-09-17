import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Verificar si hay un usuario logueado al cargar la aplicación
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error al parsear datos del usuario:', error);
                // Limpiar datos corruptos
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        console.log('🔐 AuthContext.login llamado con:', { userData, token });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Estado actualizado en AuthContext');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    // Verificar si el usuario tiene un rol específico
    const hasRole = (role) => {
        const userRole = user?.rol || user?.tipo;
        return userRole === role;
    };

    // Verificar si el usuario es admin
    const isAdmin = () => {
        const userRole = user?.rol || user?.tipo;
        return userRole === 'administrador' || userRole === 'admin';
    };

    // Verificar si el usuario es vendedor
    const isVendedor = () => {
        const userRole = user?.rol || user?.tipo;
        return userRole === 'vendedor';
    };

    // Obtener páginas permitidas según el rol
    const getAllowedPages = () => {
        if (isAdmin()) {
            return {
                principal: true,
                ventas: true,
                productos: true,
                clientes: true,
                almacen: true,
                cotizaciones: true,
                usuarios: true
            };
        } else if (isVendedor()) {
            return {
                principal: false,
                ventas: false,
                productos: true,
                clientes: false,
                almacen: true,
                cotizaciones: true,
                usuarios: false
            };
        }
        return {};
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        hasRole,
        isAdmin,
        isVendedor,
        getAllowedPages
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};