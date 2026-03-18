# GlobalS1 BFF Template

Template de BFF (Backend for Frontend) que agrega datos de múltiples microservicios y los transforma para consumo del frontend.

## ¿Qué es un BFF?

A diferencia de un API Gateway que solo proxea requests, el BFF:

- **Agrega datos** de múltiples servicios backend en una sola respuesta
- **Transforma DTOs** del backend a formatos específicos del frontend
- **Reduce round-trips** del cliente componiendo datos server-side
- **Maneja fallos parciales** gracefully (devuelve lo que tuvo éxito)

## Estructura del Proyecto

```
globalsone-bff-template/
├── src/
│   ├── index.ts                 # Entry point
│   ├── bootstrap.ts             # Application bootstrap
│   ├── server.ts                # Express server config
│   │
│   ├── api/
│   │   ├── api.ts               # Router principal
│   │   ├── controllers/         # Controladores BFF
│   │   ├── routes/              # Definición de rutas
│   │   └── middlewares/         # Auth, correlation ID, etc.
│   │
│   ├── bff/
│   │   ├── domain/
│   │   │   ├── interfaces/      # Interfaces de BFF
│   │   │   └── transformers/    # Transformadores DTO→Frontend
│   │   ├── application/
│   │   │   └── use-cases/       # Casos de uso de agregación
│   │   └── infrastructure/
│   │       ├── service-clients/ # Clientes HTTP con undici
│   │       ├── cache/           # Cache de respuestas agregadas
│   │       └── config/          # Configuración de servicios
│   │
│   └── entities/shared/         # Shared entities (desde api-gateway)
│
├── config/
│   └── backend-services.json    # Configuración de microservicios
│
├── mocks/                       # Mock services para testing
├── Dockerfile
├── docker-compose.yaml
└── package.json
```

## Características

### 1. Service Clients (undici)
- Cliente HTTP tipado por cada microservicio
- Base client con retry, timeout, headers
- Propagación de auth token y correlation ID
- Health check por servicio

### 2. Aggregation Use Cases
- Base class para agregaciones paralelas
- `Promise.allSettled()` para fallos parciales
- Tracking de qué servicios fallaron
- Fallbacks cuando un servicio falla

### 3. Transformers
- Transforman DTOs backend → frontend
- Formateo de fechas, monedas, strings
- Valores por defecto para campos faltantes
- Composición de datos relacionados

### 4. Cache Layer
- Cache de respuestas agregadas en Redis
- TTL corto (5 min) para datos dinámicos
- Invalidación por tags (user:123, order:456)
- Cache key con hash de parámetros

### 5. Partial Failure Handling
- Respuesta incluye `partialFailures[]`
- Frontend puede mostrar estado degradado
- Logging de servicios que fallaron

## Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar con mocks (Docker)
docker-compose up -d

# O iniciar solo el BFF (si tienes servicios reales)
npm run dev
```

### Con Docker

```bash
# Build y run
docker-compose up -d --build

# Ver logs
docker-compose logs -f bff-service

# Parar
docker-compose down
```

## Endpoints

### Health Checks

```bash
# Basic health
curl http://localhost:3000/v1/health

# Liveness probe (K8s)
curl http://localhost:3000/v1/health/live

# Readiness probe (K8s)
curl http://localhost:3000/v1/health/ready

# Detailed health (incluye backend services)
curl http://localhost:3000/v1/health/detailed
```

### BFF Aggregation

```bash
# User Profile (requiere auth)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/v1/bff/user-profile/me

