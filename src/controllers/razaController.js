const prisma = require('../config/prisma');

// Listar todas las razas
const listarRazas = async (req, res) => {
    try {
        const razas = await prisma.raza.findMany({
            orderBy: { nombre: 'asc' }
        });
        res.json({ success: true, data: { razas } });
    } catch (error) {
        console.error('Error al listar razas:', error);
        res.status(500).json({ success: false, message: 'Error al listar razas' });
    }
};

// Crear raza
const crearRaza = async (req, res) => {
    try {
        const { nombre, promedioVida, promedioPeso } = req.body;
        const raza = await prisma.raza.create({
            data: { 
                nombre, 
                promedioVida: promedioVida ? parseFloat(promedioVida) : null, 
                promedioPeso: promedioPeso ? parseFloat(promedioPeso) : null 
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
        const { nombre, promedioVida, promedioPeso } = req.body;
        const raza = await prisma.raza.update({
            where: { id: parseInt(id) },
            data: { 
                nombre, 
                promedioVida: promedioVida ? parseFloat(promedioVida) : null, 
                promedioPeso: promedioPeso ? parseFloat(promedioPeso) : null 
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
