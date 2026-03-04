const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCondiciones() {
    const condiciones = [
        {
            nombre: 'Delgado',
            descripcion: 'Costillas muy visibles y cintura muy marcada.',
            mensaje: 'Tu mascota está por debajo de su peso ideal. Aumentaremos las calorías para ayudarle a alcanzar un peso saludable.'
        },
        {
            nombre: 'Ideal',
            descripcion: 'Costillas palpables pero no visibles. Cintura definida.',
            mensaje: null
        },
        {
            nombre: 'Sobrepeso',
            descripcion: 'Sin cintura visible. Espalda ancha y depósitos de grasa.',
            mensaje: 'Detectamos sobrepeso. Ajustaremos las calorías al 80% para ayudar a tu mascota a alcanzar su peso ideal.'
        }
    ];

    for (const c of condiciones) {
        await prisma.condicionCorporal.upsert({
            where: { nombre: c.nombre },
            update: { descripcion: c.descripcion, mensaje: c.mensaje },
            create: c
        });
    }

    console.log('✅ Condiciones corporales sembradas correctamente');
    await prisma.$disconnect();
}

seedCondiciones().catch(e => { console.error(e); process.exit(1); });
