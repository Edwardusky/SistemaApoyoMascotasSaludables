---
description: Flujo de trabajo colaborativo para el Sistema de Apoyo a Mascotas. Define el desarrollo en paralelo (Frontend/Backend) con estricta separación de responsabilidades para evitar conflictos en GitHub.
---

# Workflow de Desarrollo Colaborativo: Mascotas Saludables

Este flujo de trabajo define las fases de codificación para el agente. Se divide en pistas paralelas para permitir el trabajo simultáneo del equipo.

## Fase 1: Inicialización y Contratos (Trabajo Conjunto)
- **Paso 1.1**: Generar los scripts DDL (SQL) para crear los esquemas `BD_Catalogos` y `BD_Transaccional`.
- **Paso 1.2**: Definir los Contratos de API (JSON payloads). Acordar formatos de petición y respuesta.

## Fase 2: Desarrollo Paralelo (Trabajo Aislado)

### Track A: Backend (Desarrollador 1)
- **Paso 2.A.1**: Configurar API Gateway, middlewares de seguridad (CORS, JWT) y conexiones a Cloud SQL.
- **Paso 2.A.2**: Desarrollar los 4 Microservicios (Administración, Usuarios, Evaluación, Solicitudes).


### Track B: Frontend (Desarrollador 2)
- **Paso 2.B.1**: Crear diseño base (UI/UX) en React SPA y enrutamiento (React Router).
- **Paso 2.B.2**: Desarrollar vistas: Formulario Ciudadano (Cascada Tipo->Raza), Bandeja de Autoridad, Panel de Administrador.
- **Paso 2.B.3**: Usar "Mocks" (datos simulados) basados en los Contratos de API (Paso 1.2).


## Fase 3: Integración y Pruebas (Trabajo Conjunto)
- **Paso 3.1**: Reemplazar los "Mocks" del Frontend por llamadas reales `fetch/axios` al API Gateway del Backend.
- **Paso 3.2**: Resolver errores de integración (CORS, variables mal nombradas) mediante Pull Requests.
- **Paso 3.3**: Ejecutar pruebas End-to-End simulando un registro completo hasta la aprobación del bono.

## Fase 4: Despliegue en Antigravity
- Contenerización estricta por servicio y despliegue final en los servidores.