// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/urban-capybara-g464979wjq4gfxv-\d+\.app\.github\.dev\/?$/
    ];
    // Permitir sin 'origin' (Postman, apps móviles) o si hace match con la lista blanca
    if (!origin || allowedOrigins.some(regex => regex.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error(`No permitido por CORS: ${origin}`));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight para todas las rutas

// --- Middlewares de seguridad ---
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
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

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/almacen', almacenRoutes);
app.use('/api/ventas', ventaRoutes);
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

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/almacen', almacenRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/detalle-venta', detalleVentaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);

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
