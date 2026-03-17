const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificacionController');

router.get('/', controller.getNotificaciones);
router.post('/', controller.createNotificacion);
router.put('/:id', controller.updateNotificacion);
router.delete('/:id', controller.deleteNotificacion);

// Ejecutar manualmente la revisión de vacunas / antipulgas y envío de notificaciones
router.post('/run-salud', controller.runSaludAutomatica);

module.exports = router;
