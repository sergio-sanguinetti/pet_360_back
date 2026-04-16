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

/**
 * Pedidos para panel admin: suscripciones + pagos MP aún no procesados (checkout iniciado o pago sin suscripción aún).
 */
const getPedidosOperaciones = async (req, res) => {
    try {
        const rol = req.user?.rol;
        if (rol !== 'administrador' && rol !== 'vendedor') {
            return res.status(403).json({ success: false, message: 'Sin permiso para esta operación' });
        }

        const [suscripciones, pagosPendientes] = await Promise.all([
            prisma.suscripcion.findMany({
                include: { cliente: true, mascota: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.pago.findMany({
                where: {
                    procesado: false,
                    suscripcionData: { not: null },
                    estado: 'approved'
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const clienteIds = [...new Set(pagosPendientes.map((p) => p.clienteId).filter(Boolean))];
        const mascotaIds = [...new Set(pagosPendientes.map((p) => p.mascotaId).filter(Boolean))];
        const [clientes, mascotas] = await Promise.all([
            clienteIds.length ? prisma.cliente.findMany({ where: { id: { in: clienteIds } } }) : [],
            mascotaIds.length ? prisma.mascota.findMany({ where: { id: { in: mascotaIds } } }) : []
        ]);
        const clienteById = Object.fromEntries(clientes.map((c) => [c.id, c]));
        const mascotaById = Object.fromEntries(mascotas.map((m) => [m.id, m]));

        const mappedPagos = pagosPendientes.map((p) => {
            let sd = {};
            try {
                sd = JSON.parse(p.suscripcionData);
            } catch {
                sd = {};
            }
            const c = p.clienteId ? clienteById[p.clienteId] : null;
            const m = p.mascotaId ? mascotaById[p.mascotaId] : null;
            return {
                _source: 'pago',
                pagoId: p.id,
                pagoEstado: p.estado,
                preferenceId: p.preferenceId,
                clienteId: p.clienteId,
                mascotaId: p.mascotaId,
                plan: sd.plan || 'quincenal',
                proximaEntrega: sd.fechaEntregaProgramada ? new Date(sd.fechaEntregaProgramada) : (p.createdAt || new Date()),
                estado: p.estado === 'approved' ? 'post_pago' : 'esperando_pago',
                montoBase: p.monto,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                recetaNombre: sd.recetaNombre || null,
                recetaId: sd.recetaId != null ? parseInt(sd.recetaId, 10) : null,
                cantidadBolsas: sd.cantidadBolsas != null ? parseInt(sd.cantidadBolsas, 10) : 1,
                gramosPorBolsa: sd.gramosPorBolsa != null ? parseInt(sd.gramosPorBolsa, 10) : 0,
                resumenBolsas: sd.resumenBolsas || null,
                estadoPedido: 'pendiente',
                direccionEnvio: sd.direccionEnvio || null,
                distritoEnvio: sd.distritoEnvio || null,
                horarioEntrega: sd.horarioEntrega || null,
                cliente: c,
                mascota: m
            };
        });

        const subsMarcados = suscripciones.map((s) => ({ ...s, _source: 'suscripcion' }));
        const merged = [...mappedPagos, ...subsMarcados].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        res.json(merged);
    } catch (error) {
        console.error('Error getPedidosOperaciones:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getSuscripciones = async (req, res) => {
    try {
        const { mascotaId, clienteId } = req.query;
        const where = {};
        if (mascotaId !== undefined && mascotaId !== '') {
            where.mascotaId = parseInt(mascotaId);
        }
        if (clienteId !== undefined && clienteId !== '') {
            where.clienteId = parseInt(clienteId);
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
    getPedidosOperaciones,
    getSuscripciones,
    getSuscripcionById,
    updateSuscripcion,
    deleteSuscripcion
};
