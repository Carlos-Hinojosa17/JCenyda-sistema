import api from './api';

// Servicio de autenticación
export const authService = {
  // Login - conectado a tu backend real
  login: async (credentials) => {
    try {
      console.log('🔐 Intentando login con:', { usuario: credentials.usuario, contrasena: '***' });
      
      const response = await api.post('/auth/login', {
        usuario: credentials.usuario,
        contrasena: credentials.contrasena
      });
      
      console.log('📨 Respuesta del servidor:', response.data);
      
      if (response.data.success && response.data.token) {
        const userData = response.data.usuario;
        
        // Mapear el campo 'tipo' a 'rol' para mantener consistencia en el frontend
        const userWithRole = {
          ...userData,
          rol: userData.tipo || userData.rol
        };
        
        // Limpiar el token (remover "Bearer " si existe)
        const cleanToken = response.data.token.replace('Bearer ', '');
        
        localStorage.setItem('token', cleanToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        console.log('✅ Login exitoso, token guardado');
        
        return {
          token: cleanToken,
          user: userWithRole
        };
      }
      
      throw new Error('Respuesta del servidor inválida');
    } catch (error) {
      console.error('❌ Error en login:', error.response?.data || error.message);
      
      if (error.response) {
        // Error del servidor con respuesta
        const errorMessage = error.response.data?.message || 'Error del servidor';
        throw new Error(errorMessage);
      } else if (error.request) {
        // Error de red
        throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
      } else {
        // Otro tipo de error
        throw new Error(error.message || 'Error inesperado');
      }
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Crear nuevo usuario
  createUser: async (userData) => {
    try {
      console.log('👤 Creando nuevo usuario:', { usuario: userData.usuario, tipo: userData.tipo });
      const response = await api.post('/users', userData);
      console.log('✅ Usuario creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear usuario:', error.response?.data || error.message);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Error al crear usuario');
      } else {
        throw new Error('Error de conexión al crear usuario');
      }
    }
  },

  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      console.log('📋 Obteniendo todos los usuarios');
      const response = await api.get('/users');
      console.log('✅ Usuarios obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error.response?.data || error.message);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Error al obtener usuarios');
      } else {
        throw new Error('Error de conexión al obtener usuarios');
      }
    }
  },

  // Obtener usuario por ID
  getUserById: async (id) => {
    try {
      console.log('👤 Obteniendo usuario ID:', id);
      const response = await api.get(`/users/${id}`);
      console.log('✅ Usuario obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error.response?.data || error.message);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Error al obtener usuario');
      } else {
        throw new Error('Error de conexión al obtener usuario');
      }
    }
  },

  // Actualizar usuario
  updateUser: async (id, userData) => {
    try {
      console.log('✏️ Actualizando usuario ID:', id);
      const response = await api.put(`/users/${id}`, userData);
      console.log('✅ Usuario actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error.response?.data || error.message);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Error al actualizar usuario');
      } else {
        throw new Error('Error de conexión al actualizar usuario');
      }
    }
  },

  // Eliminar usuario
  deleteUser: async (id) => {
    try {
      console.log('🗑️ Eliminando usuario ID:', id);
      const response = await api.delete(`/users/${id}`);
      console.log('✅ Usuario eliminado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error.response?.data || error.message);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Error al eliminar usuario');
      } else {
        throw new Error('Error de conexión al eliminar usuario');
      }
    }
  }
};

// Servicio de productos
export const productService = {
  // Obtener todos los productos
  getAll: async () => {
    try {
      const response = await api.get('/products');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener productos' };
    }
  },

  // Buscar productos por texto (nombre o código)
  search: async (q) => {
    try {
      const response = await api.get('/products', { params: { q } });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      throw error.response?.data || { message: 'Error al buscar productos' };
    }
  },

  // Obtener producto por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener producto' };
    }
  },

  // Crear producto
  create: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear producto' };
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar producto' };
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar producto' };
    }
  }
};

// Servicio de clientes
export const clientService = {
  // Obtener todos los clientes
  getAll: async () => {
    try {
      const response = await api.get('/clients');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener clientes' };
    }
  },

  // Obtener cliente por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener cliente' };
    }
  },

  // Crear cliente
  create: async (clientData) => {
    try {
      const response = await api.post('/clients', clientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear cliente' };
    }
  },

  // Actualizar cliente
  update: async (id, clientData) => {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar cliente' };
    }
  },

  // Eliminar cliente
  delete: async (id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar cliente' };
    }
  }
};

