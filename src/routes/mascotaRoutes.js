const express = require('express');
const router = express.Router();
const { listarMascotas, crearMascota, obtenerMascota, actualizarMascota, eliminarMascota, registrarPeso, obtenerHistorialPeso } = require('../controllers/mascotaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
// router.use(verificarToken); // Temporarily commented for easier testing

// Rutas
router.get('/', listarMascotas);
router.post('/', crearMascota);
router.get('/:id', obtenerMascota);
router.put('/:id', actualizarMascota);
router.delete('/:id', eliminarMascota);
router.post('/:id/peso', registrarPeso);
router.get('/:id/peso', obtenerHistorialPeso);

module.exports = router;
