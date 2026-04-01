const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSuscripcion = async (req, res) => {
    try {
        const { clienteId, mascotaId, plan, proximaEntrega, montoBase, recetaNombre, recetaId, cantidadBolsas, gramosPorBolsa, resumenBolsas, estadoPedido } = req.body;

        const suscripcion = await prisma.suscripcion.create({
            data: {
                clienteId,
                mascotaId,
                plan,
                proximaEntrega: new Date(proximaEntrega),
                montoBase,
                recetaNombre: recetaNombre || null,
                recetaId: recetaId != null ? parseInt(recetaId) : null,
                cantidadBolsas: cantidadBolsas != null ? parseInt(cantidadBolsas) : 1,
                gramosPorBolsa: gramosPorBolsa != null ? parseInt(gramosPorBolsa) : 0,
                resumenBolsas: resumenBolsas || null,
                estadoPedido: estadoPedido || 'pendiente',
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
        const { mascotaId } = req.query;
        const where = {};
        if (mascotaId !== undefined && mascotaId !== '') {
            where.mascotaId = parseInt(mascotaId);
        }
        const suscripciones = await prisma.suscripcion.findMany({
            where,
            include: {
                cliente: true,
                mascota: true
            },
            orderBy: { createdAt: 'desc' }
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
        const { plan, proximaEntrega, estado, montoBase, recetaNombre, recetaId, cantidadBolsas, gramosPorBolsa, resumenBolsas, estadoPedido } = req.body;

        const updateData = {};
        if (plan) updateData.plan = plan;
        if (estado) updateData.estado = estado;
        if (montoBase !== undefined) updateData.montoBase = montoBase;
        
        if (recetaNombre !== undefined) updateData.recetaNombre = recetaNombre || null;
        if (recetaId !== undefined) updateData.recetaId = recetaId != null ? parseInt(recetaId) : null;
        if (proximaEntrega) {
            updateData.proximaEntrega = new Date(proximaEntrega);
        }

        if (cantidadBolsas !== undefined) updateData.cantidadBolsas = parseInt(cantidadBolsas);
        if (gramosPorBolsa !== undefined) updateData.gramosPorBolsa = parseInt(gramosPorBolsa);
        if (resumenBolsas !== undefined) updateData.resumenBolsas = resumenBolsas;
        if (estadoPedido !== undefined) updateData.estadoPedido = estadoPedido;

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
