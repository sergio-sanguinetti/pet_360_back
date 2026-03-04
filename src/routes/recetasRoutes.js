const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/recetaController');

router.get('/', recetaController.getRecetas);
router.post('/', recetaController.createReceta);
router.put('/:id', recetaController.updateReceta);
router.put('/:id/precios', recetaController.updateRecetaPrecios);
router.delete('/:id', recetaController.deleteReceta);

module.exports = router;
