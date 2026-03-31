const express = require('express');
const router = express.Router();
const { crearPreferenciaMercadoPago, recibirWebhookMercadoPago } = require('../controllers/pagoController');

// Crear preferencia de pago en MercadoPago (Checkout Pro)
router.post('/mercadopago/preferencia', crearPreferenciaMercadoPago);

// Recibir notificaciones de pago (Webhook)
router.post('/mercadopago/webhook', recibirWebhookMercadoPago);

module.exports = router;

