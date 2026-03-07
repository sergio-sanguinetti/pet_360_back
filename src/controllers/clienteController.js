const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// Listar todos los clientes
const listarClientes = async (req, res) => {
    try {
        const { status, query, distrito } = req.query;

        const where = {};

        // Filtrar por status
        if (status && status !== 'todos') {
            where.status = status;
        }

        // Filtrar por query (nombre, email, distrito)
        if (query) {
            where.OR = [
                { nombre: { contains: query } },
                { email: { contains: query } },
                { distrito: { contains: query } }
            ];
        }

        // Filtrar por distrito específico si se requiere
        if (distrito) {
            where.distrito = distrito;
        }

        const clientes = await prisma.cliente.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                distrito: true,
                mascotas: true,
                status: true,
                ultimaCompra: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            data: { clientes },
            total: clientes.length
        });
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear cliente
const crearCliente = async (req, res) => {
    try {
        const { nombre, email, telefono, distrito, status, mascotas, ultimaCompra } = req.body;

        // Validar email único
        const clienteExistente = await prisma.cliente.findUnique({
            where: { email }
        });

        if (clienteExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const nuevoCliente = await prisma.cliente.create({
            data: {
                nombre,
                email,
                telefono,
                distrito,
                status: status || 'activo',
                mascotas: mascotas || 0,
                ultimaCompra: ultimaCompra ? new Date(ultimaCompra) : null
            }
        });

        res.status(201).json({
            success: true,
            data: { cliente: nuevoCliente },
            message: 'Cliente creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener cliente por ID
const obtenerCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await prisma.cliente.findUnique({
            where: { id: parseInt(id) }
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: { cliente }
        });
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar cliente
const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, distrito, status, mascotas, ultimaCompra } = req.body;

        // Verificar si el email pertenece a otro cliente
        if (email) {
            const clienteExistente = await prisma.cliente.findUnique({
                where: { email }
            });
            if (clienteExistente && clienteExistente.id !== parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está en uso por otro cliente'
                });
            }
        }

        const dataUpdate = {
            nombre,
            email,
            telefono,
            distrito,
            status,
            mascotas,
            ...(ultimaCompra !== undefined && { ultimaCompra: ultimaCompra ? new Date(ultimaCompra) : null })
        };

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            dataUpdate.password = await bcrypt.hash(req.body.password, salt);
        }

        const clienteActualizado = await prisma.cliente.update({
            where: { id: parseInt(id) },
            data: dataUpdate
        });

        res.json({
            success: true,
            data: { cliente: clienteActualizado },
            message: 'Cliente actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar cliente (opcional, si se requiere)
const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.cliente.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Completar Wizard
const completarWizard = async (req, res) => {
    try {
        const { clienteId, mascotaData, suscripcionData } = req.body;

        if (!clienteId || !mascotaData || !suscripcionData) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (clienteId, mascotaData o suscripcionData)' });
        }

        // Usar una transacción atómica para asegurar que todas las operaciones se realicen o ninguna
        const resultadoTransaccion = await prisma.$transaction(async (tx) => {
            // 1. Crear Mascota
            const nuevaMascota = await tx.mascota.create({
                data: {
                    nombre: mascotaData.nombre,
                    especie: mascotaData.especie || 'Perro', // default if missing
                    raza: mascotaData.raza,
                    edad: mascotaData.edad,
                    pesoKg: mascotaData.pesoKg ? parseFloat(mascotaData.pesoKg) : null,
                    condicion: mascotaData.condicion,
                    objetivo: mascotaData.objetivo,
                    actividad: mascotaData.actividad,
                    sexo: mascotaData.sexo,
                    castrado: mascotaData.castrado,
                    foto: mascotaData.foto,
                    vacunasMascota: mascotaData.vacunasMascota ? JSON.stringify(mascotaData.vacunasMascota) : null,
                    tratamientosMascota: mascotaData.tratamientosMascota ? JSON.stringify(mascotaData.tratamientosMascota) : null,
                    alergiasMascota: mascotaData.alergiasMascota ? JSON.stringify(mascotaData.alergiasMascota) : null,
                    clienteId: parseInt(clienteId)
                }
            });

            // 2. Crear Suscripción
            const planSeleccionado = suscripcionData.plan || 'mensual';
            const proxima = new Date();
            const diasFrecuencia = planSeleccionado === 'semanal' ? 7 : (planSeleccionado === 'quincenal' ? 15 : 30);
            proxima.setDate(proxima.getDate() + diasFrecuencia);

            const nuevaSuscripcion = await tx.suscripcion.create({
                data: {
                    clienteId: parseInt(clienteId),
                    mascotaId: nuevaMascota.id,
                    plan: planSeleccionado,
                    proximaEntrega: proxima,
                    estado: 'activa',
                    montoBase: parseFloat(suscripcionData.montoBase || 0),
                    recetaNombre: suscripcionData.recetaNombre || null,
                    recetaId: suscripcionData.recetaId != null ? parseInt(suscripcionData.recetaId) : null
                }
            });

            // 3. Actualizar Cliente marcando wizardCompletado y aumentando el contador
            await tx.cliente.update({
                where: { id: parseInt(clienteId) },
                data: {
                    wizardCompletado: true,
                    mascotas: {
                        increment: 1
                    }
                }
            });

            return { mascota: nuevaMascota, suscripcion: nuevaSuscripcion };
        });

        res.json({
            success: true,
            message: 'Wizard completado exitosamente',
            data: resultadoTransaccion
        });
    } catch (error) {
        console.error('Error al completar wizard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar wizard',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Agregar Mascota (para clientes que ya completaron el wizard)
const agregarMascota = async (req, res) => {
    try {
        const { clienteId, mascotaData, suscripcionData } = req.body;

        if (!clienteId || !mascotaData) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (clienteId o mascotaData)' });
        }

        const resultadoTransaccion = await prisma.$transaction(async (tx) => {
            // 1. Crear Mascota
            const nuevaMascota = await tx.mascota.create({
                data: {
                    nombre: mascotaData.nombre,
                    especie: mascotaData.especie || 'Perro',
                    raza: mascotaData.raza,
                    edad: mascotaData.edad,
                    pesoKg: mascotaData.pesoKg ? parseFloat(mascotaData.pesoKg) : null,
                    condicion: mascotaData.condicion,
                    objetivo: mascotaData.objetivo,
                    actividad: mascotaData.actividad,
                    sexo: mascotaData.sexo,
                    castrado: mascotaData.castrado,
                    foto: mascotaData.foto,
                    vacunasMascota: mascotaData.vacunasMascota ? JSON.stringify(mascotaData.vacunasMascota) : null,
                    tratamientosMascota: mascotaData.tratamientosMascota ? JSON.stringify(mascotaData.tratamientosMascota) : null,
                    alergiasMascota: mascotaData.alergiasMascota ? JSON.stringify(mascotaData.alergiasMascota) : null,
                    clienteId: parseInt(clienteId)
                }
            });

            let nuevaSuscripcion = null;
            // 2. Crear Suscripción si se proporcionan datos
            if (suscripcionData) {
                const planSeleccionado = suscripcionData.plan || 'mensual';
                const proxima = new Date();
                const diasFrecuencia = planSeleccionado === 'semanal' ? 7 : (planSeleccionado === 'quincenal' ? 15 : 30);
                proxima.setDate(proxima.getDate() + diasFrecuencia);

                nuevaSuscripcion = await tx.suscripcion.create({
                    data: {
                        clienteId: parseInt(clienteId),
                        mascotaId: nuevaMascota.id,
                        plan: planSeleccionado,
                        proximaEntrega: proxima,
                        estado: 'activa',
                        montoBase: parseFloat(suscripcionData.montoBase || 0),
                        recetaNombre: suscripcionData.recetaNombre || null,
                        recetaId: suscripcionData.recetaId != null ? parseInt(suscripcionData.recetaId) : null
                    }
                });
            }

            // 3. Incrementar el contador de mascotas del cliente
            await tx.cliente.update({
                where: { id: parseInt(clienteId) },
                data: {
                    mascotas: { increment: 1 }
                }
            });

            return { mascota: nuevaMascota, suscripcion: nuevaSuscripcion };
        });

        res.json({
            success: true,
            message: 'Mascota agregada exitosamente',
            data: resultadoTransaccion
        });
    } catch (error) {
        console.error('Error al agregar mascota:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar mascota',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    listarClientes,
    crearCliente,
    obtenerCliente,
    actualizarCliente,
    eliminarCliente,
    completarWizard,
    agregarMascota
};
