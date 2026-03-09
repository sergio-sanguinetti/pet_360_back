const express = require('express');
const router = express.Router();
const { crearPreferenciaMercadoPago } = require('../controllers/pagoController');

// Crear preferencia de pago en MercadoPago (Checkout Pro)
router.post('/mercadopago/preferencia', crearPreferenciaMercadoPago);

module.exports = router;

