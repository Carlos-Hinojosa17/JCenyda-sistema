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

// Conectar a la base de datos (ahora inicializa Supabase)
const supabase = require('./src/config/database');

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana de tiempo
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
});

// Middlewares de seguridad
app.use(helmet());
app.use(limiter);

// Configuración de CORS
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true
}));

// Middlewares de parseo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Ventas JC',
    version: '1.0.0',
    status: 'Funcionando correctamente'
  });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
