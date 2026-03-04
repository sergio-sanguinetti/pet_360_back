const prisma = require('../config/prisma');

// Obtener todos los descuentos
exports.getDescuentos = async (req, res) => {
    try {
        const descuentos = await prisma.descuento.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(descuentos);
    } catch (error) {
        console.error('Error al obtener descuentos:', error);
        res.status(500).json({ success: false, message: 'Obtener descuentos falló' });
    }
};

// Obtener un descuento por ID
exports.getDescuentoById = async (req, res) => {
    try {
        const { id } = req.params;
        const descuento = await prisma.descuento.findUnique({
            where: { id: parseInt(id) }
        });

        if (!descuento) {
            return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
        }

        res.json(descuento);
    } catch (error) {
        console.error('Error al obtener descuento:', error);
        res.status(500).json({ success: false, message: 'Obtener descuento falló' });
    }
};

// Crear un nuevo descuento
exports.createDescuento = async (req, res) => {
    try {
        const { nombre, fechaInicio, fechaFin, porcentaje } = req.body;

        // Validación básica
        if (!nombre || !fechaInicio || !fechaFin || !porcentaje) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const nuevoDescuento = await prisma.descuento.create({
            data: {
                nombre,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                porcentaje: parseFloat(porcentaje)
            }
        });

        res.status(201).json({ success: true, message: 'Descuento creado exitosamente', data: nuevoDescuento });
    } catch (error) {
        console.error('Error al crear descuento:', error);
        res.status(500).json({ success: false, message: 'Error interno al crear descuento' });
    }
};

// Actualizar un descuento
exports.updateDescuento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fechaInicio, fechaFin, porcentaje } = req.body;

        // Verificar que exista
        const descuentoExistente = await prisma.descuento.findUnique({
            where: { id: parseInt(id) }
        });

        if (!descuentoExistente) {
            return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
        }

        const descuentoActualizado = await prisma.descuento.update({
            where: { id: parseInt(id) },
            data: {
                nombre: nombre || descuentoExistente.nombre,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : descuentoExistente.fechaInicio,
                fechaFin: fechaFin ? new Date(fechaFin) : descuentoExistente.fechaFin,
                porcentaje: porcentaje ? parseFloat(porcentaje) : descuentoExistente.porcentaje
            }
        });

        res.json({ success: true, message: 'Descuento actualizado', data: descuentoActualizado });
    } catch (error) {
        console.error('Error al actualizar descuento:', error);
        res.status(500).json({ success: false, message: 'Error interno al actualizar descuento' });
    }
};

// Eliminar un descuento
exports.deleteDescuento = async (req, res) => {
    try {
        const { id } = req.params;

        const descuentoExistente = await prisma.descuento.findUnique({
            where: { id: parseInt(id) }
        });

        if (!descuentoExistente) {
            return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
        }

        await prisma.descuento.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Descuento eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar descuento:', error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar descuento' });
    }
};
