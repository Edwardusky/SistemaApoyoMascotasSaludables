# Plan de Migración a Arquitectura Local (Docker Compose)

Este documento detalla la estructura y configuraciones necesarias para refactorizar el backend de tu proyecto, simulando el entorno Cloud mediante contenedores locales. Tu frontend de React (`/frontend`) permanecerá prácticamente intacto, solo deberá apuntar sus peticiones (axios/fetch) al puerto del API Gateway.

---

## 1. Nueva Estructura de Carpetas

En la raíz de tu repositorio, la estructura deberá reorganizarse de la siguiente manera para alojar los contenedores:

```text
/TIENDA_MASCOTAS_ANTIGRAV
│
├── /frontend               # Tu React SPA actual (Intacto)
│   ├── package.json
│   ├── Dockerfile          # (Opcional) Para servir el frontend en Docker
│   └── src/
│
├── /backend
│   ├── /api_gateway        # Configuración de Nginx
│   │   ├── nginx.conf
│   │   └── Dockerfile
│   │
│   ├── /db_init            # Scripts SQL para inicializar PostgreSQL/MySQL
│   │   └── init.sql        # Crea los esquemas BD_Transaccional y BD_Catalogos
│   │
│   ├── /ms_usuarios        # Microservicio 1 (RF-01)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── /ms_evaluacion      # Microservicio 2 (RF-02, RF-03, RF-04)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── /ms_solicitudes     # Microservicio 3 (Auditoría)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── /ms_administracion  # Microservicio 4 (Políticas y Costos, RF-05)
│       ├── src/
│       ├── package.json
│       └── Dockerfile
│
└── docker-compose.yml      # El orquestador de todo el proyecto
```

---

## 2. El Orquestador: `docker-compose.yml`



```yaml
version: '3.8'

services:
  # 1. BASE DE DATOS (Relacional Estricta)
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: mascotas_db
    ports:
      - "5432:5432"
    volumes:
      - ./backend/db_init:/docker-entrypoint-initdb.d # Ejecuta init.sql al arrancar

  # 2. MICROSERVICIOS
  ms_usuarios:
    build: ./backend/ms_usuarios
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://admin:password123@db:5432/mascotas_db

  ms_evaluacion:
    build: ./backend/ms_evaluacion
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://admin:password123@db:5432/mascotas_db

  ms_solicitudes:
    build: ./backend/ms_solicitudes
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://admin:password123@db:5432/mascotas_db

  ms_administracion:
    build: ./backend/ms_administracion
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://admin:password123@db:5432/mascotas_db

  # 3. API GATEWAY (Nginx)
  api_gateway:
    build: ./backend/api_gateway
    ports:
      - "8080:80" # El frontend hará las peticiones a localhost:8080
    depends_on:
      - ms_usuarios
      - ms_evaluacion
      - ms_solicitudes
      - ms_administracion
```

---

## 3. El API Gateway: `/backend/api_gateway/nginx.conf`

Este archivo enruta el tráfico que llega al puerto `8080` hacia el microservicio correspondiente.

```nginx
server {
    listen 80;

    # RF-01: Usuarios
    location /api/usuarios/ {
        proxy_pass http://ms_usuarios:3000/;
    }

    # RF-02, 03, 04: Evaluación e IMA
    location /api/evaluacion/ {
        proxy_pass http://ms_evaluacion:3000/;
    }

    # Auditoría de solicitudes
    location /api/solicitudes/ {
        proxy_pass http://ms_solicitudes:3000/;
    }

    # RF-05: Administración de catálogos y políticas
    location /api/admin/ {
        proxy_pass http://ms_administracion:3000/;
    }
}
```
*Su `Dockerfile` correspondiente solo necesita una línea: `FROM nginx:alpine COPY nginx.conf /etc/nginx/conf.d/default.conf`*

---

## 4. Inicialización de la Base de Datos: `/backend/db_init/init.sql`

Este script se ejecuta automáticamente la primera vez que arranca el contenedor de la BD, creando las estructuras relacionales de los requerimientos.

```sql
-- Creación de esquemas lógicos
CREATE SCHEMA bd_transaccional;
CREATE SCHEMA bd_catalogos;

-- Tablas de Catálogos (Ejemplo)
CREATE TABLE bd_catalogos.TipoMascota (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tablas Transaccionales (Ejemplo)
CREATE TABLE bd_transaccional.Usuario (
    id SERIAL PRIMARY KEY,
    curp VARCHAR(18) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'ciudadano'
);

CREATE TABLE bd_transaccional.Mascota (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES bd_transaccional.Usuario(id),
    tipo_id INT REFERENCES bd_catalogos.TipoMascota(id),
    nombre VARCHAR(100) NOT NULL
);
```

---

## 5. Instrucciones para tu Profesor



1. **Levantar el Backend Completo (Base de datos, Gateway y 4 Microservicios):**
   ```bash
   docker-compose up -d --build
   ```
2. **Levantar el Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Con esto, el sistema cumplirá con todas las reglas de separación y microservicios, operando localmente de forma idéntica a como operaría en la nube.
