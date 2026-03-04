const prisma = require('../config/prisma');

// Obtener todos
exports.getAntipulgas = async (req, res) => {
    try {
        const antipulgas = await prisma.antipulga.findMany();
        res.json(antipulgas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener antipulgas', error: error.message });
    }
};

// Crear uno
exports.createAntipulga = async (req, res) => {
    try {
        const { tipo, nombre, frecuencia, marcas, notificacion } = req.body;
        const nuevo = await prisma.antipulga.create({
            data: {
                tipo,
                nombre,
                frecuencia,
                marcas,
                notificacion
            }
        });
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear antipulga', error: error.message });
    }
};

// Actualizar uno
exports.updateAntipulga = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, nombre, frecuencia, marcas, notificacion } = req.body;

        const updated = await prisma.antipulga.update({
            where: { id: parseInt(id) },
            data: {
                tipo,
                nombre,
                frecuencia,
                marcas,
                notificacion
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar antipulga', error: error.message });
    }
};

// Eliminar uno
exports.deleteAntipulga = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.antipulga.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Antipulga eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar antipulga', error: error.message });
    }
};
