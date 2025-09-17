// Configuración del entorno
export const config = {
  // URL base del backend - CONFIGURADO PARA TU BACKEND
  API_BASE_URL: 'http://localhost:5000/api',
  
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
