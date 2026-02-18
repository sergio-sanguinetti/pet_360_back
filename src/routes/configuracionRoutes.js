const express = require('express');
const router = express.Router();
const { obtenerConfiguracion, actualizarConfiguracion } = require('../controllers/configuracionController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', obtenerConfiguracion);
router.put('/', actualizarConfiguracion);

module.exports = router;
