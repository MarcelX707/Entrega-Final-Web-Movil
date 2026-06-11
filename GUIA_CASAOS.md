# Guía de Instalación en CasaOS - Plataforma Municipal

Para usar tu proyecto en CasaOS, lo más sencillo es usar la opción de "App Install" personalizada. Aquí tienes los pasos y la configuración:

## 1. Instalar el Backend
1. En el dashboard de CasaOS, haz clic en el icono **"+"** y elige **"Install a custom app"**.
2. Configura los siguientes campos:
   - **Docker Image:** `marcelx707/municipalidad_backend:latest`
   - **App Name:** `Municipalidad Backend`
   - **Icon URL:** (Puedes usar cualquier icono de red)
   - **Network:** `Bridge`
   - **Ports:**
     - Host: `3001` -> Container: `3001`
   - **Environment Variables:**
     - `JWT_SECRET`: (Tu clave secreta)
     - `DATABASE_URL`: (Tu URL de Neon PostgreSQL)

## 2. Instalar el Frontend
1. Repite el proceso para una nueva app.
2. Configura:
   - **Docker Image:** `marcelx707/municipalidad_frontend:latest`
   - **App Name:** `Municipalidad Frontend`
   - **Network:** `Bridge`
   - **Ports:**
     - Host: `3000` -> Container: `80`
   - **Web UI Port:** `3000`

## 3. Uso de App Store Personalizada (Docker Compose)
Si prefieres instalar todo junto, CasaOS permite importar un archivo Docker Compose. Puedes copiar el contenido de tu `docker-compose.yml` que ya está en el repositorio directamente en la ventana de instalación personalizada haciendo clic en el icono superior derecho que dice **"Import"**.

### Consideraciones importantes:
- Asegúrate de que el puerto `3001` (Backend) y `3000` (Frontend) estén libres en tu servidor CasaOS.
- El Frontend está configurado para buscar el backend en `/api`, por lo que en CasaOS podrías necesitar configurar un proxy inverso si quieres que funcionen bajo el mismo dominio/IP sin problemas de CORS.
