const express = require('express');
const router = express.Router();
const descuentoController = require('../controllers/descuentoController');

// Rutas base: /api/descuentos
router.get('/', descuentoController.getDescuentos);
router.get('/activo/:tipo', descuentoController.getDescuentoActivo); // nuevo_cliente | cliente_recurrente
router.get('/:id', descuentoController.getDescuentoById);
router.post('/', descuentoController.createDescuento);
router.put('/:id', descuentoController.updateDescuento);
router.delete('/:id', descuentoController.deleteDescuento);

module.exports = router;

