const express = require('express');
const router = express.Router();
const alergiaController = require('../controllers/alergiaController');

router.get('/', alergiaController.getAlergias);
router.post('/', alergiaController.createAlergia);
router.put('/:id', alergiaController.updateAlergia);
router.delete('/:id', alergiaController.deleteAlergia);

module.exports = router;
