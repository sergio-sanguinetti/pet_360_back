const fs = require('fs');
const path = 'src/controllers/clienteController.js';
let content = fs.readFileSync(path, 'utf8');

// Update completarWizard
content = content.replace(
    /const proxima = suscripcionData\.fechaEntregaProgramada \? new Date\(suscripcionData\.fechaEntregaProgramada\) : new Date\(\);/g,
    'const fechaE = suscripcionData.fechaEntregaProgramada ? new Date(suscripcionData.fechaEntregaProgramada) : new Date();'
);

content = content.replace(
    /if \(!suscripcionData\.fechaEntregaProgramada\) \{[\s\S]*?proxima\.setDate\(proxima\.getDate\(\) \+ diasFrecuencia\);[\s\S]*?\}/g,
    'const proxima = new Date(fechaE); const diasFrecuencia = planSeleccionado === "semanal" ? 7 : (planSeleccionado === "quincenal" ? 15 : 30); proxima.setDate(proxima.getDate() + diasFrecuencia);'
);

content = content.replace(
    /plan: planSeleccionado,[\s\S]*?proximaEntrega: proxima,/g,
    'plan: planSeleccionado,\n                        fechaEntrega: fechaE,\n                        proximaEntrega: proxima,'
);

fs.writeFileSync(path, content);
console.log('File updated successfully');
