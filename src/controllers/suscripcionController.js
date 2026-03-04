const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSuscripcion = async (req, res) => {
    try {
        const { clienteId, mascotaId, plan, proximaEntrega, montoBase } = req.body;

        const suscripcion = await prisma.suscripcion.create({
            data: {
                clienteId,
                mascotaId,
                plan,
                proximaEntrega: new Date(proximaEntrega),
                montoBase,
                estado: 'activa'
            },
        });

        res.status(201).json({ success: true, data: suscripcion });
    } catch (error) {
        console.error('Error creating suscripcion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getSuscripciones = async (req, res) => {
    try {
        const suscripciones = await prisma.suscripcion.findMany({
            include: {
                cliente: true,
                mascota: true
            },
            orderBy: { proximaEntrega: 'asc' }
        });
        res.json(suscripciones);
    } catch (error) {
        console.error('Error fetching suscripciones:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getSuscripcionById = async (req, res) => {
    try {
        const suscripcion = await prisma.suscripcion.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                cliente: true,
                mascota: true
            }
        });

        if (!suscripcion) return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
        res.json({ success: true, data: suscripcion });
    } catch (error) {
        console.error('Error fetching suscripcion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateSuscripcion = async (req, res) => {
    try {
        const { plan, proximaEntrega, estado, montoBase } = req.body;

        const updateData = { plan, estado, montoBase };
        if (proximaEntrega) {
            updateData.proximaEntrega = new Date(proximaEntrega);
        }

        const suscripcion = await prisma.suscripcion.update({
            where: { id: parseInt(req.params.id) },
            data: updateData,
        });

        res.json({ success: true, data: suscripcion });
    } catch (error) {
        console.error('Error updating suscripcion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteSuscripcion = async (req, res) => {
    try {
        await prisma.suscripcion.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ success: true, message: 'Suscripción eliminada' });
    } catch (error) {
        console.error('Error deleting suscripcion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createSuscripcion,
    getSuscripciones,
    getSuscripcionById,
    updateSuscripcion,
    deleteSuscripcion
};
