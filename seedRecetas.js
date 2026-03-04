const prisma = require('./src/config/prisma');

async function main() {
    const recetasData = [
        {
            nombre: 'POLLO VITAL',
            precio: 0,
            ingredientes: {
                create: [
                    { categoria: 'Proteina 60%', insumo: 'Pollo (Pechuga/Pierna)', cantidad: '400 gr' },
                    { categoria: 'Proteina 60%', insumo: 'Hígado/Corazón de Pollo', cantidad: '200 gr' },
                    { categoria: 'Carbohidrato 25%', insumo: 'Arroz (Costeño/Similar)', cantidad: '250 gr' },
                    { categoria: 'vegetales 15%', insumo: 'Zanahoria', cantidad: '75 gr' },
                    { categoria: 'vegetales 15%', insumo: 'Vainita', cantidad: '75 gr' },
                    { categoria: 'Suplementos', insumo: 'Aceite Veg. + Calcio + Vits', cantidad: '8 gr' },
                    { categoria: 'Merma Técnica (5%)', insumo: '-', cantidad: '-' }
                ]
            }
        },
        {
            nombre: 'RES POTENCIA',
            precio: 0,
            ingredientes: {
                create: [
                    { categoria: 'Proteina 60%', insumo: 'Carne de Res (Recortes/Bofe)', cantidad: '300 gr' },
                    { categoria: 'Proteina 60%', insumo: 'Corazón de Res', cantidad: '300 gr' },
                    { categoria: 'Carbohidrato 25%', insumo: 'Camote', cantidad: '250 gr' },
                    { categoria: 'Vegetales 15%', insumo: 'Zapallo', cantidad: '75 gr' },
                    { categoria: 'Vegetales 15%', insumo: 'Beterraga', cantidad: '75 gr' },
                    { categoria: 'Suplementos', insumo: 'Aceite de Pescado', cantidad: '4 ml' },
                    { categoria: 'Suplementos', insumo: 'Carbonato de Calcio + Premix', cantidad: '5 gr' },
                    { categoria: 'Merma tecnica', insumo: '-', cantidad: '5%' }
                ]
            }
        },
        {
            nombre: 'PAVO SENSITIVE',
            precio: 0,
            ingredientes: {
                create: [
                    { categoria: 'Proteina 60%', insumo: 'Carne de Pavo (Pechuga/Pierna)', cantidad: '500 gr' },
                    { categoria: 'Proteina 60%', insumo: 'Hígado de Pavo', cantidad: '100gr' },
                    { categoria: 'Carbohidrato 25%', insumo: 'Quinoa Lavada (Grano Seco)', cantidad: '250 gr' },
                    { categoria: 'Vegetales 15%', insumo: 'Zucchini (Zapallo Italiano)', cantidad: '75 gr' },
                    { categoria: 'Vegetales 15%', insumo: 'Brocolí', cantidad: '75 gr' },
                    { categoria: 'Suplementos', insumo: 'Aceite Salmón', cantidad: '10 gr' },
                    { categoria: 'Suplementos', insumo: 'Cúrcuma + Calcio', cantidad: '-' },
                    { categoria: 'Merma Técnica (5%)', insumo: '-', cantidad: '-' }
                ]
            }
        }
    ];

    for (const receta of recetasData) {
        const r = await prisma.receta.create({
            data: receta
        });
        console.log(`Creada receta ${r.nombre}`);
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
