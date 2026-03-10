const prisma = require('../config/prisma');

// Listar todas las mascotas
const listarMascotas = async (req, res) => {
    try {
        const { especie, query, clienteId } = req.query;

        const where = {};

        // Filtrar por especie
        if (especie && especie !== 'todos') {
            where.especie = especie;
        }

        // Filtrar por cliente
        if (clienteId) {
            where.clienteId = parseInt(clienteId);
        }

        // Filtrar por query (nombre mascota, nombre cliente)
        if (query) {
            where.OR = [
                { nombre: { contains: query } },
                { raza: { contains: query } },
                {
                    cliente: {
                        nombre: { contains: query }
                    }
                }
            ];
        }

        const mascotas = await prisma.mascota.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true
                    }
                },
                historialPesos: {
                    orderBy: { fecha: 'asc' }
                },
                suscripciones: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        res.json({
            success: true,
            data: { mascotas },
            total: mascotas.length
        });
    } catch (error) {
        console.error('Error al listar mascotas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mascotas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear mascota
const crearMascota = async (req, res) => {
    try {
        const { nombre, especie, raza, edad, pesoKg, clienteId, vacunasAlDia, ultimaRevision, proximaDosis, objetivo, vacunasMascota, tratamientosMascota, alergiasMascota } = req.body;

        // Verificar que el cliente exista
        const cliente = await prisma.cliente.findUnique({
            where: { id: parseInt(clienteId) }
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        const nuevaMascota = await prisma.mascota.create({
            data: {
                nombre,
                especie,
                raza,
                edad,
                pesoKg: pesoKg ? parseFloat(pesoKg) : null,
                clienteId: parseInt(clienteId),
                vacunasAlDia: vacunasAlDia || false,
                ultimaRevision: ultimaRevision || '—',
                proximaDosis: proximaDosis || '—',
                objetivo: objetivo || 'Normal',
                vacunasMascota: vacunasMascota ? (typeof vacunasMascota === 'string' ? vacunasMascota : JSON.stringify(vacunasMascota)) : null,
                tratamientosMascota: tratamientosMascota ? (typeof tratamientosMascota === 'string' ? tratamientosMascota : JSON.stringify(tratamientosMascota)) : null,
                alergiasMascota: alergiasMascota ? (typeof alergiasMascota === 'string' ? alergiasMascota : JSON.stringify(alergiasMascota)) : null
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            }
        });

        // Si se registró un peso inicial, crear el primer registro en el historial
        if (pesoKg) {
            await prisma.historialPeso.create({
                data: {
                    mascotaId: nuevaMascota.id,
                    pesoKg: parseFloat(pesoKg),
                    nota: 'Peso inicial al registro'
                }
            });
        }

        // Actualizar contador de mascotas en cliente
        await prisma.cliente.update({
            where: { id: parseInt(clienteId) },
            data: {
                mascotas: {
                    increment: 1
                }
            }
        });

        res.status(201).json({
            success: true,
            data: { mascota: nuevaMascota },
            message: 'Mascota creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear mascota',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener mascota por ID
const obtenerMascota = async (req, res) => {
    try {
        const { id } = req.params;

        const mascota = await prisma.mascota.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true
                    }
                },
                historialPesos: {
                    orderBy: {
                        fecha: 'desc'
                    }
                },
                suscripciones: {
                    where: { estado: 'activa' },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        if (!mascota) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            });
        }

        res.json({
            success: true,
            data: { mascota }
        });
    } catch (error) {
        console.error('Error al obtener mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mascota',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar mascota
const actualizarMascota = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, especie, raza, edad, pesoKg, clienteId, vacunasAlDia, ultimaRevision, proximaDosis, objetivo, vacunasMascota, tratamientosMascota, alergiasMascota } = req.body;

        // Verificar si cambia de cliente para actualizar contadores (opcional, avanzado)
        // Por simplicidad, asumimos que no cambia de cliente frecuentemente o no manejamos el contador en update complejo ahora

        // Si cambia clienteId, verificar que el nuevo cliente exista
        if (clienteId) {
            const clienteExists = await prisma.cliente.findUnique({ where: { id: parseInt(clienteId) } });
            if (!clienteExists) {
                return res.status(404).json({ success: false, message: 'Nuevo cliente no encontrado' });
            }
        }

        const mascotaActualizada = await prisma.mascota.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                especie,
                raza,
                sexo: req.body.sexo,
                castrado: req.body.castrado !== undefined ? req.body.castrado : undefined,
                actividad: req.body.actividad,
                edad,
                pesoKg: pesoKg !== undefined ? parseFloat(pesoKg) : undefined,
                condicion: req.body.condicion,
                ...(clienteId && { clienteId: parseInt(clienteId) }),
                vacunasAlDia: vacunasAlDia !== undefined ? vacunasAlDia : undefined,
                ultimaRevision,
                proximaDosis,
                objetivo,
                ...(req.body.foto !== undefined && { foto: req.body.foto }),
                ...(vacunasMascota !== undefined && { vacunasMascota: typeof vacunasMascota === 'string' ? vacunasMascota : JSON.stringify(vacunasMascota) }),
                ...(tratamientosMascota !== undefined && { tratamientosMascota: typeof tratamientosMascota === 'string' ? tratamientosMascota : JSON.stringify(tratamientosMascota) }),
                ...(alergiasMascota !== undefined && { alergiasMascota: typeof alergiasMascota === 'string' ? alergiasMascota : JSON.stringify(alergiasMascota) })
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: { mascota: mascotaActualizada },
            message: 'Mascota actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar mascota',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar mascota
const eliminarMascota = async (req, res) => {
    try {
        const { id } = req.params;

        const mascota = await prisma.mascota.findUnique({ where: { id: parseInt(id) } });

        if (!mascota) {
            return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
        }

        await prisma.mascota.delete({
            where: { id: parseInt(id) }
        });

        // Decrementar contador en cliente
        await prisma.cliente.update({
            where: { id: mascota.clienteId },
            data: { mascotas: { decrement: 1 } }
        });

        res.json({
            success: true,
            message: 'Mascota eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar mascota',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Historial de peso
const registrarPeso = async (req, res) => {
    try {
        const { id } = req.params;
        const { pesoKg, nota } = req.body;

        const mascotaId = parseInt(id);

        const nuevoPeso = await prisma.historialPeso.create({
            data: {
                mascotaId,
                pesoKg: parseFloat(pesoKg),
                nota
            }
        });

        // Actualizar el peso actual en la mascota
        await prisma.mascota.update({
            where: { id: mascotaId },
            data: { pesoKg: parseFloat(pesoKg) }
        });

        res.status(201).json({
            success: true,
            data: { peso: nuevoPeso },
            message: 'Peso registrado exitosamente'
        });
    } catch (error) {
        console.error('Error al registrar peso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar peso',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const obtenerHistorialPeso = async (req, res) => {
    try {
        const { id } = req.params;

        const historial = await prisma.historialPeso.findMany({
            where: { mascotaId: parseInt(id) },
            orderBy: { fecha: 'asc' }
        });

        res.json({
            success: true,
            data: { historial }
        });
    } catch (error) {
        console.error('Error al obtener historial de peso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de peso',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    listarMascotas,
    crearMascota,
    obtenerMascota,
    actualizarMascota,
    eliminarMascota,
    registrarPeso,
    obtenerHistorialPeso
};
