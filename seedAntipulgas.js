const prisma = require('./src/config/prisma');

async function main() {
    const data = [
        {
            tipo: 'Tabletas Masticables',
            nombre: 'Mensuales',
            frecuencia: 'Cada 30 días',
            marcas: 'NexGard, Simparica, Credelio',
            notificacion: '¡Hora de su premio protector! A [Nombre del Perro] le toca su [Marca] hoy.'
        },
        {
            tipo: 'Tabletas Masticables',
            nombre: 'Trimestrales',
            frecuencia: 'Cada 12 semanas',
            marcas: 'Bravecto',
            notificacion: 'Han pasado 3 meses. La protección de Bravecto termina hoy. ¡Renúevala!'
        },
        {
            tipo: 'Tabletas Masticables',
            nombre: 'Mensuales "Todo en Uno"',
            frecuencia: 'Cada 30 días',
            marcas: 'NexGard Spectra, Simparica Trio',
            notificacion: '¡Hora de su protección completa! A [Nombre del Perro] le toca su [Marca] hoy.'
        },
        {
            tipo: 'Pipetas',
            nombre: 'Mensuales',
            frecuencia: 'Cada 30 días',
            marcas: 'Frontline, Advantix, Revolution, Fipronil',
            notificacion: 'Aplica la pipeta hoy. Recuerda no bañar a [Nombre del Perro] por 2 días.'
        },
        {
            tipo: 'Collares',
            nombre: 'Larga Duración',
            frecuencia: 'Hasta 8 meses',
            marcas: 'Seresto',
            notificacion: '¡Atención! El collar Seresto de [Nombre del Perro] vence este mes. Es hora de cambiarlo.'
        },
        {
            tipo: 'Sprays',
            nombre: 'Variable',
            frecuencia: '1 a 3 meses',
            marcas: 'Frontline Spray',
            notificacion: 'Recuerda verificar y aplicar Frontline Spray a [Nombre del Perro].'
        }
    ];

    for (const item of data) {
        const r = await prisma.antipulga.create({
            data: item
        });
        console.log(`Creado antipulga ${r.tipo} - ${r.nombre}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
