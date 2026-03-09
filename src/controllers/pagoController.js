const logger = require('../utils/logger');

/**
 * Crea una preferencia de pago en MercadoPago usando Checkout Pro.
 * Solo expone datos no sensibles al frontend (preferenceId / initPoint).
 */
const crearPreferenciaMercadoPago = async (req, res, next) => {
  try {
    // Seleccionar credenciales según entorno (test o producción)
    const mpEnv = (process.env.MP_ENV || process.env.MERCADOPAGO_MODE || 'test').toLowerCase();
    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (mpEnv === 'test' && process.env.MERCADOPAGO_ACCESS_TOKEN_TEST) {
      accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;
    } else if (mpEnv === 'prod' && process.env.MERCADOPAGO_ACCESS_TOKEN_PROD) {
      accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN_PROD;
    }

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'No hay ACCESS TOKEN de MercadoPago configurado. Revisa las variables MERCADOPAGO_ACCESS_TOKEN[_TEST/_PROD].'
      });
    }

    const {
      title,
      quantity = 1,
      unit_price,
      external_reference
    } = req.body || {};

    if (!title || typeof unit_price !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos para crear la preferencia (title, unit_price).'
      });
    }

    const successUrl = process.env.MP_SUCCESS_URL || 'http://localhost:3001/confirmacion-pago-exitoso';
    const failureUrl = process.env.MP_FAILURE_URL || 'http://localhost:3001/pago-logistica?status=failure';
    const pendingUrl = process.env.MP_PENDING_URL || 'http://localhost:3001/pago-logistica?status=pending';

    const body = {
      items: [
        {
          title,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          currency_id: 'PEN',
          unit_price
        }
      ],
      external_reference: external_reference || null,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      }
      // NOTA: auto_return 'approved' está dando error 400
      // ("auto_return invalid. back_url.success must be defined") en tu cuenta,
      // así que lo dejamos desactivado para que la preferencia se cree sin problemas.
      // MercadoPago seguirá mostrando el botón "Volver al sitio" que lleva a MP_SUCCESS_URL.
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Error al crear preferencia de MercadoPago', {
        status: response.status,
        data
      });

      const error = new Error(data?.message || data?.error || 'Error al crear la preferencia de pago.');
      error.status = response.status || 500;
      throw error;
    }

    return res.json({
      success: true,
      preferenceId: data.id,
      initPoint: data.init_point || data.initPoint || null,
      sandboxInitPoint: data.sandbox_init_point || null,
      env: mpEnv
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  crearPreferenciaMercadoPago
};

