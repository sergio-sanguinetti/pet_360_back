const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recomendacionController');

router.get('/', ctrl.getRecomendaciones);
router.post('/', ctrl.createRecomendacion);
router.put('/:id', ctrl.updateRecomendacion);
router.delete('/:id', ctrl.deleteRecomendacion);

module.exports = router;
