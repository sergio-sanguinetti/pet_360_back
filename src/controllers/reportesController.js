const prisma = require('../config/prisma');

const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const { periodo } = req.query; // 'este_mes', 'ultimos_3m', 'ultimos_12m'
    
    // Configurar fechas de inicio según periodo
    const now = new Date();
    let startDate = new Date();
    if (periodo === 'ultimos_12m') {
      startDate.setMonth(now.getMonth() - 12);
    } else if (periodo === 'ultimos_3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      // este_mes (first day of the current month)
      startDate.setDate(1);
      startDate.setHours(0,0,0,0);
    }

    // Clientes
    const clientesNuevos = await prisma.cliente.count({
      where: { createdAt: { gte: startDate } }
    });
    const clientesTotales = await prisma.cliente.count();

    // Mascotas
    const mascotasRegistradas = await prisma.mascota.count();

    // Suscripciones activas hoy
    const suscripcionesActivasTotal = await prisma.suscripcion.count({
      where: { estado: 'activa' }
    });
    
    const suscripcionesPausadasTotal = await prisma.suscripcion.count({
      where: { estado: 'pausada' }
    });

    const suscripcionesCanceladasTotal = await prisma.suscripcion.count({
      where: { estado: 'cancelada' }
    });

    // KPI count por periodo
    const suscripcionesNuevasPeriodo = await prisma.suscripcion.count({
      where: { createdAt: { gte: startDate } }
    });

    const canceladasPeriodo = await prisma.suscripcion.count({
      where: { estado: 'cancelada', updatedAt: { gte: startDate } }
    });

    const pausadasPeriodo = await prisma.suscripcion.count({
      where: { estado: 'pausada', updatedAt: { gte: startDate } }
    });

    // Generar el reporte mensual (últimos 6 meses)
    const reporteMensual = [];
    for (let i = 5; i >= 0; i--) {
      const _now = new Date();
      const startOfMonth = new Date(_now.getFullYear(), _now.getMonth() - i, 1);
      const endOfMonth = new Date(_now.getFullYear(), _now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      
      const formatMonth = startOfMonth.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      // capitalize: ago 2025 -> Ago 2025
      const formattedMes = formatMonth.charAt(0).toUpperCase() + formatMonth.slice(1); 

      const nuevasMes = await prisma.suscripcion.count({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } }
      });
      const canceladasMes = await prisma.suscripcion.count({
        where: { estado: 'cancelada', updatedAt: { gte: startOfMonth, lte: endOfMonth } }
      });
      const pausadasMes = await prisma.suscripcion.count({
        where: { estado: 'pausada', updatedAt: { gte: startOfMonth, lte: endOfMonth } }
      });
      const activasFinMes = await prisma.suscripcion.count({
        where: { estado: 'activa', createdAt: { lte: endOfMonth } }
      });

      reporteMensual.push({
        mes: formattedMes,
        nuevas: nuevasMes,
        canceladas: canceladasMes,
        pausadas: pausadasMes,
        activasFinMes: activasFinMes
      });
    }

    res.json({
      success: true,
      data: {
        kpis: {
          clientesNuevos,
          clientesTotales,
          mascotasRegistradas,
          suscripcionesActivas: suscripcionesActivasTotal,
          suscripcionesNuevas: suscripcionesNuevasPeriodo,
          canceladas: canceladasPeriodo,
          pausadas: pausadasPeriodo,
          suscripcionesPausadasTotal,
          suscripcionesCanceladasTotal
        },
        reporteMensual
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

module.exports = { obtenerEstadisticasDashboard };
