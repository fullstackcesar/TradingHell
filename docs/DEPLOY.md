# 🚀 Despliegue en Dokploy

Guía para desplegar TradingHell en Dokploy con Backend, Frontend y PostgreSQL.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         Dokploy                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Backend    │───▶│  PostgreSQL  │  │
│  │  (Angular)   │    │  (FastAPI)   │    │              │  │
│  │   :80        │    │   :8000      │    │   :5432      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                                   │
│         ▼                                                   │
│    Nginx Proxy                                              │
│    /api → backend:8000                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Opción 1: Despliegue con Docker Compose (Recomendado)

### 1. Crear proyecto en Dokploy

1. En Dokploy, crea un nuevo proyecto: **TradingHell**
2. Selecciona **Compose** como tipo de aplicación
3. Conecta tu repositorio de GitHub

### 2. Configurar variables de entorno

En Dokploy, ve a **Environment Variables** y añade:

```env
# Requerido
OPENAI_API_KEY=sk-tu-api-key-de-openai

# PostgreSQL
POSTGRES_DB=tradinghell
POSTGRES_USER=tradinghell
POSTGRES_PASSWORD=un_password_muy_seguro_123!
```

### 3. Configurar dominios

En la sección de **Domains** de Dokploy:

- Frontend: `tu-dominio.com` → Puerto `80`
- (Opcional) Backend directo: `api.tu-dominio.com` → Puerto `8000`

### 4. Desplegar

Click en **Deploy** y espera a que se construyan las imágenes.

---

## Opción 2: Despliegue por servicios separados

Si prefieres más control, despliega cada servicio por separado:

### A) PostgreSQL

1. Crea un nuevo servicio de tipo **Database** → **PostgreSQL**
2. Nombre: `tradinghell-db`
3. Configura:
   - Database: `tradinghell`
   - User: `tradinghell`
   - Password: `tu_password_seguro`
4. Anota la URL de conexión interna (ej: `postgres://tradinghell:pass@tradinghell-db:5432/tradinghell`)

### B) Backend

1. Crea un nuevo servicio de tipo **Application**
2. Conecta el repositorio
3. Configura:
   - **Build Path**: `./backend`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Port**: `8000`
4. Variables de entorno:
   ```env
   OPENAI_API_KEY=sk-tu-api-key
   DATABASE_URL=postgresql://tradinghell:pass@tradinghell-db:5432/tradinghell
   ```
5. Dominio (opcional): `api.tu-dominio.com`

### C) Frontend

1. Crea un nuevo servicio de tipo **Application**
2. Conecta el repositorio
3. Configura:
   - **Build Path**: `./frontend`
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Port**: `80`
4. Variables de entorno:
   ```env
   API_URL=http://tradinghell-backend:8000
   ```
   (usa el nombre interno del servicio backend)
5. Dominio: `tu-dominio.com`

---

## Verificación del despliegue

### Health Checks

- **Backend**: `https://tu-dominio.com/health`
  ```json
  {"status": "healthy", "rag_available": true}
  ```

- **Frontend**: `https://tu-dominio.com` - Debería cargar el dashboard

### Logs

En Dokploy, revisa los logs de cada servicio si hay problemas:
- Backend: Busca "Motor RAG inicializado correctamente"
- Frontend: Busca errores de nginx

---

## Variables de entorno completas

| Variable            | Servicio   | Requerida | Descripción                            |
| ------------------- | ---------- | --------- | -------------------------------------- |
| `OPENAI_API_KEY`    | Backend    | Sí*       | API key de OpenAI para el RAG          |
| `DATABASE_URL`      | Backend    | No        | URL de PostgreSQL (auto en compose)    |
| `POSTGRES_DB`       | PostgreSQL | No        | Nombre de la BD (default: tradinghell) |
| `POSTGRES_USER`     | PostgreSQL | No        | Usuario (default: tradinghell)         |
| `POSTGRES_PASSWORD` | PostgreSQL | Sí        | Password de PostgreSQL                 |
| `API_URL`           | Frontend   | No        | URL del backend (auto en compose)      |

\* Sin `OPENAI_API_KEY`, el chat RAG no funcionará pero el análisis técnico sí.

---

## Troubleshooting

### El frontend no conecta con el backend

1. Verifica que ambos servicios están en la misma red de Docker
2. El nginx del frontend hace proxy de `/api` al backend
3. Revisa los logs de nginx: `docker logs tradinghell-frontend`

### Error de conexión a PostgreSQL

1. Verifica que el servicio de PostgreSQL está corriendo
2. Comprueba la URL de conexión en `DATABASE_URL`
3. El backend espera a que PostgreSQL esté healthy antes de arrancar

### El RAG no responde

1. Verifica que `OPENAI_API_KEY` está configurada correctamente
2. Revisa los logs del backend al arrancar
3. Endpoint `/health` muestra `"rag_available": false` si hay problemas

---

## Comandos útiles (desarrollo local)

```bash
# Levantar todo
docker compose up -d

# Ver logs
docker compose logs -f

# Solo backend
docker compose up backend -d

# Reconstruir imágenes
docker compose build --no-cache

# Parar todo
docker compose down

# Parar y borrar volúmenes (¡borra datos!)
docker compose down -v
```

---

## Actualizar despliegue

En Dokploy, simplemente haz push a tu rama principal y el despliegue se actualizará automáticamente (si tienes CI/CD configurado) o haz click en **Redeploy**.
