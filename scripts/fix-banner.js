const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuracion.update({
    where: { id: 1 },
    data: { landingBannerActivo: true }
  });
  console.log('Updated config:', config);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
