const prisma = require('../config/prisma');
const { procesarNotificaciones } = require('../utils/cronJobs');

// Obtener todas
exports.getNotificaciones = async (req, res) => {
    try {
        const notificaciones = await prisma.notificacion.findMany();
        res.json(notificaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
    }
};

// Crear una
exports.createNotificacion = async (req, res) => {
    try {
        const { nombre, mensaje, vencimiento } = req.body;
        const fechaVencimiento = new Date(vencimiento);

        if (isNaN(fechaVencimiento.getTime())) {
            return res.status(400).json({ message: 'La fecha de vencimiento es inválida' });
        }

        const nueva = await prisma.notificacion.create({
            data: {
                nombre,
                mensaje,
                vencimiento: fechaVencimiento
            }
        });
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear notificacion', error: error.message });
    }
};

// Actualizar una
exports.updateNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, mensaje, vencimiento } = req.body;
        const fechaVencimiento = new Date(vencimiento);

        if (isNaN(fechaVencimiento.getTime())) {
            return res.status(400).json({ message: 'La fecha de vencimiento es inválida' });
        }

        const updated = await prisma.notificacion.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                mensaje,
                vencimiento: fechaVencimiento
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar notificacion', error: error.message });
    }
};

// Eliminar una
exports.deleteNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notificacion.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Notificacion eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar notificacion', error: error.message });
    }
};

// Ejecutar manualmente el proceso de notificaciones de salud (vacunas, antipulgas, etc.)
exports.runSaludAutomatica = async (req, res) => {
    try {
        await procesarNotificaciones(true);
        res.json({ message: 'Proceso de notificaciones de salud ejecutado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al ejecutar el proceso de salud', error: error.message });
    }
};
