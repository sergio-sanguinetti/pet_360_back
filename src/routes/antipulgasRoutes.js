const express = require('express');
const router = express.Router();
const controller = require('../controllers/antipulgaController');

router.get('/', controller.getAntipulgas);
router.post('/', controller.createAntipulga);
router.put('/:id', controller.updateAntipulga);
router.delete('/:id', controller.deleteAntipulga);

module.exports = router;
