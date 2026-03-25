const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const mascotaRoutes = require('./routes/mascotaRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const productoRoutes = require('./routes/productoRoutes');
const razaRoutes = require('./routes/razaRoutes');
const recetasRoutes = require('./routes/recetasRoutes');
const antipulgasRoutes = require('./routes/antipulgasRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const alergiaRoutes = require('./routes/alergiaRoutes');
const vacunasRoutes = require('./routes/vacunasRoutes');
const suscripcionRoutes = require('./routes/suscripcionRoutes');
const descuentoRoutes = require('./routes/descuentoRoutes');
const datoCuriosoRoutes = require('./routes/datoCuriosoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const zonaEnvioRoutes = require('./routes/zonaEnvioRoutes');
const condicionCorporalRoutes = require('./routes/condicionCorporalRoutes');
const pushRoutes = require('./routes/pushRoutes');
const recomendacionRoutes = require('./routes/recomendacionRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const reportesRoutes = require('./routes/reportesRoutes');

// ...
// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { initCronJobs } = require('./utils/cronJobs');

// Importar Prisma Client
const prisma = require('./config/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Verificar conexión a la base de datos al iniciar
prisma.$connect()
  .then(() => {
    logger.info('✅ Conectado a la base de datos MySQL');
  })
  .catch((error) => {
    logger.error('❌ Error al conectar a la base de datos:', error);
  });

// Middleware de seguridad
// Configurar Helmet para permitir archivos estáticos
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Desactivar CSP para archivos estáticos
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5000, // límite de 5000 requests por IP por ventana de tiempo (aumentado para evitar bloqueos en frontend)
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// Middleware de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl requests) CAMBIOS
    if (!origin) return callback(null, true);

    // Lista de orígenes permitidos
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3000',
      process.env.GOMUX_URL || 'http://localhost:3001'
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos los orígenes en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware para parsear JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/razas', razaRoutes);
app.use('/api/recetas', recetasRoutes);
app.use('/api/antipulgas', antipulgasRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/alergias', alergiaRoutes);
app.use('/api/vacunas', vacunasRoutes);
app.use('/api/suscripciones', suscripcionRoutes);
app.use('/api/descuentos', descuentoRoutes);
app.use('/api/datos-curiosos', datoCuriosoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/zonas-envio', zonaEnvioRoutes);
app.use('/api/condiciones-corporales', condicionCorporalRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/reportes', reportesRoutes);
// Servir la carpeta uploads como estática
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Pet 360 - Sistema de Gestión',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      usuarios: '/api/usuarios'
    }
  });
});

// Middleware para manejar rutas no encontradas
// NOTA: Este middleware solo se ejecuta si ningún middleware anterior respondió
app.use((req, res) => {
  // Si llegamos aquí, ninguna ruta coincidió
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
  logger.info(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 URL: http://localhost:${PORT}`);
  logger.info(`📋 Documentación: http://localhost:${PORT}/api-docs`);
});

// Arrancar cron jobs automáticos de notificaciones
initCronJobs();

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  logger.error('Error no capturado (uncaughtException):', err);
  // No llamar process.exit(1) para que el servidor no se caiga
  // Solo loggear y continuar
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada (unhandledRejection):', reason);
  // No llamar process.exit(1) para que el servidor no se caiga
  // Solo loggear y continuar
});

module.exports = app;

