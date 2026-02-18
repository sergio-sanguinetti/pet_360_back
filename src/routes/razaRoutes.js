const express = require('express');
const router = express.Router();
const { listarRazas, crearRaza, actualizarRaza, eliminarRaza } = require('../controllers/razaController');

router.get('/', listarRazas);
router.post('/', crearRaza);
router.put('/:id', actualizarRaza);
router.delete('/:id', eliminarRaza);

module.exports = router;
