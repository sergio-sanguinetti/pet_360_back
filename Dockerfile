FROM node:18-alpine

# Instalar dependencias necesarias para Prisma y OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias saltando el script de postinstall de Prisma por ahora
RUN npm install --ignore-scripts

# AHORA copiamos todo el código (incluyendo la carpeta prisma/)
COPY . .

# Generamos el cliente de Prisma manualmente ahora que el archivo schema ya existe
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]