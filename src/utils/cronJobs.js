const cron = require('node-cron');
const webpush = require('web-push');
const prisma = require('../config/prisma');
const logger = require('./logger');

// Configurar VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contacto@petlife360.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Envía una notificación push a todas las suscripciones de un cliente.
 */
const sendPushToCliente = async (clienteId, titulo, cuerpo, url = '/panel-usuario') => {
    try {
        const subs = await prisma.pushSubscription.findMany({ where: { clienteId } });
        const payload = JSON.stringify({ title: titulo, body: cuerpo, url });

        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                );
                logger.info(`✅ Push enviado a clienteId=${clienteId}: ${titulo}`);
            } catch (err) {
                // Si el endpoint no es válido, eliminarlo
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    logger.info(`🗑️ Suscripción caducada eliminada (clienteId=${clienteId})`);
                } else {
                    logger.error(`Error enviando push a clienteId=${clienteId}:`, err.message);
                }
            }
        }
    } catch (err) {
        logger.error('Error en sendPushToCliente:', err.message);
    }
};

/**
 * Envía una notificación broadcast a todos los clientes con suscripción push.
 */
const sendBroadcastPush = async (titulo, cuerpo) => {
    try {
        const allSubs = await prisma.pushSubscription.findMany();
        const payload = JSON.stringify({ title: titulo, body: cuerpo, url: '/panel-usuario' });

        for (const sub of allSubs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                );
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                }
            }
        }
        logger.info(`📢 Broadcast push enviado: ${titulo}`);
    } catch (err) {
        logger.error('Error en sendBroadcastPush:', err.message);
    }
};

/**
 * Proceso principal de revisión y envío de notificaciones.
 * Se ejecuta diariamente entre 11am y 1pm (programado a las 12:00).
 */
