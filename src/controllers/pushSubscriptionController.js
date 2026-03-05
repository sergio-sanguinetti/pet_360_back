const prisma = require('../config/prisma');

// GET /api/push/vapid-public-key
exports.getVapidKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// POST /api/push/subscribe
exports.subscribe = async (req, res) => {
    try {
        const { clienteId, subscription } = req.body;
        if (!clienteId || !subscription?.endpoint) {
            return res.status(400).json({ message: 'clienteId y subscription son requeridos' });
        }

        const { endpoint, keys: { p256dh, auth } } = subscription;

        // Upsert by endpoint
        const existing = await prisma.pushSubscription.findFirst({ where: { endpoint } });

        if (existing) {
            await prisma.pushSubscription.update({ where: { id: existing.id }, data: { p256dh, auth, clienteId: parseInt(clienteId) } });
        } else {
            await prisma.pushSubscription.create({ data: { clienteId: parseInt(clienteId), endpoint, p256dh, auth } });
        }

        res.json({ success: true, message: 'Suscripción guardada' });
    } catch (err) {
        res.status(500).json({ message: 'Error guardando suscripción', error: err.message });
    }
};

// DELETE /api/push/unsubscribe
exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        await prisma.pushSubscription.deleteMany({ where: { endpoint } });
        res.json({ success: true, message: 'Suscripción eliminada' });
    } catch (err) {
        res.status(500).json({ message: 'Error eliminando suscripción', error: err.message });
    }
};
