const prisma = require('../config/prisma');

// Obtener todas
exports.getAlergias = async (req, res) => {
    try {
        const alergias = await prisma.alergia.findMany();
        res.json(alergias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener alergias', error: error.message });
    }
};

// Crear una
exports.createAlergia = async (req, res) => {
    try {
        const { alergia, descripcion } = req.body;

        if (!alergia || !descripcion) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const nueva = await prisma.alergia.create({
            data: {
                alergia,
                descripcion
            }
        });
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la alergia', error: error.message });
    }
};

// Actualizar una
exports.updateAlergia = async (req, res) => {
    try {
        const { id } = req.params;
        const { alergia, descripcion } = req.body;

        if (!alergia || !descripcion) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const updated = await prisma.alergia.update({
            where: { id: parseInt(id) },
            data: {
                alergia,
                descripcion
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar alergia', error: error.message });
    }
};

// Eliminar una
exports.deleteAlergia = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.alergia.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Alergia eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar alergia', error: error.message });
    }
};
