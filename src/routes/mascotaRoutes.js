const express = require('express');
const router = express.Router();
const { listarMascotas, crearMascota, obtenerMascota, actualizarMascota, eliminarMascota } = require('../controllers/mascotaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarMascotas);
router.post('/', crearMascota);
router.get('/:id', obtenerMascota);
router.put('/:id', actualizarMascota);
router.delete('/:id', eliminarMascota);

module.exports = router;