const procesarNotificaciones = async () => {
    logger.info('⏰ Ejecutando revisión de notificaciones automáticas...');
    try {
        const hoy = new Date();

        // --- 1. Notificaciones globales del panel admin ---
        const globales = await prisma.notificacion.findMany({
            where: { vencimiento: { gte: hoy } }
        });
        for (const n of globales) {
            await sendBroadcastPush(n.nombre, n.mensaje);
        }

        // --- 2. Suscripciones por vencer o vencidas ---
        const suscripciones = await prisma.suscripcion.findMany({
            where: { estado: 'activa' },
            include: { mascota: true }
        });

        for (const sus of suscripciones) {
            const diasFaltantes = Math.ceil(
                (new Date(sus.proximaEntrega).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diasFaltantes === 2) {
                await sendPushToCliente(
                    sus.clienteId,
                    '⏳ Suscripción por vencer',
                    `Tu plan ${sus.plan} para ${sus.mascota?.nombre || 'tu mascota'} vence en 2 días.`,
                    '/panel-usuario'
                );
            } else if (diasFaltantes <= 0) {
                await sendPushToCliente(
                    sus.clienteId,
                    '🔴 Suscripción vencida',
                    `El plan de ${sus.mascota?.nombre || 'tu mascota'} ya venció. ¡Renueva para que no se quede sin alimento!`,
                    '/carrito'
                );
            }
        }

        // --- 3. Vacunas y antiparasitarios por mascota ---
        const mascotas = await prisma.mascota.findMany({
            where: {
                OR: [
                    { vacunasMascota: { not: null } },
                    { tratamientosMascota: { not: null } }
                ]
            }
        });

        const catalogVacunas = await prisma.vacuna.findMany();
        const catalogAntipulgas = await prisma.antipulga.findMany();

        for (const m of mascotas) {
            // Vacunas recurrentes
            if (m.vacunasMascota) {
                try {
                    const vacunasAplicadas = JSON.parse(m.vacunasMascota);
                    if (Array.isArray(vacunasAplicadas)) {
                        for (const VA of vacunasAplicadas) {
                            const cat = catalogVacunas.find(v => v.nombre === VA.nombre);
                            if (cat && cat.recurrente && VA.fecha) {
                                let diasSumar = 0;
                                const freq = (cat.frecuencia || '').toLowerCase();
                                if (freq.includes('anual')) diasSumar = 365;
                                else if (freq.includes('semestral')) diasSumar = 180;
                                else if (freq.includes('trimestral')) diasSumar = 90;
                                else if (freq.includes('mensual') || freq.includes('mes')) diasSumar = 30;

                                if (diasSumar > 0) {
                                    const proxVacuna = new Date(VA.fecha);
                                    proxVacuna.setDate(proxVacuna.getDate() + diasSumar);
                                    const dias = Math.ceil((proxVacuna.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

                                    if (dias === 2) {
                                        await sendPushToCliente(m.clienteId, '💉 Vacuna próxima', `La vacuna ${cat.nombre} de ${m.nombre} le toca en 2 días.`, '/salud-mis-mascotas');
                                    } else if (dias <= 0 && dias > -30) {
                                        await sendPushToCliente(m.clienteId, '⚠️ Vacuna vencida', `La vacuna ${cat.nombre} de ${m.nombre} venció. ¡Agenda una cita!`, '/salud-mis-mascotas');
                                    }
                                }
                            }
                        }
                    }
                } catch (e) { }
            }

            // Antipulgas y desparasitación
            if (m.tratamientosMascota) {
                try {
                    const trat = JSON.parse(m.tratamientosMascota);

                    // Antipulgas
                    if (trat.antipulgas && trat.fechaAntipulga) {
                        const catA = catalogAntipulgas.find(a => a.nombre === trat.antipulgas);
                        if (catA) {
                            let d = 30;
                            if (catA.frecuencia.includes('90')) d = 90;
                            else if (catA.frecuencia.includes('60')) d = 60;

                            const fProx = new Date(trat.fechaAntipulga);
                            fProx.setDate(fProx.getDate() + d);
                            const diasA = Math.ceil((fProx.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

                            if (diasA === 2) {
                                await sendPushToCliente(m.clienteId, '🐛 Antipulgas', `A ${m.nombre} le toca su antipulgas en 2 días.`, '/salud-mis-mascotas');
                            } else if (diasA <= 0) {
                                await sendPushToCliente(m.clienteId, '⚠️ Antipulgas vencido', `¡${m.nombre} ya debe recibir su tratamiento antipulgas!`, '/salud-mis-mascotas');
                            }
                        }
                    }

                    // Desparasitación interna
                    if (trat.desparasitacionInterna && trat.fechaDesparasitacion) {
                        const freq = trat.desparasitacionInterna.toLowerCase();
                        let dI = 0;
                        if (freq.includes('trimestral')) dI = 90;
                        else if (freq.includes('semestral')) dI = 180;
                        else if (freq.includes('mensual')) dI = 30;

                        if (dI > 0) {
                            const fInt = new Date(trat.fechaDesparasitacion);
                            fInt.setDate(fInt.getDate() + dI);
                            const diasI = Math.ceil((fInt.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

                            if (diasI === 2) {
                                await sendPushToCliente(m.clienteId, '💊 Desparasitación', `${m.nombre} necesita desparasitación interna en 2 días.`, '/salud-mis-mascotas');
                            } else if (diasI <= 0) {
                                await sendPushToCliente(m.clienteId, '⚠️ Desparasitación vencida', `¡Ya es tiempo de desparasitar internamente a ${m.nombre}!`, '/salud-mis-mascotas');
                            }
                        }
                    }
                } catch (e) { }
            }
        }

        logger.info('✅ Revisión de notificaciones completada.');
    } catch (err) {
        logger.error('Error procesando notificaciones:', err);
    }
};

const initCronJobs = () => {
    logger.info('⏳ Registrando Cron Jobs del sistema...');

    // Cada día a las 12:00 PM (hora local del servidor)
    cron.schedule('0 12 * * *', () => {
        procesarNotificaciones();
    }, { timezone: 'America/Lima' });

    logger.info('✅ Cron Job de notificaciones registrado (diario 12:00 PM hora Lima).');
};

module.exports = { initCronJobs };
