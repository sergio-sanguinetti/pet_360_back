const express = require('express');
const router = express.Router();
const { obtenerConfiguracion, actualizarConfiguracion } = require('../controllers/configuracionController');
const { verificarToken } = require('../middleware/authMiddleware');

// Rutas
router.get('/', obtenerConfiguracion);
router.put('/', verificarToken, actualizarConfiguracion);

module.exports = router;
