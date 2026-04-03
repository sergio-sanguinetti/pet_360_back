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
      external_reference,
      clienteId,
      mascotaId,
      suscripcionData // Objeto con plan, recetaNombre, cantidadBolsas, etc.
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
    const webhookUrl = process.env.MP_WEBHOOK_URL; // URL pública de tu backend

    const body = {
      items: [
        {
          title,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          currency_id: 'PEN',
          unit_price
        }
      ],
      external_reference: external_reference || `REF-${Date.now()}`,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: 'approved',
      notification_url: webhookUrl || null
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

    // Guardar referencia en la tabla de pagos para el webhook
    const prisma = require('../config/prisma');
    try {
      await prisma.pago.create({
        data: {
          preferenceId: data.id,
          externalRef: body.external_reference,
          monto: unit_price * quantity,
          estado: 'pending',
          clienteId: clienteId ? parseInt(clienteId) : null,
          mascotaId: mascotaId ? parseInt(mascotaId) : null,
          suscripcionData: suscripcionData ? JSON.stringify(suscripcionData) : null
        }
      });
    } catch (dbErr) {
      logger.error('Error al guardar registro de pago inicial', dbErr);
      // No bloqueamos el flujo, el ID ya se generó en MP
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

/**
 * Recibe y procesa las notificaciones de MercadoPago (Webhooks).
 */
const recibirWebhookMercadoPago = async (req, res, next) => {
  try {
    const { action, data, type } = req.body;
    
    // MercadoPago envía notificaciones de distintos tipos. Nos interesa payment.created o similar.
    // O simplemente "payment" según la versión.
    const resourceType = type || req.query.topic;
    const resourceId = data?.id || req.query.id;

    if (action === 'payment.created' || resourceType === 'payment') {
      const paymentId = resourceId;
      logger.info(`Notificación de pago recibida: ${paymentId}`);

      // 1. Obtener detalles del pago desde MercadoPago API
      const mpEnv = (process.env.MP_ENV || process.env.MERCADOPAGO_MODE || 'test').toLowerCase();
      let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (mpEnv === 'test' && process.env.MERCADOPAGO_ACCESS_TOKEN_TEST) {
        accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;
      } else if (mpEnv === 'prod' && process.env.MERCADOPAGO_ACCESS_TOKEN_PROD) {
        accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN_PROD;
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!mpResponse.ok) {
        throw new Error(`Error al obtener pago ${paymentId} de MP API`);
      }

      const paymentData = await mpResponse.json();
      const status = paymentData.status; // approved, rejected, pending, etc.
      const preferenceId = paymentData.preference_id;
      const externalRef = paymentData.external_reference;

      // 2. Buscar nuestro registro de pago
      const prisma = require('../config/prisma');
      const pagoExistente = await prisma.pago.findFirst({
        where: {
          OR: [
            { preferenceId: preferenceId },
            { externalRef: externalRef }
          ]
        }
      });

      if (pagoExistente) {
        // 3. Actualizar estado del pago
        await prisma.pago.update({
          where: { id: pagoExistente.id },
          data: {
            paymentId: String(paymentId),
            estado: status,
            metodo: paymentData.payment_method_id
          }
        });

        // 4. Si el pago está aprobado y aún no ha sido procesado, crear suscripción
        if (status === 'approved' && !pagoExistente.procesado && pagoExistente.suscripcionData) {
          const sd = JSON.parse(pagoExistente.suscripcionData);
          
          const proxima = new Date();
          const diasF = sd.plan === 'semanal' ? 7 : sd.plan === 'mensual' ? 30 : 15;
          proxima.setDate(proxima.getDate() + diasF);

          try {
            await prisma.suscripcion.create({
              data: {
                clienteId: pagoExistente.clienteId,
                mascotaId: pagoExistente.mascotaId,
                plan: sd.plan,
                proximaEntrega: proxima,
                montoBase: pagoExistente.monto,
                recetaNombre: sd.recetaNombre,
                recetaId: sd.recetaId ? parseInt(sd.recetaId) : null,
                cantidadBolsas: sd.cantidadBolsas ? parseInt(sd.cantidadBolsas) : 1,
                gramosPorBolsa: sd.gramosPorBolsa ? parseInt(sd.gramosPorBolsa) : 0,
                resumenBolsas: sd.resumenBolsas || null,
                direccionEnvio: sd.direccionEnvio || null,
                distritoEnvio: sd.distritoEnvio || null,
                horarioEntrega: sd.horarioEntrega || null,
                estadoPedido: 'pendiente',
                estado: 'activa'
              }
            });

            // Marcar como procesado para no duplicar
            await prisma.pago.update({
              where: { id: pagoExistente.id },
              data: { procesado: true }
            });

            logger.info(`Suscripción creada automáticamente vía Webhook para Pago ID: ${paymentId}`);
          } catch (subErr) {
            logger.error('Error al crear suscripción desde Webhook', subErr);
          }
        }
      } else {
        logger.warn(`Pago recibido pero no encontrado en DB: PrefID=${preferenceId}, Ref=${externalRef}`);
      }
    }

    // MercadoPago requiere un 200/201 OK para confirmar recepción
    return res.status(200).send('OK');
  } catch (err) {
    logger.error('Error en Webhook de MercadoPago', err);
    // Devolvemos 200 de todos modos para que MP no reintente infinitamente si es algo de nuestra lógica
    return res.status(200).send('Error logged');
  }
};

module.exports = {
  crearPreferenciaMercadoPago,
  recibirWebhookMercadoPago
};