# Dashboard
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/v1/bff/dashboard
```

## Ejemplo de Respuesta Agregada

**Request:**
```
GET /v1/bff/user-profile/123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "displayName": "Juan Pérez",
      "email": "juan@email.com",
      "avatar": "/avatars/123.jpg",
      "memberSince": "Mar 2023"
    },
    "preferences": {
      "theme": "dark",
      "language": "es",
      "notificationsEnabled": true
    },
    "recentOrders": [
      {
        "id": "ord-1",
        "date": "Mar 15, 2024",
        "status": "Delivered",
        "statusColor": "green",
        "total": "$125.00",
        "itemCount": 3
      }
    ],
    "unreadNotifications": 5,
    "stats": {
      "totalOrders": 42,
      "totalSpent": "$3,450.00",
      "loyaltyPoints": "1,250"
    }
  },
  "meta": {
    "duration": 234,
    "partialFailures": [],
    "timestamp": "2024-03-15T10:30:00Z"
  }
}
```

### Respuesta con Fallos Parciales

Si un servicio falla, la respuesta incluye los datos disponibles:

```json
{
  "success": true,
  "data": {
    "user": { "..." },
    "preferences": { "..." },
    "recentOrders": [],
    "unreadNotifications": 0,
    "stats": {
      "totalOrders": 0,
      "totalSpent": "$0.00",
      "loyaltyPoints": "0"
    }
  },
  "meta": {
    "duration": 5012,
    "partialFailures": [
      {
        "service": "orders-service",
        "code": "TIMEOUT",
        "message": "Request to orders-service timed out",
        "affectedData": "recentOrders"
      },
      {
        "service": "notifications-service",
        "code": "CONNECTION_ERROR",
        "message": "Cannot connect to notifications-service",
        "affectedData": "notificationCount"
      }
    ],
    "timestamp": "2024-03-15T10:30:00Z"
  }
}
```

## Variables de Entorno

```env
# Application
STAGE=DEV
APP_NAME=BFF-SERVICE
APP_PORT=3000

# Redis
REDIS_HOST=redis://localhost:6379

# Auth
BFF_JWT_SECRET=your-jwt-secret

# Backend Services
USERS_SERVICE_URL=http://users-service:3001
ORDERS_SERVICE_URL=http://orders-service:3002
PRODUCTS_SERVICE_URL=http://products-service:3003
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3004

# Cache
BFF_CACHE_ENABLED=true
BFF_CACHE_DEFAULT_TTL=300
```

## Testing de Fallos Parciales

```bash
# 1. Levantar servicios
docker-compose up -d

# 2. Test normal
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/v1/bff/user-profile/123

# 3. Apagar un servicio
docker stop mock-orders-service

# 4. Verificar degradación graceful
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/v1/bff/user-profile/123
# Debe devolver data parcial + partialFailures
```

## Agregar Nuevo Endpoint de Agregación

1. **Crear Use Case** en `src/bff/application/use-cases/`
2. **Crear Transformer** en `src/bff/domain/transformers/`
3. **Crear Controller** en `src/api/controllers/`
4. **Crear Routes** en `src/api/routes/`
5. **Registrar en** `src/api/api.ts`

## Despliegue en Producción

### Configuración

```bash
# Copiar y configurar variables de producción
cp .env.prod.example .env.prod

# Editar con valores reales
nano .env.prod
```

### Deploy con Docker Compose

```bash
# Build de imagen
docker build -t your-registry.com/globalsone-bff:latest .

# Push a registry
docker push your-registry.com/globalsone-bff:latest

# Deploy
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d
```

### Deploy con Docker Swarm

```bash
# Inicializar swarm (si no está iniciado)
docker swarm init

# Crear red externa (si no existe)
docker network create --driver overlay globalsone-backend

# Deploy stack
docker stack deploy -c docker-compose.prod.yaml --with-registry-auth bff
```

### Características de Producción

El archivo `docker-compose.prod.yaml` incluye:

- **Réplicas configurables** - `REPLICAS=2` por defecto
- **Límites de recursos** - CPU y memoria configurables
- **Restart policy** - Reinicio automático con backoff
- **Rolling updates** - Actualizaciones sin downtime
- **Healthchecks** - Verificación de salud automática
- **Logging estructurado** - JSON logs con rotación
- **Labels para Traefik** - Load balancer y SSL automático

### Variables de Producción

```env
# Docker
DOCKER_REGISTRY=your-registry.com/
IMAGE_TAG=latest

# Deployment
REPLICAS=2
CPU_LIMIT=1
MEMORY_LIMIT=512M

# Networking
BFF_DOMAIN=bff.your-domain.com
BACKEND_NETWORK=globalsone-backend
```

### Monitoreo

```bash
# Ver estado de servicios
docker service ls

# Ver logs
docker service logs bff_bff-service -f

# Escalar réplicas
docker service scale bff_bff-service=4
```

## Licencia

ISC - GlobalS1
