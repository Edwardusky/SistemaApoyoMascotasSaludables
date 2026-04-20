# 🚨 RESOLUCIÓN DE CONFLICTOS CROSS-DOMAIN (Fase 3: Integración) 🚨

Actuando como Arquitecto Senior, he detectado errores de integración entre el Track A (Backend) y el Track B (Frontend) durante el registro de una mascota. Las peticiones están fallando en el navegador con los siguientes códigos HTTP:

1. `401 Unauthorized` en `GET` y `POST` hacia `http://localhost:8080/api/solicitudes/`.
2. `404 Not Found` en `GET` hacia `http://localhost:8080/api/evaluacion/catalogos/peso-ideal?razaId=14&tamano...`

Necesito que sincronices los contratos de API aplicando las siguientes correcciones de inmediato:

## Instrucciones para Track B (Frontend - `api.service.js`):
1. **Corrección del Token (401):** Revisa el interceptor o la función de fetch en `api.service.js`. Asegúrate de que esté recuperando correctamente el JWT (desde `localStorage` o `sessionStorage`) y lo esté inyectando en los *Headers* como `Authorization: Bearer <token>`. 
2. **Manejo de Sesión:** Si el token es nulo o inválido, el frontend no debería intentar hacer el POST; debe redirigir al usuario al Login o mostrar un modal de re-autenticación.

## Instrucciones para Track A (Backend - Python/FastAPI/Flask):
1. **Corrección de Ruta (404):** Revisa los enrutadores/controladores. El endpoint `/api/evaluacion/catalogos/peso-ideal` no está expuesto o está mal nombrado. Asegúrate de crear este endpoint para que reciba los query parameters (`razaId`, `tamano`) y retorne los datos de la colección de Catálogos de MongoDB.
2. **Revisión de Middleware (401):** Revisa la función decoradora que protege la ruta `/api/solicitudes/`. Asegúrate de que está desencriptando el JWT correctamente y validando al usuario.

**Protocolo de Ejecución:**
Como esto toca ambas carpetas, apruebo explícitamente la modificación cruzada. Muéstrame el código que debes ajustar en `api.service.js` (Frontend) y en el archivo de rutas correspondiente del servidor de Python (Backend) para solucionar estos errores.


# 🔓 AUTORIZACIÓN DE SUPERUSUARIO (Bypass Temporal de Reglas) 🔓

Actuando como Arquitecto Senior y líder del proyecto, por la presente **revoco temporalmente la "Regla de No Intromisión"** establecida en el archivo `workspace_rules.md` (Punto 4) y en el Workflow.

**Autorización Explícita:**
Tienes permiso total e irrestricto para modificar archivos **simultáneamente** en las carpetas `/frontend` y `/backend` con el objetivo único de resolver los errores de integración actuales (401 Unauthorized y 404 Not Found).

## Misión de Integración (Full-Stack):

1. **Frontend (`/frontend/src/.../api.service.js`):**
   - Corrige las peticiones para que incluyan el Token JWT en los *headers* (`Authorization: Bearer <token>`).
   - Revisa la URL hacia `/api/evaluacion/catalogos/peso-ideal` para asegurar que los parámetros viajan correctamente.

2. **Backend (`/backend/...` - Python):**
   - Crea/Corrige el endpoint `/api/evaluacion/catalogos/peso-ideal` para que no devuelva 404 y extraiga los datos de la base de datos MongoDB local usando `pymongo`.
   - Revisa el middleware de autenticación en `/api/solicitudes/` para asegurar que está validando el JWT emitido por el login.

Entrégame el código corregido de ambas partes para implementarlo y continuar con el proyecto.