const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');

// Obtener todas las fechas bloqueadas
router.get('/', calendarioController.getFechasBloqueadas);

// Agregar una nueva fecha bloqueada
router.post('/', calendarioController.addFechaBloqueada);

// Eliminar una fecha bloqueada
router.delete('/:id', calendarioController.deleteFechaBloqueada);

module.exports = router;
