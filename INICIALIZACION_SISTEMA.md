# Proceso de Inicialización del Sistema de Apoyo para Mascotas Saludables

Este documento describe los pasos necesarios para inicializar el sistema completo de manera local, incluyendo la base de datos, los microservicios del backend y la aplicación frontend.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes componentes en tu máquina:
- **Docker y Docker Compose**: Para ejecutar la base de datos y los microservicios.
- **Node.js (v18 o superior) y npm**: Para ejecutar y compilar el frontend.
- **Git** (opcional, si necesitas clonar el repositorio).

## Arquitectura del Proyecto

El proyecto está dividido estrictamente en dos directorios principales cumpliendo con la regla de No Intromisión:
- `/backend`: Contiene los 4 microservicios independientes (`ms_usuarios`, `ms_evaluacion`, `ms_solicitudes`, `ms_administracion`), el API Gateway y los scripts de inicialización para PostgreSQL en Cloud SQL.
- `/frontend`: Contiene la Single Page Application (SPA) desarrollada en React estricto con Vite.

Todo el tráfico del frontend hacia el backend se enruta a través del API Gateway.

---

## Paso 1: Inicializar el Backend y la Base de Datos

El backend utiliza Docker Compose para levantar y orquestar todos los servicios simultáneamente.

1. Abre una terminal en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).
2. Ejecuta el siguiente comando para construir las imágenes de Docker y levantar los contenedores en segundo plano:
   ```bash
   docker-compose up -d --build
3. Docker inicializará los siguientes servicios:
   - `mascotas_db`: Base de datos PostgreSQL (Puerto local `5432`). Se 
   ```ejecutará un script inicializador ubicado en `backend/db_init` automáticamente en el primer arranque para crear los esquemas (`bd_transaccional`, `bd_catalogos`) y las tablas.
   - `ms_usuarios`: Microservicio 1 - Usuarios (RF-01).
   - `ms_evaluacion`: Microservicio 2 - Evaluación e IMA (RF-02, RF-03, RF-04).
   - `ms_solicitudes`: Microservicio 3 - Solicitudes y Auditoría.
   - `ms_administracion`: Microservicio 4 - Administración de políticas (RF-05).
   - `api_gateway`: API Gateway (Nginx) que enruta las peticiones de los microservicios. **Puerto público expuesto: `8080`**.
4. Para verificar que todos los servicios estén corriendo correctamente:
   ```bash
   docker-compose ps
   ```

---

## Paso 2: Inicializar el Frontend

El frontend es una aplicación de React gestionada con Vite.

1. Abre una nueva terminal.
2. Navega al directorio del frontend desde la raíz del proyecto:
   ```bash
   cd frontend
   ```
3. Instala todas las dependencias del proyecto utilizando npm:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```

---

## Paso 3: Accesos y Comprobación

Una vez que ambos entornos (Backend y Frontend) se hayan inicializado correctamente, puedes acceder al sistema a través de tu navegador:

- **Frontend (Interfaz de Usuario)**: Abre tu navegador web y dirígete a `http://localhost:5173` (o el puerto que Vite asigne en tu terminal).
- **Backend (API Gateway)**: El API Gateway está escuchando peticiones en `http://localhost:8080`. Todas las peticiones del frontend deben estar configuradas para apuntar a esta URL base.

## Solución de Problemas Frecuentes (Troubleshooting)

- **La base de datos no tiene tablas o datos**: Si la base de datos no cargó el script inicial, probablemente se deba a que el volumen persistente de Docker ya existía y estaba vacío. Intenta limpiar el entorno deteniendo los contenedores y eliminando los volúmenes con `docker-compose down -v`, y luego vuelve a ejecutar el paso 1.
- **Conflictos de Puertos**: Asegúrate de que no haya otros servicios locales en tu máquina utilizando los puertos `5432` (PostgreSQL clásico), `8080` (el API Gateway de nuestro sistema) o `5173` (puerto por defecto de Vite).
