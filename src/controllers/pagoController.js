const logger = require('../utils/logger');

/**
 * Crea una preferencia de pago en MercadoPago usando Checkout Pro.
 * Solo expone datos no sensibles al frontend (preferenceId / initPoint).
 */
const crearPreferenciaMercadoPago = async (req, res, next) => {
  try {
    const mpEnv = (process.env.MP_ENV || 'test').toLowerCase();
    const accessToken = mpEnv === 'prod'
      ? (process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || '')
      : (process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || '');

    logger.info(`[MP] Modo: ${mpEnv} | Token presente: ${accessToken ? 'SI (' + accessToken.substring(0, 15) + '...)' : 'NO'}`);

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: `No hay ACCESS TOKEN de MercadoPago configurado para modo ${mpEnv}. Revisa MERCADOPAGO_ACCESS_TOKEN_${mpEnv === 'prod' ? 'PROD' : 'TEST'}.`
      });
    }

    const {
      title,
      quantity = 1,
      unit_price,
      external_reference,
      clienteId,
      mascotaId,
      payerEmail,
      suscripcionData // Objeto con plan, recetaNombre, cantidadBolsas, etc.
    } = req.body || {};

    if (!title || typeof unit_price !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos para crear la preferencia (title, unit_price).'
      });
    }

    const safeTitle = String(title).substring(0, 256).replace(/[<>"]/g, '');
    const safePrice = parseFloat(Number(unit_price).toFixed(2));
    const safeQty = Number.isFinite(quantity) && quantity > 0 ? Number(quantity) : 1;

    const body = {
      items: [
        {
          title: safeTitle,
          quantity: safeQty,
          currency_id: 'PEN',
          unit_price: safePrice
        }
      ],
      external_reference: external_reference || `REF-${Date.now()}`,
      back_urls: {
        success: process.env.MP_SUCCESS_URL || 'https://petlife360.pe/confirmacion-pago-exitoso',
        failure: process.env.MP_FAILURE_URL || 'https://petlife360.pe/pago-logistica?status=failure',
        pending: process.env.MP_PENDING_URL || 'https://petlife360.pe/pago-logistica?status=pending'
      },
      auto_return: 'approved'
    };

    logger.info('[MP] Creando preferencia', { mpEnv, safePrice, safeTitle });

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
      logger.error('[MP] Error al crear preferencia', {
        httpStatus: response.status,
        mpError: JSON.stringify(data)
      });

      // Propagamos el mensaje de MP directamente para debuggear
      const errorMsg = data?.message || data?.error || data?.cause?.map?.(c => c.description).join(', ') || 'Error al crear la preferencia de pago.';
      return res.status(response.status || 500).json({
        success: false,
        message: errorMsg,
        error: JSON.stringify(data)
      });
    }

    logger.info('[MP] Preferencia creada OK', { prefId: data.id });

    // Guardar referencia en la tabla de pagos para el webhook
    const prisma = require('../config/prisma');
    try {
      await prisma.pago.create({
        data: {
          preferenceId: data.id,
          externalRef: body.external_reference,
          monto: safePrice * safeQty,
          estado: 'pending',
          clienteId: clienteId ? parseInt(clienteId) : null,
          mascotaId: mascotaId ? parseInt(mascotaId) : null,
          suscripcionData: suscripcionData ? JSON.stringify(suscripcionData) : null
        }
      });
    } catch (dbErr) {
      logger.error('[MP] Error al guardar registro de pago inicial', dbErr);
    }

    const usesSandboxCheckout = accessToken.startsWith('TEST-');

    return res.json({
      success: true,
      preferenceId: data.id,
      initPoint: usesSandboxCheckout
        ? (data.sandbox_init_point || data.init_point)
        : (data.init_point || data.initPoint),
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

      const whMpEnv = (process.env.MP_ENV || 'test').toLowerCase();
      const accessToken = whMpEnv === 'prod'
        ? (process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || '')
        : (process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || '');

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

/**
 * Verifica un pago con la API de MercadoPago usando el payment_id
 * que llega en los query params de la URL de retorno.
 * Si el pago está aprobado y no fue procesado, crea la suscripción.
 */
const verificarPagoMercadoPago = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId es requerido.' });
    }

    const mpEnv = (process.env.MP_ENV || 'test').toLowerCase();
    const accessToken = mpEnv === 'prod'
      ? (process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || '')
      : (process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || '');

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!mpResponse.ok) {
      logger.error(`[MP Verificar] No se pudo obtener pago ${paymentId}: HTTP ${mpResponse.status}`);
      return res.status(404).json({ success: false, message: 'Pago no encontrado en MercadoPago.' });
    }

    const paymentData = await mpResponse.json();
    const status = paymentData.status;
    const preferenceId = paymentData.preference_id;
    const externalRef = paymentData.external_reference;

    const prisma = require('../config/prisma');
    const pagoExistente = await prisma.pago.findFirst({
      where: {
        OR: [
          ...(preferenceId ? [{ preferenceId }] : []),
          ...(externalRef ? [{ externalRef }] : [])
        ]
      }
    });

    let suscripcionCreada = null;

    if (pagoExistente) {
      await prisma.pago.update({
        where: { id: pagoExistente.id },
        data: {
          paymentId: String(paymentId),
          estado: status,
          metodo: paymentData.payment_method_id
        }
      });

      if (status === 'approved' && !pagoExistente.procesado && pagoExistente.suscripcionData) {
        const sd = JSON.parse(pagoExistente.suscripcionData);

        const proxima = new Date();
        const diasF = sd.plan === 'semanal' ? 7 : sd.plan === 'mensual' ? 30 : 15;
        proxima.setDate(proxima.getDate() + diasF);

        try {
          suscripcionCreada = await prisma.suscripcion.create({
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

          await prisma.pago.update({
            where: { id: pagoExistente.id },
            data: { procesado: true }
          });

          logger.info(`[MP Verificar] Suscripción creada para Pago MP: ${paymentId}`);
        } catch (subErr) {
          logger.error('[MP Verificar] Error al crear suscripción', subErr);
        }
      }
    }

    return res.json({
      success: true,
      status,
      monto: paymentData.transaction_amount,
      metodo: paymentData.payment_method_id,
      externalReference: externalRef,
      suscripcionId: suscripcionCreada?.id || null,
      procesado: pagoExistente?.procesado || !!suscripcionCreada
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  crearPreferenciaMercadoPago,
  recibirWebhookMercadoPago,
  verificarPagoMercadoPago
};

