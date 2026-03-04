const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificacionController');

router.get('/', controller.getNotificaciones);
router.post('/', controller.createNotificacion);
router.put('/:id', controller.updateNotificacion);
router.delete('/:id', controller.deleteNotificacion);

module.exports = router;
