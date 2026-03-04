const express = require('express');
const router = express.Router();
const { getZonasEnvio, getZonaEnvioById, createZonaEnvio, updateZonaEnvio, deleteZonaEnvio } = require('../controllers/zonaEnvioController');

router.get('/', getZonasEnvio);
router.get('/:id', getZonaEnvioById);
router.post('/', createZonaEnvio);
router.put('/:id', updateZonaEnvio);
router.delete('/:id', deleteZonaEnvio);

module.exports = router;

