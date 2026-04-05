const express = require('express');
const router = express.Router();
const { crearPreferenciaMercadoPago, recibirWebhookMercadoPago, verificarPagoMercadoPago } = require('../controllers/pagoController');

router.post('/mercadopago/preferencia', crearPreferenciaMercadoPago);
router.post('/mercadopago/webhook', recibirWebhookMercadoPago);
router.post('/mercadopago/verificar', verificarPagoMercadoPago);

module.exports = router;

