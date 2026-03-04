const express = require('express');
const router = express.Router();
const datoCuriosoController = require('../controllers/datoCuriosoController');

// Rutas base: /api/datos-curiosos
router.get('/', datoCuriosoController.getDatosCuriosos);
router.get('/:id', datoCuriosoController.getDatoCuriosoById);
router.post('/', datoCuriosoController.createDatoCurioso);
router.put('/:id', datoCuriosoController.updateDatoCurioso);
router.delete('/:id', datoCuriosoController.deleteDatoCurioso);

module.exports = router;
