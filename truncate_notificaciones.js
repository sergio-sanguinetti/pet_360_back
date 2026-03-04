const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE notificaciones`);
        console.log("Truncated successfully");
    } catch (err) {
        console.error("Error truncating:", err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
