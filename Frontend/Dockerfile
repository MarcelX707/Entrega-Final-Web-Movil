# --- ETAPA DE COMPILACIÓN (BUILD) ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Habilitar variable de entorno para que React use rutas relativas /api en producción
ENV REACT_APP_API_URL=/api

# Compilar la aplicación React/Ionic para producción
RUN npm run build

# --- ETAPA DE SERVICIO (NGINX) ---
FROM nginx:1.25-alpine

# Copiar archivos compilados a la carpeta pública de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
