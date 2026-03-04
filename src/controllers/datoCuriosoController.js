const prisma = require('../config/prisma');

// Obtener todos los datos curiosos
exports.getDatosCuriosos = async (req, res) => {
    try {
        const datosCuriosos = await prisma.datoCurioso.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(datosCuriosos);
    } catch (error) {
        console.error('Error al obtener datos curiosos:', error);
        res.status(500).json({ success: false, message: 'Obtener datos curiosos falló' });
    }
};

// Obtener un dato curioso por ID
exports.getDatoCuriosoById = async (req, res) => {
    try {
        const { id } = req.params;
        const datoCurioso = await prisma.datoCurioso.findUnique({
            where: { id: parseInt(id) }
        });

        if (!datoCurioso) {
            return res.status(404).json({ success: false, message: 'Dato curioso no encontrado' });
        }

        res.json(datoCurioso);
    } catch (error) {
        console.error('Error al obtener dato curioso:', error);
        res.status(500).json({ success: false, message: 'Obtener dato curioso falló' });
    }
};

// Crear un nuevo dato curioso
exports.createDatoCurioso = async (req, res) => {
    try {
        const { datoCurioso, activo } = req.body;

        // Validación básica
        if (!datoCurioso) {
            return res.status(400).json({ success: false, message: 'El campo dato curioso es obligatorio' });
        }

        const nuevoDatoCurioso = await prisma.datoCurioso.create({
            data: {
                datoCurioso,
                activo: activo !== undefined ? activo : true
            }
        });

        res.status(201).json({ success: true, message: 'Dato curioso creado exitosamente', data: nuevoDatoCurioso });
    } catch (error) {
        console.error('Error al crear dato curioso:', error);
        res.status(500).json({ success: false, message: 'Error interno al crear dato curioso' });
    }
};

// Actualizar un dato curioso
exports.updateDatoCurioso = async (req, res) => {
    try {
        const { id } = req.params;
        const { datoCurioso, activo } = req.body;

        // Verificar que exista
        const datoCuriosoExistente = await prisma.datoCurioso.findUnique({
            where: { id: parseInt(id) }
        });

        if (!datoCuriosoExistente) {
            return res.status(404).json({ success: false, message: 'Dato curioso no encontrado' });
        }

        const datoCuriosoActualizado = await prisma.datoCurioso.update({
            where: { id: parseInt(id) },
            data: {
                datoCurioso: datoCurioso || datoCuriosoExistente.datoCurioso,
                activo: activo !== undefined ? activo : datoCuriosoExistente.activo
            }
        });

        res.json({ success: true, message: 'Dato curioso actualizado', data: datoCuriosoActualizado });
    } catch (error) {
        console.error('Error al actualizar dato curioso:', error);
        res.status(500).json({ success: false, message: 'Error interno al actualizar dato curioso' });
    }
};

// Eliminar un dato curioso
exports.deleteDatoCurioso = async (req, res) => {
    try {
        const { id } = req.params;

        const datoCuriosoExistente = await prisma.datoCurioso.findUnique({
            where: { id: parseInt(id) }
        });

        if (!datoCuriosoExistente) {
            return res.status(404).json({ success: false, message: 'Dato curioso no encontrado' });
        }

        await prisma.datoCurioso.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Dato curioso eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar dato curioso:', error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar dato curioso' });
    }
};
