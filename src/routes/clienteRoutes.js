const express = require('express');
const router = express.Router();
const { listarClientes, crearCliente, obtenerCliente, actualizarCliente, eliminarCliente, completarWizard, agregarMascota } = require('../controllers/clienteController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarClientes);
router.post('/', crearCliente);
router.get('/:id', obtenerCliente);
router.put('/:id', actualizarCliente);
router.delete('/:id', eliminarCliente);
router.post('/completar-wizard', completarWizard);
router.post('/agregar-mascota', agregarMascota);

module.exports = router;
