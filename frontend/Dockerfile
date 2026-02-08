# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Production stage - Nginx para servir los archivos estáticos
FROM nginx:alpine AS production

# Copiar configuración de nginx
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos de build
COPY --from=build /app/dist/trading-hell/browser /usr/share/nginx/html

# Crear script de entrypoint para inyectar variables de entorno
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-env.sh && \
    echo 'if [ -n "$API_URL" ]; then' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '  sed -i "s|</head>|<script>window.__API_URL__=\"$API_URL\";</script></head>|g" /usr/share/nginx/html/index.html' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'fi' >> /docker-entrypoint.d/40-inject-env.sh && \
    chmod +x /docker-entrypoint.d/40-inject-env.sh

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
