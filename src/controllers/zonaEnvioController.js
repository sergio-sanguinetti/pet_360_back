const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getZonasEnvio = async (req, res) => {
    try {
        const zonas = await prisma.zonaEnvio.findMany({
            orderBy: { distrito: 'asc' }
        });
        res.json({ success: true, data: zonas });
    } catch (error) {
        console.error('Error fetching zonas de envio:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.getZonaEnvioById = async (req, res) => {
    try {
        const { id } = req.params;
        const zona = await prisma.zonaEnvio.findUnique({ where: { id: parseInt(id) } });
        if (!zona) {
            return res.status(404).json({ success: false, message: 'Zona no encontrada' });
        }
        res.json({ success: true, data: zona });
    } catch (error) {
        console.error('Error fetching zona by id:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.createZonaEnvio = async (req, res) => {
    try {
        const { distrito, costo } = req.body;
        const zona = await prisma.zonaEnvio.create({
            data: {
                distrito,
                costo: parseFloat(costo)
            }
        });
        res.status(201).json({ success: true, data: zona, message: 'Zona creada correctamente' });
    } catch (error) {
        console.error('Error creating zona envio:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El distrito ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.updateZonaEnvio = async (req, res) => {
    try {
        const { id } = req.params;
        const { distrito, costo } = req.body;
        const zona = await prisma.zonaEnvio.update({
            where: { id: parseInt(id) },
            data: {
                distrito,
                costo: parseFloat(costo)
            }
        });
        res.json({ success: true, data: zona, message: 'Zona actualizada correctamente' });
    } catch (error) {
        console.error('Error updating zona envio:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El distrito ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.deleteZonaEnvio = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.zonaEnvio.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true, message: 'Zona eliminada correctamente' });
    } catch (error) {
        console.error('Error deleting zona envio:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
