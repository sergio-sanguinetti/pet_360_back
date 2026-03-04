const prisma = require('../config/prisma');

// Obtener todos los descuentos
exports.getDescuentos = async (req, res) => {
    try {
        const descuentos = await prisma.descuento.findMany({ orderBy: { id: 'desc' } });
        res.json(descuentos);
    } catch (error) {
        console.error('Error al obtener descuentos:', error);
        res.status(500).json({ success: false, message: 'Obtener descuentos falló' });
    }
};

// Obtener descuento activo por tipo de cliente (para el frontend)
exports.getDescuentoActivo = async (req, res) => {
    try {
        const { tipo } = req.params; // "nuevo_cliente" | "cliente_recurrente"
        const now = new Date();
        const descuento = await prisma.descuento.findFirst({
            where: {
                tipoCliente: tipo,
                activo: true,
                fechaInicio: { lte: now },
                fechaFin: { gte: now }
            }
        });
        res.json({ success: true, data: descuento });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// Obtener un descuento por ID
exports.getDescuentoById = async (req, res) => {
    try {
        const { id } = req.params;
        const descuento = await prisma.descuento.findUnique({ where: { id: parseInt(id) } });
        if (!descuento) return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
        res.json(descuento);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Obtener descuento falló' });
    }
};

// Crear un nuevo descuento
exports.createDescuento = async (req, res) => {
    try {
        const { nombre, fechaInicio, fechaFin, porcentaje, tipoCliente, activo } = req.body;

        if (!nombre || !fechaInicio || !fechaFin || !porcentaje || !tipoCliente) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        // Si se activa este descuento, desactivar el anterior del mismo tipo
        if (activo !== false) {
            await prisma.descuento.updateMany({
                where: { tipoCliente, activo: true },
                data: { activo: false }
            });
        }

        const nuevo = await prisma.descuento.create({
            data: {
                nombre,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                porcentaje: parseFloat(porcentaje),
                tipoCliente: tipoCliente || 'nuevo_cliente',
                activo: activo !== false
            }
        });

        res.status(201).json({ success: true, message: 'Descuento creado exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error al crear descuento:', error);
        res.status(500).json({ success: false, message: 'Error interno al crear descuento' });
    }
};

// Actualizar un descuento
exports.updateDescuento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fechaInicio, fechaFin, porcentaje, tipoCliente, activo } = req.body;

        const existente = await prisma.descuento.findUnique({ where: { id: parseInt(id) } });
        if (!existente) return res.status(404).json({ success: false, message: 'Descuento no encontrado' });

        const nuevoTipo = tipoCliente || existente.tipoCliente;

        // Si se está activando, desactivar los otros del mismo tipo
        if (activo === true) {
            await prisma.descuento.updateMany({
                where: { tipoCliente: nuevoTipo, activo: true, id: { not: parseInt(id) } },
                data: { activo: false }
            });
        }

        const actualizado = await prisma.descuento.update({
            where: { id: parseInt(id) },
            data: {
                nombre: nombre ?? existente.nombre,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : existente.fechaInicio,
                fechaFin: fechaFin ? new Date(fechaFin) : existente.fechaFin,
                porcentaje: porcentaje != null ? parseFloat(porcentaje) : existente.porcentaje,
                tipoCliente: nuevoTipo,
                activo: activo !== undefined ? activo : existente.activo
            }
        });

        res.json({ success: true, message: 'Descuento actualizado', data: actualizado });
    } catch (error) {
        console.error('Error al actualizar descuento:', error);
        res.status(500).json({ success: false, message: 'Error interno al actualizar descuento' });
    }
};

// Eliminar un descuento
exports.deleteDescuento = async (req, res) => {
    try {
        const { id } = req.params;
        const existente = await prisma.descuento.findUnique({ where: { id: parseInt(id) } });
        if (!existente) return res.status(404).json({ success: false, message: 'Descuento no encontrado' });

        await prisma.descuento.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Descuento eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno al eliminar descuento' });
    }
};
