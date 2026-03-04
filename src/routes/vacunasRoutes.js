const express = require('express');
const router = express.Router();
const controller = require('../controllers/vacunaController');

router.get('/', controller.getVacunas);
router.post('/', controller.createVacuna);
router.put('/:id', controller.updateVacuna);
router.delete('/:id', controller.deleteVacuna);

module.exports = router;
