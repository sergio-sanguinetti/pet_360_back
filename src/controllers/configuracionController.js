const prisma = require('../config/prisma');

// Obtener configuración (siempre ID 1)
const obtenerConfiguracion = async (req, res) => {
    try {
        let config = await prisma.configuracion.findFirst();

        if (!config) {
            // Crear configuración por defecto si no existe
            config = await prisma.configuracion.create({
                data: {
                    razonSocial: 'PetLife 360 E.I.R.L.',
                    nombreComercial: 'PetLife 360',
                    ruc: '20123456789',
                    serieBoleta: 'B001',
                    numeroSiguiente: 1
                }
            });
        }

        res.json({
            success: true,
            data: { configuracion: config }
        });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar configuración
const actualizarConfiguracion = async (req, res) => {
    try {
        const {
            razonSocial, nombreComercial, ruc, direccionFiscal, departamento, telefono, email,
            serieBoleta, numeroSiguiente, encabezadoBoleta, direccionBoleta, leyendaSunat, piePagina,
            landingBannerUrl, landingBannerActivo
        } = req.body;

        let config = await prisma.configuracion.findFirst();

        if (!config) {
            // Si no existe, crearla primero (aunque obtenerConfiguracion debería haberlo hecho, es seguro)
            config = await prisma.configuracion.create({
                data: {
                    razonSocial: razonSocial || 'PetLife 360 E.I.R.L.'
                }
            });
        }

        const configActualizada = await prisma.configuracion.update({
            where: { id: config.id },
            data: {
                razonSocial,
                nombreComercial,
                ruc,
                direccionFiscal,
                departamento,
                telefono,
                email,
                serieBoleta,
                numeroSiguiente: numeroSiguiente ? parseInt(numeroSiguiente) : undefined,
                encabezadoBoleta,
                direccionBoleta,
                leyendaSunat,
                piePagina,
                landingBannerUrl,
                landingBannerActivo: landingBannerActivo !== undefined ? (landingBannerActivo === 'true' || landingBannerActivo === true) : undefined
            }
        });

        res.json({
            success: true,
            data: { configuracion: configActualizada },
            message: 'Configuración actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion
};
