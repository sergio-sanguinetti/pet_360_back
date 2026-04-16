const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFechasBloqueadas = async (req, res) => {
  try {
    const fechas = await prisma.fechaBloqueada.findMany({
      orderBy: { fecha: 'asc' },
    });
    res.json({ success: true, data: fechas });
  } catch (error) {
    console.error('Error al obtener fechas bloqueadas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

const addFechaBloqueada = async (req, res) => {
  const { fecha, motivo } = req.body;
  try {
    // Validar formato YYYY-MM-DD simple
    if (!fecha || typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ success: false, message: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
    }

    const existe = await prisma.fechaBloqueada.findUnique({
      where: { fecha }
    });

    if (existe) {
      return res.status(400).json({ success: false, message: 'La fecha ya está bloqueada.' });
    }

    const nuevaFecha = await prisma.fechaBloqueada.create({
      data: {
        fecha,
        motivo: motivo || null
      }
    });

    res.json({ success: true, data: nuevaFecha, message: 'Fecha bloqueada correctamente.' });
  } catch (error) {
    console.error('Error al agregar fecha bloqueada:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

const deleteFechaBloqueada = async (req, res) => {
  const { id } = req.params;
  try {
    const existe = await prisma.fechaBloqueada.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existe) {
      return res.status(404).json({ success: false, message: 'Fecha no encontrada.' });
    }

    await prisma.fechaBloqueada.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Fecha desbloqueada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar fecha bloqueada:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

module.exports = {
  getFechasBloqueadas,
  addFechaBloqueada,
  deleteFechaBloqueada
};
