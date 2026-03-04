const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const raw = await prisma.$queryRaw`SELECT id, nombre, vencimiento FROM notificaciones;`;
        console.log("Raw notifications:");
        console.dir(raw);

        // Attempt deleting bad rows
        const res = await prisma.$executeRaw`DELETE FROM notificaciones WHERE CAST(vencimiento AS CHAR) LIKE '0000-%';`;
        console.log("Deleted zero date rows:", res);
    } catch (e) {
        console.error(e);
    }
}

main().finally(() => prisma.$disconnect());
