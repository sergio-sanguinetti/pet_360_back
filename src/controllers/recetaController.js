const prisma = require('../config/prisma');

// Obtener todas las recetas
exports.getRecetas = async (req, res) => {
    try {
        const recetas = await prisma.receta.findMany({
            include: { ingredientes: true, precios: true }
        });
        res.json(recetas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener recetas', error: error.message });
    }
};

// Crear una receta
exports.createReceta = async (req, res) => {
    try {
        const { nombre, precio, ingredientes, precios } = req.body;
        const nuevaReceta = await prisma.receta.create({
            data: {
                nombre,
                precio,
                ingredientes: {
                    create: ingredientes
                },
                ...(precios && {
                    precios: {
                        create: precios
                    }
                })
            },
            include: { ingredientes: true, precios: true }
        });
        res.status(201).json(nuevaReceta);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear receta', error: error.message });
    }
};

// Actualizar receta
exports.updateReceta = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, ingredientes, precios } = req.body;

        const updated = await prisma.receta.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                precio,
                ...(ingredientes && {
                    ingredientes: {
                        deleteMany: {},
                        create: ingredientes
                    }
                }),
                ...(precios && {
                    precios: {
                        deleteMany: {},
                        create: precios
                    }
                })
            },
            include: { ingredientes: true, precios: true }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar receta', error: error.message });
    }
};

// Actualizar solo los precios de una receta
exports.updateRecetaPrecios = async (req, res) => {
    try {
        const { id } = req.params;
        const { precios } = req.body; // array de precios

        const updated = await prisma.receta.update({
            where: { id: parseInt(id) },
            data: {
                precios: {
                    deleteMany: {},
                    create: precios
                }
            },
            include: { ingredientes: true, precios: true }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar precios', error: error.message });
    }
};

// Eliminar receta
exports.deleteReceta = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.receta.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Receta eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar receta', error: error.message });
    }
};
