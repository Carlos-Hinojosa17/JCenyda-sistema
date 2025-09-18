// Configuración del entorno
const getApiBaseUrl = () => {
  // Si hay una variable de entorno de Vite (Render.com)
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  
  // Si estamos en producción (Render.com)
  if (window.location.hostname.includes('onrender.com')) {
    // En Render, el backend tendrá un dominio similar pero diferente
    const frontendDomain = window.location.hostname;
    const backendDomain = frontendDomain.replace('jc-frontend', 'jc-backend');
    return `https://${backendDomain}/api`;
  }
  
  // Si estamos en desarrollo local (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Si estamos en GitHub Codespaces
  if (window.location.hostname.includes('github.dev')) {
    // Extraer el nombre base del codespace de la URL actual
    const hostname = window.location.hostname;
    const codespaceName = hostname.split('-')[0] + '-' + hostname.split('-')[1]; // Ej: urban-capybara
    const port = '5000';
    return `https://${codespaceName}-g464979wjq4gfxv-${port}.app.github.dev/api`;
  }
  
  // Fallback a una URL específica si es necesario
  return 'https://urban-capybara-g464979wjq4gfxv-5000.app.github.dev/api';
};

export const config = {
  // URL base del backend - SE ADAPTA AUTOMÁTICAMENTE
  API_BASE_URL: getApiBaseUrl(),
  
  // Configuraciones de timeout
  REQUEST_TIMEOUT: 10000, // 10 segundos
  
  // Configuraciones de autenticación
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  
  // Endpoints específicos según tu backend
  ENDPOINTS: {
    // Autenticación
    LOGIN: '/auth/login',
    
    // Productos
    PRODUCTS: '/products',
    
    // Clientes
    CLIENTS: '/clients',
    
    // Ventas
    SALES: '/ventas',
    SALE_DETAILS: '/detalle-venta',
    
    // Usuarios (admin)
    USERS: '/users',
    
    // Almacén (admin)
    WAREHOUSE: '/almacen',
    
    // Reportes (admin)
    REPORTS: '/reportes'
  }
};

// Función para obtener la URL completa de un endpoint
export const getEndpointUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`;
};
