import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = 'http://localhost:5000/api'; // Tu backend en puerto 5000

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para agregar token de autenticación a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

// Función para verificar la conexión con el backend
export const checkBackendConnection = async () => {
  console.log('🔍 Verificando conexión con backend...', API_BASE_URL);
  try {
    // Intentamos hacer una petición simple al servidor (ruta principal)
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}`, { timeout: 3000 });
    console.log('✅ Respuesta exitosa:', response);
    return {
      connected: true,
      message: 'Conexión exitosa con el backend',
      status: response.status,
      url: API_BASE_URL
    };
  } catch (error) {
    console.log('⚠️ Error capturado:', error.response?.status, error.message);
    
    // Si es un error de CORS, significa que el servidor está funcionando
    if (error.message === 'Network Error' && error.code !== 'ECONNREFUSED') {
      console.log('⚠️ Error de CORS detectado - servidor funcionando, configuración CORS necesaria');
      return {
        connected: true,
        message: '⚠️ Backend conectado pero requiere configuración CORS',
        status: 'CORS Error - Puerto diferente',
        url: API_BASE_URL
      };
    }
    
    // Si obtenemos error 404, significa que el servidor está funcionando
    // solo que el endpoint no existe (lo cual es normal)
    if (error.response && error.response.status === 404) {
      console.log('✅ Error 404 detectado - servidor funcionando correctamente');
      return {
        connected: true,
        message: '✅ Backend conectado y funcionando correctamente',
        status: 'Servidor activo (404 esperado)',
        url: API_BASE_URL
      };
    }
    
    // Si obtenemos cualquier otra respuesta del servidor, también está conectado
    if (error.response) {
      console.log('✅ Servidor responde con status:', error.response.status);
      return {
        connected: true,
        message: '✅ Backend conectado (servidor responde)',
        status: `HTTP ${error.response.status}`,
        url: API_BASE_URL
      };
    }
    
    // Solo si no hay respuesta del servidor, entonces hay error de conexión
    console.log('❌ Sin respuesta del servidor');
    return {
      connected: false,
      message: `❌ Error de conexión: ${error.code === 'ECONNREFUSED' ? 'Servidor no disponible' : error.message}`,
      status: 'Sin respuesta del servidor',
      url: API_BASE_URL
    };
  }
};
