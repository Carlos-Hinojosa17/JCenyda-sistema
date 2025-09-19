import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Lateral() {
    const { user, logout, getAllowedPages } = useAuth();
    const allowedPages = getAllowedPages();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedSubmenu, setExpandedSubmenu] = useState(null);

    const handleLogout = () => {
        logout();
        // Redirigir al login se manejará automáticamente por el contexto
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    const menuItems = [
        { 
            key: 'principal', 
            path: '/layouts/principal', 
            icon: 'bi-house-fill', 
            label: 'Dashboard',
            color: '#F09836'
        },
        { 
            key: 'ventas',
            icon: 'bi-cart-check-fill', 
            label: 'Ventas',
            color: '#28a745',
            isSubmenu: true,
            submenuItems: [
                { 
                    key: 'ventas', 
                    path: '/layouts/venta', 
                    icon: 'bi-cart-fill', 
                    label: 'Nueva Venta',
                    color: '#28a745'
                },
                { 
                    key: 'cotizaciones', 
                    path: '/layouts/cotizaciones', 
                    icon: 'bi-file-text-fill', 
                    label: 'Cotizaciones',
                    color: '#20c997'
                }
            ]
        },
        { 
            key: 'inventario',
            icon: 'bi-boxes', 
            label: 'Inventario',
            color: '#17a2b8',
            isSubmenu: true,
            submenuItems: [
                { 
                    key: 'productos', 
                    path: '/layouts/producto', 
                    icon: 'bi-box-fill', 
                    label: 'Productos',
                    color: '#17a2b8'
                },
                { 
                    key: 'almacen', 
                    path: '/layouts/almacen', 
                    icon: 'bi-building-fill', 
                    label: 'Almacén',
                    color: '#fd7e14'
                }
            ]
        },
        { 
            key: 'registros',
            icon: 'bi-folder-fill', 
            label: 'Registros',
            color: '#6f42c1',
            isSubmenu: true,
            submenuItems: [
                { 
                    key: 'clientes', 
                    path: '/layouts/cliente', 
                    icon: 'bi-people-fill', 
                    label: 'Clientes',
                    color: '#6f42c1'
                },
                { 
                    key: 'usuarios', 
                    path: '/layouts/usuarios', 
                    icon: 'bi-person-plus-fill', 
                    label: 'Usuarios',
                    color: '#6c757d'
                }
            ]
        },
        { 
            key: 'reportes', 
            path: '/layouts/reportes', 
            icon: 'bi-bar-chart-line-fill', 
            label: 'Reportes',
            color: '#e83e8c'
        }
    ];

    return (
        <div className='d-flex' style={{ 
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            minHeight: '100vh',
            height: '100%'
        }}>
            {/* Sidebar */}
            <div 
                className='d-flex flex-column position-relative'
                style={{
                    width: isCollapsed ? '100px' : '280px',
                    background: 'linear-gradient(180deg, #2C3E50 0%, #34495E 100%)',
                    transition: 'all 0.3s ease',
                    boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.1)',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    zIndex: 1000,
                    minHeight: '100vh',
                    height: 'auto'
                }}
            >
                {/* Header */}
                <div className='p-4 text-center border-bottom border-secondary'>
                    <div className='d-flex align-items-center justify-content-between'>
                        {!isCollapsed ? (
                            <div className='text-white'>
                                <h4 
                                    className='mb-1 fw-bold'
                                    style={{
                                        background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        fontSize: '1.2rem'
                                    }}
                                >
                                    JC ENYDA
                                </h4>
                                <p className='mb-0 small text-light opacity-75'>AUTOPARTS</p>
                            </div>
                        ) : (
                            <div className='text-white'>
                                <h4 
                                    className='mb-0 fw-bold'
                                    style={{
                                        background: 'linear-gradient(135deg, #F09836 0%, #D67E1A 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        fontSize: '1.5rem',
                                        letterSpacing: '2px'
                                    }}
                                >
                                    JC
                                </h4>
                            </div>
                        )}
                        <button
                            className='btn btn-sm btn-outline-light border-0'
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            style={{
                                borderRadius: '8px',
                                padding: '8px 10px'
                            }}
                        >
                            <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
                        </button>
                    </div>
                </div>

                {/* User Info */}
                {user && !isCollapsed && (
                    <div className='p-3 text-center border-bottom border-secondary'>
                       
                        <h6 className='text-white mb-1'>{user.nombre}</h6>
                        <span 
                            className='badge px-3 py-1'
                            style={{
                                background: user.rol === 'administrador' || user.rol === 'admin' 
                                    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                                    : 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                                fontSize: '0.75rem',
                                borderRadius: '20px'
                            }}
                        >
                            {user.rol === 'administrador' || user.rol === 'admin' ? 'Administrador' : 'Vendedor'}
                        </span>
                    </div>
                )}

                {/* Navigation */}
                <nav className='flex-grow-1 p-3'>
                    <div className='nav flex-column gap-1'>
                        {menuItems.map(item => {
                            if (item.isSubmenu) {
                                // Verificar si algún subitem tiene permisos
                                const hasPermissions = item.submenuItems?.some(subItem => allowedPages[subItem.key]);
                                if (!hasPermissions) return null;

                                const isSubmenuActive = item.submenuItems?.some(subItem => isActiveRoute(subItem.path));
                                const isExpanded = expandedSubmenu === item.key;

                                return (
                                    <div key={item.key}>
                                        {/* Elemento principal del submenu */}
                                        <div
                                            className='nav-link text-decoration-none d-flex align-items-center justify-content-between'
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                color: isSubmenuActive ? '#F09836' : '#ffffff',
                                                background: isSubmenuActive || isExpanded
                                                    ? 'rgba(240, 152, 54, 0.1)' 
                                                    : 'transparent',
                                                border: isSubmenuActive || isExpanded
                                                    ? '1px solid rgba(240, 152, 54, 0.3)' 
                                                    : '1px solid transparent',
                                                transition: 'all 0.3s ease',
                                                fontSize: '0.95rem',
                                                fontWeight: isSubmenuActive ? '600' : '400',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={() => setExpandedSubmenu(item.key)}
                                            onMouseLeave={() => setExpandedSubmenu(null)}
                                        >
                                            <div className='d-flex align-items-center'>
                                                <i 
                                                    className={`bi ${item.icon} me-3`}
                                                    style={{
                                                        color: isSubmenuActive ? '#F09836' : item.color,
                                                        fontSize: '1.1rem',
                                                        width: '24px',
                                                        textAlign: 'center',
                                                        display: 'inline-block',
                                                        minWidth: '24px'
                                                    }}
                                                ></i>
                                                {!isCollapsed && (
                                                    <span>{item.label}</span>
                                                )}
                                            </div>
                                            {!isCollapsed && (
                                                <i 
                                                    className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}
                                                    style={{
                                                        transition: 'transform 0.3s ease',
                                                        fontSize: '0.8rem'
                                                    }}
                                                ></i>
                                            )}
                                        </div>

                                        {/* Subitems del submenu */}
                                        <div
                                            style={{
                                                maxHeight: isExpanded ? '200px' : '0',
                                                overflow: 'hidden',
                                                transition: 'max-height 0.3s ease',
                                                paddingLeft: isCollapsed ? '0' : '20px'
                                            }}
                                            onMouseEnter={() => setExpandedSubmenu(item.key)}
                                            onMouseLeave={() => setExpandedSubmenu(null)}
                                        >
                                            {item.submenuItems?.map(subItem => (
                                                allowedPages[subItem.key] && (
                                                    <Link
                                                        key={subItem.key}
                                                        to={subItem.path}
                                                        className='nav-link text-decoration-none d-flex align-items-center'
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            color: isActiveRoute(subItem.path) ? '#F09836' : '#ffffff',
                                                            background: isActiveRoute(subItem.path) 
                                                                ? 'rgba(240, 152, 54, 0.15)' 
                                                                : 'transparent',
                                                            border: isActiveRoute(subItem.path) 
                                                                ? '1px solid rgba(240, 152, 54, 0.3)' 
                                                                : '1px solid transparent',
                                                            transition: 'all 0.3s ease',
                                                            fontSize: '0.9rem',
                                                            fontWeight: isActiveRoute(subItem.path) ? '600' : '400',
                                                            marginTop: '4px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isActiveRoute(subItem.path)) {
                                                                e.target.style.background = 'rgba(255,255,255,0.05)';
                                                                e.target.style.transform = 'translateX(5px)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isActiveRoute(subItem.path)) {
                                                                e.target.style.background = 'transparent';
                                                                e.target.style.transform = 'translateX(0px)';
                                                            }
                                                        }}
                                                    >
                                                        <i 
                                                            className={`bi ${subItem.icon} me-3`}
                                                            style={{
                                                                color: isActiveRoute(subItem.path) ? '#F09836' : subItem.color,
                                                                fontSize: '1rem',
                                                                width: '20px',
                                                                textAlign: 'center',
                                                                display: 'inline-block',
                                                                minWidth: '20px'
                                                            }}
                                                        ></i>
                                                        {!isCollapsed && (
                                                            <span>{subItem.label}</span>
                                                        )}
                                                    </Link>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                );
                            } else {
                                // Elemento normal del menú
                                return allowedPages[item.key] && (
                                    <Link
                                        key={item.key}
                                        to={item.path}
                                        className='nav-link text-decoration-none d-flex align-items-center'
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            color: isActiveRoute(item.path) ? '#F09836' : '#ffffff',
                                            background: isActiveRoute(item.path) 
                                                ? 'rgba(240, 152, 54, 0.1)' 
                                                : 'transparent',
                                            border: isActiveRoute(item.path) 
                                                ? '1px solid rgba(240, 152, 54, 0.3)' 
                                                : '1px solid transparent',
                                            transition: 'all 0.3s ease',
                                            fontSize: '0.95rem',
                                            fontWeight: isActiveRoute(item.path) ? '600' : '400'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActiveRoute(item.path)) {
                                                e.target.style.background = 'rgba(255,255,255,0.1)';
                                                e.target.style.transform = 'translateX(5px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActiveRoute(item.path)) {
                                                e.target.style.background = 'transparent';
                                                e.target.style.transform = 'translateX(0px)';
                                            }
                                        }}
                                    >
                                        <i 
                                            className={`bi ${item.icon} me-3`}
                                            style={{
                                                color: isActiveRoute(item.path) ? '#F09836' : item.color,
                                                fontSize: '1.1rem',
                                                width: '24px',
                                                textAlign: 'center',
                                                display: 'inline-block',
                                                minWidth: '24px'
                                            }}
                                        ></i>
                                        {!isCollapsed && (
                                            <span>{item.label}</span>
                                        )}
                                    </Link>
                                );
                            }
                        })}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className='p-3 border-top border-secondary'>
                    <button 
                        onClick={handleLogout} 
                        className={`btn w-100 d-flex align-items-center justify-content-center gap-2`}
                        style={{
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            padding: '12px',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0px)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <i className='bi bi-box-arrow-right'></i>
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div 
                className='flex-grow-1 d-flex flex-column'
                style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    minHeight: '100vh',
                    height: 'auto',
                    width: '100%'
                }}
            >
                <div className='flex-grow-1 w-100' style={{ minHeight: '100vh' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
