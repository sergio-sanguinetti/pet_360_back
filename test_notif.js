const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const notif = await prisma.notificacion.create({
            data: {
                nombre: 'Prueba',
                mensaje: 'Este es un mensaje de prueba',
                vencimiento: new Date('2025-10-10')
            }
        });
        console.log('Created valid notif:', notif);

        // Testing findMany
        const all = await prisma.notificacion.findMany();
        console.log('Found:', all.length);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
