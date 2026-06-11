FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --only=production

# Copiar el código fuente
COPY . .

# Exponer el puerto del backend
EXPOSE 3001

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
