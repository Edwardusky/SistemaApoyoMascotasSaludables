---
trigger: always_on
---

# Reglas del Espacio de Trabajo: Sistema de Apoyo para Mascotas Saludables

## 1. Restricciones Arquitectónicas (Modelo 4+1)
- **Arquitectura Base**: Híbrida (Cliente-Servidor + Microservicios). No generar monolitos.
- **Frontend**: React SPA estricto.
- **Backend (Serverless)**: 4 Microservicios aislados: 
  1) Servicio de Usuarios (RF-01).
  2) Servicio de Evaluación / Cálculo IMA (RF-02, RF-03, RF-04).
  3) Servicio de Solicitudes (Auditoría).
  4) Servicio de Administración (Políticas y Costos) (RF-05).
- **Enrutamiento**: Todo el tráfico debe pasar por un `API Gateway` antes de tocar los microservicios.

## 2. Restricciones de Base de Datos (Cloud SQL)
- **Modelo Relacional Estricto**: Respetar el diccionario de datos del SRS. Todo debe estar fuertemente tipado mediante PK (Primary Keys) y FK (Foreign Keys). 
- **División de Esquemas**:
  - `BD_Transaccional`: Dueño_Usuario, Dirección, Mascota, SolicitudApoyo.
  - `BD_Catalogos`: TipoMascota, RazaMascota, Tamano, PesoIdeal, PoliticaApoyo, CostoAlimento.

## 3. Atributos de Calidad y Seguridad (Mitigación de Abusos)
- **CA-02 (Modificación no autorizada)**: Implementar autenticación JWT y control de acceso basado en roles (RBAC).
- **CA-03 (Duplicidad de beneficios)**: El backend debe validar la `CURP` única. Máximo 3 mascotas por ciudadano.

## 4. Límites Estrictos de Colaboración (GitHub y Roles de Desarrollo)
- **Separación de Dominios**: El repositorio de GitHub debe tener dos carpetas raíz estrictamente separadas: `/frontend` y `/backend`.
- **Regla de No Intromisión (Bloqueo Activo)**: 
  - Si el usuario actual da una instrucción para el **Backend**, la IA tiene **PROHIBIDO** modificar, reescribir o sugerir cambios directos en la carpeta `/frontend`.
  - Si el usuario actual da una instrucción para el **Frontend**, la IA tiene **PROHIBIDO** modificar la carpeta `/backend` o los esquemas de base de datos.
- **Resolución de Conflictos Cross-Domain**: Si una instrucción requiere inevitablemente tocar ambas áreas (ej. cambiar el nombre de una variable en un endpoint que rompe la vista en React), la IA debe **DENEGAR** la ejecución automática, alertar al usuario del impacto cruzado, y exigir que el usuario apruebe explícitamente el cambio o notifique a su compañero vía GitHub (ej. creando un Issue o Pull Request).

## 5. Estándares de Código
- Documentar todas las funciones matemáticas de las Tablas A y B.
- Pruebas E2E obligatorias antes del despliegue final.