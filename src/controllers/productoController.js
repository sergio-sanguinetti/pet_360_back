const prisma = require('../config/prisma');

// Listar todos los productos
const listarProductos = async (req, res) => {
    try {
        const productos = await prisma.producto.findMany({
            orderBy: {
                nombre: 'asc'
            }
        });

        res.json({
            success: true,
            data: { productos },
            total: productos.length
        });
    } catch (error) {
        console.error('Error al listar productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un producto por ID
const obtenerProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await prisma.producto.findUnique({
            where: { id: parseInt(id) }
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            data: { producto }
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
};

// Crear producto
const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, imagenUrl, precioUnitario, cantidad, unidad } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorio'
            });
        }

        const nuevoProducto = await prisma.producto.create({
            data: {
                nombre,
                descripcion,
                imagenUrl,
                precioUnitario: precioUnitario ? parseFloat(precioUnitario) : 0,
                cantidad: cantidad ? parseFloat(cantidad) : 0,
                unidad: unidad || 'unidad'
            }
        });

        res.status(201).json({
            success: true,
            data: { producto: nuevoProducto },
            message: 'Producto creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear producto'
        });
    }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, imagenUrl, precioUnitario, cantidad, unidad } = req.body;

        const producto = await prisma.producto.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion,
                imagenUrl,
                precioUnitario: precioUnitario !== undefined ? parseFloat(precioUnitario) : undefined,
                cantidad: cantidad !== undefined ? parseFloat(cantidad) : undefined,
                unidad
            }
        });

        res.json({
            success: true,
            data: { producto },
            message: 'Producto actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto'
        });
    }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.producto.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto'
        });
    }
};

module.exports = {
    listarProductos,
    obtenerProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};
