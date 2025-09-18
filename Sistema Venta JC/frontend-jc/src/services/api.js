import axios from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../config';

// Configuración base de Axios
const API_BASE_URL = config.API_BASE_URL; // Usar la URL del archivo de configuración

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 🚀 OPTIMIZADO: 30 segundos para servicios gratuitos
});

// 🚀 CONFIGURACIÓN DE REINTENTOS AUTOMÁTICOS con axios-retry
axiosRetry(api, {
  retries: 3, // Número máximo de reintentos
  retryDelay: (retryCount) => {
    console.log(`⏳ Reintento ${retryCount}/3 - Esperando ${retryCount * 1000}ms...`);
    return retryCount * 1000; // Delay incremental: 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Reintentar en:
    // - Errores de red (sin respuesta del servidor)
    // - Errores 5xx (errores del servidor)
    // - Timeouts
    // - Errores específicos de servicios gratuitos
    const shouldRetry = axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                       (error.response && error.response.status >= 500) ||
                       (error.code === 'ECONNABORTED') || // Timeout
                       (error.response && error.response.status === 503); // Service Unavailable
    
    if (shouldRetry) {
      console.log(`🔄 Reintentando debido a: ${error.message} (Status: ${error.response?.status || 'Sin respuesta'})`);
    }
    
    return shouldRetry;
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`🔄 Ejecutando reintento ${retryCount} para ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
  }
});

// 🚀 OPTIMIZACIÓN: Cache de requests recientes para evitar duplicados
const REQUEST_CACHE = new Map();
const CACHE_DURATION = 5000; // 5 segundos

// Interceptor para agregar token de autenticación y optimizaciones
api.interceptors.request.use(
  (config) => {
    // 🚀 CACHE: Verificar si ya hay una request igual en proceso
    const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
    const now = Date.now();
    
    // Solo aplicar cache a GET requests para datos estáticos
    if (config.method === 'get' && REQUEST_CACHE.has(requestKey)) {
      const cached = REQUEST_CACHE.get(requestKey);
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log(`🚀 Cache hit: ${requestKey}`);
        return Promise.reject({ 
          isAxiosError: false, 
          cached: true, 
          data: cached.data 
        });
      }
    }
    
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

// Interceptor para manejar respuestas y errores con retry automático
api.interceptors.response.use(
  (response) => {
    // 🚀 CACHE: Guardar respuesta exitosa para GET requests
    if (response.config.method === 'get') {
      const requestKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params || {})}`;
      REQUEST_CACHE.set(requestKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  async (error) => {
    // 🚀 RETRY: Manejar respuesta de cache
    if (error.cached) {
      return Promise.resolve({ data: error.data });
    }
    
    // 🚀 RETRY: Para errores de red o timeouts
    const { config } = error;
    if (!config?._retry && (
      error.code === 'ECONNABORTED' || 
      error.code === 'NETWORK_ERROR' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    )) {
      config._retry = true;
      console.log(`⏳ Reintentando request: ${config.url}`);
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api(config);
    }
    
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
  const testDbUrl = `${API_BASE_URL.replace('/api', '')}/test-db`;
  console.log('🔍 Verificando conexión con backend y BD...', testDbUrl);
  try {
    // Apuntar a la ruta de prueba de la base de datos
    const response = await axios.get(testDbUrl, { timeout: 5000 });
    console.log('✅ Respuesta exitosa:', response);
    return {
      connected: true,
      message: 'Conexión a BD exitosa.',
      status: response.status,
      url: testDbUrl
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
