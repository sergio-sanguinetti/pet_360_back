const express = require('express');
const router = express.Router();
const { listarUsuarios, crearUsuario, obtenerUsuario, actualizarUsuario, eliminarUsuario } = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.get('/:id', obtenerUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;

