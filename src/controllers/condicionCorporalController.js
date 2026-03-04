const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCondiciones = async (req, res) => {
    try {
        const condiciones = await prisma.condicionCorporal.findMany({ orderBy: { id: 'asc' } });
        res.json({ success: true, data: condiciones });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.getCondicionById = async (req, res) => {
    try {
        const { id } = req.params;
        const condicion = await prisma.condicionCorporal.findUnique({ where: { id: parseInt(id) } });
        if (!condicion) return res.status(404).json({ success: false, message: 'Condición no encontrada' });
        res.json({ success: true, data: condicion });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.createCondicion = async (req, res) => {
    try {
        const { nombre, descripcion, mensaje } = req.body;
        const condicion = await prisma.condicionCorporal.create({ data: { nombre, descripcion, mensaje } });
        res.status(201).json({ success: true, data: condicion, message: 'Condición creada correctamente' });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Esta condición ya existe' });
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.updateCondicion = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, mensaje } = req.body;
        const condicion = await prisma.condicionCorporal.update({
            where: { id: parseInt(id) },
            data: { nombre, descripcion, mensaje }
        });
        res.json({ success: true, data: condicion, message: 'Condición actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.deleteCondicion = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.condicionCorporal.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Condición eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
