const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Obtener estadísticas principales para AdminDashboard
router.get('/dashboard', reportesController.obtenerEstadisticasDashboard);

module.exports = router;
