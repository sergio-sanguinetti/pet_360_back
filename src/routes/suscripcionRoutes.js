const express = require('express');
const router = express.Router();
const suscripcionController = require('../controllers/suscripcionController');
const { verificarToken } = require('../middleware/authMiddleware');

router.post('/', suscripcionController.createSuscripcion);
router.get('/', suscripcionController.getSuscripciones);
router.get('/:id', suscripcionController.getSuscripcionById);
router.put('/:id', verificarToken, suscripcionController.updateSuscripcion);
router.delete('/:id', verificarToken, suscripcionController.deleteSuscripcion);

module.exports = router;
