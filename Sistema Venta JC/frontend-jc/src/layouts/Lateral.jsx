import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Lateral() {
    const { user, logout, getAllowedPages } = useAuth();
    const allowedPages = getAllowedPages();

    const handleLogout = () => {
        logout();
        // Redirigir al login se manejará automáticamente por el contexto
    };

    return (
        <div className='d-flex vh-100'>
            <div className='bg-dark text-white p-3' style={{width: '250px'}}>
                <div className='text-center mb-4'>
                    <h4>Sistema JC</h4>
                    {user && (
                        <div className='small'>
                            <p className='mb-1'>Bienvenido, {user.nombre}</p>
                            <span className={`badge ${user.rol === 'administrador' || user.rol === 'admin' ? 'bg-success' : 'bg-primary'}`}>
                                {user.rol === 'administrador' || user.rol === 'admin' ? 'Administrador' : 'Vendedor'}
                            </span>
                        </div>
                    )}
                </div>
                <nav className='nav flex-column'>
                    {allowedPages.principal && (
                        <Link to='/layouts/principal' className='nav-link text-white'>
                            <i className='bi bi-house me-2'></i>Principal
                        </Link>
                    )}
                    {allowedPages.ventas && (
                        <Link to='/layouts/venta' className='nav-link text-white'>
                            <i className='bi bi-cart me-2'></i>Ventas
                        </Link>
                    )}
                    {allowedPages.productos && (
                        <Link to='/layouts/producto' className='nav-link text-white'>
                            <i className='bi bi-box me-2'></i>Productos
                        </Link>
                    )}
                    {allowedPages.clientes && (
                        <Link to='/layouts/cliente' className='nav-link text-white'>
                            <i className='bi bi-people me-2'></i>Clientes
                        </Link>
                    )}
                    {allowedPages.almacen && (
                        <Link to='/layouts/almacen' className='nav-link text-white'>
                            <i className='bi bi-building me-2'></i>Almacén
                        </Link>
                    )}
                    {allowedPages.cotizaciones && (
                        <Link to='/layouts/cotizaciones' className='nav-link text-white'>
                            <i className='bi bi-file-text me-2'></i>Cotizaciones
                        </Link>
                    )}
                    {allowedPages.usuarios && (
                        <Link to='/layouts/usuarios' className='nav-link text-white'>
                            <i className='bi bi-person-plus me-2'></i>Usuarios
                        </Link>
                    )}
                </nav>
                <div className='mt-auto'>
                    <button onClick={handleLogout} className='btn btn-danger w-100'>
                        <i className='bi bi-box-arrow-right me-2'></i>Salir
                    </button>
                </div>
            </div>
            <div className='flex-grow-1 p-4 bg-light'>
                <Outlet />
            </div>
        </div>
    );
}
