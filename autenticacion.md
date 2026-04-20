# 🚨 AUDITORÍA CRÍTICA DE AUTENTICACIÓN (Superusuario) 🚨

He iniciado sesión exitosamente, pero sigo recibiendo errores `401 Unauthorized` y alertas de "Token inválido" al intentar cargar el dashboard (`GET /api/solicitudes/`) y al intentar registrar una mascota (`POST`). 

Como tienes permisos de Superusuario para tocar Frontend y Backend simultáneamente, necesito que dejes de hacer parches aislados y audites el ciclo de vida completo del JWT siguiendo esta lista de verificación exacta. 

Entrégame los bloques de código corregidos para cada punto:

## 1. Auditoría Frontend (Track B - `api.service.js` y Login):
- **Almacenamiento:** Revisa el componente o servicio de Login. ¿Bajo qué key exacta se está guardando el token en `localStorage` o `sessionStorage` (ej. `token`, `access_token`)?
- **Inyección en Headers:** Revisa la configuración base de Axios o la función `fetch` en `api.service.js`. Asegúrate de que extrae el token usando la key correcta y lo inyecta **estrictamente** con el formato: `Authorization: Bearer <el_token>`.

## 2. Auditoría Backend (Track A - Python):
- **Extracción del Token:** Revisa el middleware o dependencia que protege la ruta `/api/solicitudes/`. Asegúrate de que está leyendo correctamente el header `Authorization` y separando la palabra "Bearer " del token real.
- **Validación de Firma (SECRET_KEY):** Verifica que la constante o variable de entorno `SECRET_KEY` y el algoritmo (`HS256`) utilizados en la función de **crear token** (Login) sean idénticos a los utilizados en la función de **verificar token** (Middleware).
- **Políticas CORS:** Verifica en el archivo principal (`main.py` o `app.py`) que la configuración de CORS permite explícitamente el paso de credenciales, e incluye `"Authorization"` en la lista de `allow_headers`.

No me des explicaciones genéricas. Dime exactamente dónde encontraste la desconexión entre el frontend y el backend basándote en esta auditoría, y dame el código exacto para reemplazarlo.