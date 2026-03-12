const prisma = require('../config/prisma');

// Listar todas las razas (solo campos necesarios para evitar payload grande y problemas de serialización)
const listarRazas = async (req, res) => {
    try {
        const razas = await prisma.raza.findMany({
            select: {
                id: true,
                nombre: true,
                promedioVida: true,
                promedioPeso: true,
                categoria: true,
                umbralMadurez: true
            },
            orderBy: { nombre: 'asc' }
        });
        res.json({ success: true, data: { razas } });
    } catch (error) {
        console.error('Error al listar razas:', error);
        const message = process.env.NODE_ENV === 'production'
            ? 'Error al listar razas'
            : (error.message || 'Error al listar razas');
        res.status(500).json({ success: false, message });
    }
};

// Crear raza
const crearRaza = async (req, res) => {
    try {
        const { nombre, promedioVida, promedioPeso, categoria, umbralMadurez } = req.body;
        const raza = await prisma.raza.create({
            data: {
                nombre,
                promedioVida: promedioVida ? parseFloat(promedioVida) : null,
                promedioPeso: promedioPeso ? parseFloat(promedioPeso) : null,
                categoria: categoria || null,
                umbralMadurez: umbralMadurez ? parseFloat(umbralMadurez) : null
            }
        });
        res.status(201).json({ success: true, data: { raza }, message: 'Raza creada' });
    } catch (error) {
        console.error('Error al crear raza:', error);
        res.status(500).json({ success: false, message: 'Error al crear raza' });
    }
};

// Actualizar raza
const actualizarRaza = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, promedioVida, promedioPeso, categoria, umbralMadurez } = req.body;
        const raza = await prisma.raza.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                promedioVida: promedioVida ? parseFloat(promedioVida) : null,
                promedioPeso: promedioPeso ? parseFloat(promedioPeso) : null,
                categoria: categoria || null,
                umbralMadurez: umbralMadurez ? parseFloat(umbralMadurez) : null
            }
        });
        res.json({ success: true, data: { raza }, message: 'Raza actualizada' });
    } catch (error) {
        console.error('Error al actualizar raza:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar raza' });
    }
};

// Eliminar raza
const eliminarRaza = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.raza.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Raza eliminada' });
    } catch (error) {
        console.error('Error al eliminar raza:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar raza' });
    }
};

module.exports = { listarRazas, crearRaza, actualizarRaza, eliminarRaza };
