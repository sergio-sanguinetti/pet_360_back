const prisma = require('../config/prisma');

const getVacunas = async (req, res) => {
    try {
        const data = await prisma.vacuna.findMany({ orderBy: { nombre: 'asc' } });
        res.json({ success: true, data: { vacunas: data } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener vacunas' });
    }
};

const createVacuna = async (req, res) => {
    try {
        const { nombre, descripcion, recurrente, frecuencia } = req.body;
        const nueva = await prisma.vacuna.create({
            data: { nombre, descripcion, recurrente: Boolean(recurrente), frecuencia }
        });
        res.status(201).json({ success: true, message: 'Creada exitosamente', data: { vacuna: nueva } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear' });
    }
};

const updateVacuna = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, recurrente, frecuencia } = req.body;
        const mod = await prisma.vacuna.update({
            where: { id: Number(id) },
            data: { nombre, descripcion, recurrente: Boolean(recurrente), frecuencia }
        });
        res.json({ success: true, message: 'Actualizada', data: { vacuna: mod } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
};

const deleteVacuna = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.vacuna.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true, message: 'Eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar' });
    }
};

module.exports = {
    getVacunas,
    createVacuna,
    updateVacuna,
    deleteVacuna
};
