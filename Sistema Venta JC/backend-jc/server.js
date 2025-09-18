// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression'); // 🚀 NUEVA: Compresión gzip
const NodeCache = require('node-cache'); // 🚀 NUEVA: Cache en memoria
require('dotenv').config();

// 🚀 CACHE GLOBAL - 10 minutos TTL para datos frecuentes
const cache = new NodeCache({ 
  stdTTL: 600, // 10 minutos
  checkperiod: 120, // Verificar expiración cada 2 minutos
  useClones: false // Mejor rendimiento
});

// Importar rutas
const clientRoutes = require('./src/routes/clientRoutes');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const almacenRoutes = require('./src/routes/almacenRoutes');
const ventaRoutes = require('./src/routes/ventaRoutes');
const detalleVentaRoutes = require('./src/routes/detalleVentaRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const authRoutes = require('./src/routes/authRoutes');
const cotizacionesRoutes = require('./src/routes/cotizaciones');

const app = express();
// Permitir que Express confíe en el proxy (necesario para entornos como Codespaces)
app.set('trust proxy', 1);

// Conectar a la base de datos (Supabase)
const supabase = require('./src/config/database');

// --- Configuración de CORS (ANTES de helmet) ---
const corsOptions = {
  origin: (origin, callback) => {
    console.log('🌐 Origin recibido:', origin); // 👈 Para depurar
    
    const allowedOrigins = [
      // Desarrollo local
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      
      // GitHub Codespaces (cualquier puerto y nombre de codespace)
      /^https:\/\/[a-zA-Z0-9-]+-g464979wjq4gfxv-\d+\.app\.github\.dev\/?$/,
      
      // GitHub Codespaces específico (por si acaso)
      /^https:\/\/urban-capybara-g464979wjq4gfxv-\d+\.app\.github\.dev\/?$/,
      
      // Render.com - Producción (patrones amplios para cualquier nombre)
      /^https:\/\/jc-frontend.*\.onrender\.com\/?$/,
      /^https:\/\/jcenyda-sistema-frontend\.onrender\.com\/?$/,
      /^https:\/\/[a-zA-Z0-9-]*frontend[a-zA-Z0-9-]*\.onrender\.com\/?$/,
      /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com\/?$/,
      
      // URLs específicas detectadas
      'https://jcenyda-sistema-frontend.onrender.com',
      
      // Dominios personalizados (agregar cuando sea necesario)
      // /^https:\/\/tu-dominio\.com$/
    ];
    
    // También verificar variables de entorno para orígenes adicionales
    if (process.env.CORS_ORIGINS) {
      const envOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
      envOrigins.forEach(envOrigin => {
        allowedOrigins.push(new RegExp(`^${envOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      });
    }
    
    // Permitir sin 'origin' (Postman, apps móviles) o si hace match con la lista blanca
    if (!origin || allowedOrigins.some(regex => regex.test(origin))) {
      console.log('✅ Origin permitido:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin NO permitido:', origin);
      callback(new Error(`No permitido por CORS: ${origin}`));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight para todas las rutas

// --- Middlewares de optimización ---
// 🚀 COMPRESIÓN GZIP - Reducir tamaño de respuestas
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false; // No comprimir si se solicita explícitamente
    }
    return compression.filter(req, res);
  },
  level: 6, // Nivel de compresión balanceado
  threshold: 1024 // Solo comprimir respuestas > 1KB
}));

// --- Middleware de cache ---
// 🚀 CACHE MIDDLEWARE - Para rutas GET frecuentes
const cacheMiddleware = (duration = 600) => (req, res, next) => {
  // Solo cachear métodos GET
  if (req.method !== 'GET') {
    return next();
  }
  
  const key = `${req.originalUrl || req.url}`;
  const cached = cache.get(key);
  
  if (cached) {
    console.log(`🚀 Cache HIT: ${key}`);
    return res.json(cached);
  }
  
  // Interceptar res.json para guardar en cache
  const originalJson = res.json;
  res.json = function(data) {
    // Solo cachear respuestas exitosas
    if (res.statusCode === 200) {
      console.log(`💾 Guardando en cache: ${key}`);
      cache.set(key, data, duration);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

// --- Middlewares de seguridad ---
app.use(helmet());

// Rate limiting - Configuración optimizada para producción
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // 🚀 Incrementado a 500 en producción
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No aplicar rate limiting a rutas de prueba en desarrollo
    if (process.env.NODE_ENV === 'development' && req.path === '/test-db') {
      return true;
    }
    return false;
  }
});
app.use(limiter);

// Middlewares de parseo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Usar rutas con cache para endpoints frecuentes
app.use('/api/auth', authRoutes);
app.use('/api/clientes', cacheMiddleware(300), clientRoutes); // 🚀 Cache 5 minutos
app.use('/api/productos', cacheMiddleware(600), productRoutes); // 🚀 Cache 10 minutos  
app.use('/api/usuarios', userRoutes);
app.use('/api/almacen', cacheMiddleware(300), almacenRoutes); // 🚀 Cache 5 minutos
app.use('/api/ventas', ventaRoutes); // Sin cache - datos dinámicos
app.use('/api/detalles-venta', detalleVentaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);


// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Ventas JC',
    version: '1.0.0',
    status: 'Funcionando correctamente'
  });
});

// Ruta de prueba para la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clientes').select('*').limit(5);
    if (error) throw error;
    res.json({
      success: true,
      message: 'Conexión a la base de datos exitosa. Mostrando 5 clientes.',
      data
    });
  } catch (error) {
    console.error('Error en /test-db:', error);
    res.status(500).json({
      success: false,
      message: 'Error al conectar con la base de datos.',
      error: error.message
    });
  }
});

// Rutas de la API (usando nombres en español para consistencia)
app.use('/api/usuarios', userRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/almacen', almacenRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/detalles-venta', detalleVentaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);

// Rutas de compatibilidad (inglés) para el frontend
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/detalle-venta', detalleVentaRoutes);

// Ruta para 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
