const prisma = require('../config/prisma');

// GET /api/recomendaciones
exports.getRecomendaciones = async (req, res) => {
    try {
        const { activo } = req.query;
        const where = activo === 'true' ? { activo: true } : {};
        const data = await prisma.recomendacion.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener recomendaciones', error: error.message });
    }
};

// POST /api/recomendaciones
exports.createRecomendacion = async (req, res) => {
    try {
        const { titulo, descripcion, categoria, icono, activo } = req.body;
        if (!titulo || !descripcion) {
            return res.status(400).json({ message: 'Título y descripción son requeridos' });
        }
        const nueva = await prisma.recomendacion.create({
            data: { titulo, descripcion, categoria: categoria || 'General', icono: icono || 'star', activo: activo !== undefined ? activo : true }
        });
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear recomendación', error: error.message });
    }
};

// PUT /api/recomendaciones/:id
exports.updateRecomendacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, categoria, icono, activo } = req.body;
        const updated = await prisma.recomendacion.update({
            where: { id: parseInt(id) },
            data: { titulo, descripcion, categoria, icono, activo }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar recomendación', error: error.message });
    }
};

// DELETE /api/recomendaciones/:id
exports.deleteRecomendacion = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.recomendacion.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Recomendación eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar recomendación', error: error.message });
    }
};