// Servicio de ventas - adaptado para tu backend
export const salesService = {
  // Obtener todas las ventas
  getAll: async () => {
    try {
      const response = await api.get('/ventas');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener ventas' };
    }
  },

  // Crear nueva venta
  create: async (saleData) => {
    try {
      const response = await api.post('/ventas', saleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al procesar venta' };
    }
  },

  // Obtener reporte de ventas
  getReport: async (filters) => {
    try {
      const response = await api.get('/ventas/reporte', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener reporte' };
    }
  }
  ,

  // Obtener venta por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/ventas/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener venta' };
    }
  }
  ,

  // Anular venta (requiere credenciales admin)
  anularVenta: async (id, credentials) => {
    try {
      const response = await api.post(`/ventas/${id}/anular`, credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al anular venta' };
    }
  }
  ,
  marcarPagada: async (id, payload = {}) => {
    try {
      // payload recibido como segundo argumento
      const response = await api.post(`/ventas/${id}/marcar-pagada`, payload);
      // Si el backend responde con success:false, lanzar error para que el catch lo maneje
      if (response.data && response.data.success === false) {
        const msg = response.data.message || 'Error al marcar como pagada';
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      return response.data;
    } catch (error) {
      // Log detallado para depuración en consola del navegador
      console.error('salesService.marcarPagada - error raw:', error, 'responseData:', error?.response?.data);
      const msg = error?.response?.data?.message || error?.message || 'Error al marcar como pagada';
      throw new Error(typeof msg === 'string' && msg.trim() !== '' ? msg : 'Error al marcar como pagada');
    }
  }
};

// Servicio para detalles de venta (si el endpoint existe separadamente)
export const detailService = {
  getByVentaId: async (ventaId) => {
    try {
      const response = await api.get(`/detalle-venta/${ventaId}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      // No forzar excepción, devolver array vacío para fallback
      console.error('Error al obtener detalles por venta:', error.response?.data || error.message);
      return [];
    }
  }
};

// Servicio de cotizaciones
export const quotationService = {
  // Obtener todas las cotizaciones
  getAll: async () => {
    try {
      const response = await api.get('/cotizaciones');
      return response.data.success ? response.data : { data: [] };
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener cotizaciones' };
    }
  },

  // Obtener cotización por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/cotizaciones/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener cotización' };
    }
  },

  // Crear/guardar nueva cotización
  create: async (quotationData) => {
    try {
      const response = await api.post('/cotizaciones', quotationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al guardar cotización' };
    }
  },

  // Actualizar cotización
  update: async (id, quotationData) => {
    try {
      const response = await api.put(`/cotizaciones/${id}`, quotationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar cotización' };
    }
  },

  // Eliminar cotización
  delete: async (id) => {
    try {
      const response = await api.delete(`/cotizaciones/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar cotización' };
    }
  },

  // Obtener detalles completos de una cotización
  getDetalle: async (id) => {
    try {
      const response = await api.get(`/cotizaciones/${id}/detalle`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener detalles de la cotización' };
    }
  },

  // Preparar cotización para venta (verifica stock)
  prepararVenta: async (id) => {
    try {
      const response = await api.get(`/cotizaciones/${id}/preparar-venta`);
      return response.data; // Devolvemos la respuesta completa para acceder a success, data, etc.
    } catch (error) {
      throw error.response?.data || { message: 'Error al preparar la cotización para venta' };
    }
  },

  // Convertir cotización a venta
  convertToSale: async (id, options = {}) => {
    try {
      const response = await api.post(`/cotizaciones/${id}/convertir-venta`, options);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al convertir cotización a venta' };
    }
  }
  ,

  // Actualizar detalle de cotización (reemplaza items y actualiza totales)
  updateDetalle: async (id, payload) => {
    try {
      const response = await api.put(`/cotizaciones/${id}/detalle`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar detalle de cotización' };
    }
  }
};

// Servicio de dashboard - usando reportes del backend
export const dashboardService = {
  // Obtener métricas del dashboard usando tus endpoints de reportes
  getMetrics: async () => {
    try {
      // Obtener datos básicos para el dashboard
      const [productos, clientes, ventas] = await Promise.all([
        api.get('/products'),
        api.get('/clients'),
        api.get('/ventas')
      ]);

      return {
        productos: productos.data.success ? productos.data.count || productos.data.data?.length || 0 : 0,
        clientes: clientes.data.success ? clientes.data.count || clientes.data.data?.length || 0 : 0,
        ventas: ventas.data.success ? ventas.data.count || ventas.data.data?.length || 0 : 0,
        stockBajo: 0 // Se puede implementar con un endpoint específico si está disponible
      };
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      // Devolver valores por defecto en caso de error
      return {
        productos: 0,
        clientes: 0,
        ventas: 0,
        stockBajo: 0
      };
    }
  },

  // Servicio para obtener reportes específicos (usando tus endpoints de reportes)
  getReports: {
    // Productos más vendidos
    topProducts: async () => {
      try {
        const response = await api.get('/reportes/productos-mas-vendidos');
        return response.data.success ? response.data.data : [];
      } catch (error) {
        throw error.response?.data || { message: 'Error al obtener reporte de productos más vendidos' };
      }
    },

    // Ventas por vendedor
    salesByUser: async () => {
      try {
        const response = await api.get('/reportes/ventas-por-vendedor');
        return response.data.success ? response.data.data : [];
      } catch (error) {
        throw error.response?.data || { message: 'Error al obtener reporte de ventas por vendedor' };
      }
    },

    // Clientes con más compras
    topClients: async () => {
      try {
        const response = await api.get('/reportes/clientes-mas-compras');
        return response.data.success ? response.data.data : [];
      } catch (error) {
        throw error.response?.data || { message: 'Error al obtener reporte de clientes con más compras' };
      }
    },

    // Ganancias diarias
    dailyEarnings: async () => {
      try {
        const response = await api.get('/reportes/ganancias-diarias');
        return response.data.success ? response.data.data : [];
      } catch (error) {
        throw error.response?.data || { message: 'Error al obtener reporte de ganancias diarias' };
      }
    },

    // Ganancias mensuales
    monthlyEarnings: async () => {
      try {
        const response = await api.get('/reportes/ganancias-mensuales');
        return response.data.success ? response.data.data : [];
      } catch (error) {
        throw error.response?.data || { message: 'Error al obtener reporte de ganancias mensuales' };
      }
    }
  }
};
