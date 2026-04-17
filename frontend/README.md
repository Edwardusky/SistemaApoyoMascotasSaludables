# 🐾 Sistema de Apoyo para Mascotas Saludables — Frontend

> **Track B — React SPA** | Arquitectura Híbrida (Cliente-Servidor + Microservicios)

Este directorio contiene el Frontend del sistema gubernamental que permite a ciudadanos
registrar mascotas, calcular el **Índice de Masa Animal (IMA)** y solicitar bonos económicos.

---

## 📁 Estructura del Proyecto

```
frontend/
│
├── public/                        # Archivos estáticos públicos
│   └── vite.svg
│
├── src/
│   │
│   ├── assets/                    # Logos e íconos del sistema
│   │
│   ├── components/                # Componentes reutilizables
│   │   ├── Navbar.jsx             # Barra de navegación superior (logo + rol del usuario)
│   │   └── Sidebar.jsx            # Menú lateral condicional por rol
│   │
│   ├── pages/                     # Vistas principales (una por rol/función)
│   │   ├── LoginPage.jsx          # Autenticación: CURP + contraseña (CURP no validada automáticamente)
│   │   ├── CiudadanoPage.jsx      # RF-01/RF-02: Registro de mascota + IMA en tiempo real + certificado vet.
│   │   ├── AutoridadPage.jsx      # RF-03/RF-04: Bandeja de solicitudes, aprobar/rechazar
│   │   └── AdminPage.jsx          # RF-05: Gestión de PoliticaApoyo y CostoAlimento
│   │
│   ├── mocks/                     # Datos simulados (reemplazo de llamadas reales en Fase 3)
│   │   ├── catalogos.mock.js      # TipoMascota, RazaMascota, Tamano, PesoIdeal
│   │   └── solicitudes.mock.js    # SolicitudApoyo, CostoAlimento, PoliticaApoyo
│   │
│   ├── services/                  # Capa de abstracción API (switch mock ↔ real)
│   │   └── api.service.js         # Todos los fetch/axios pasan por aquí
│   │
│   ├── App.jsx                    # Configuración central de rutas (React Router)
│   ├── main.jsx                   # Punto de entrada de la aplicación
│   └── index.css                  # Design System global (tokens, componentes base)
│
├── index.html                     # HTML raíz (SPA)
├── package.json                   # Dependencias del proyecto
├── vite.config.js                 # Configuración de Vite
└── README.md                      # Este archivo 📄
```

---

## 🚀 Cómo Iniciar

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Levantar servidor de desarrollo
npm run dev
```

El servidor estará disponible en: **http://localhost:5173**

---

## 👤 Roles del Sistema

| Rol | Acceso | Página principal |
|-----|--------|------------------|
| **Ciudadano** | Registrar mascotas y solicitar apoyo | `/ciudadano` |
| **Autoridad** | Revisar y aprobar/rechazar solicitudes | `/autoridad` |
| **Administrador** | Gestionar políticas y costos | `/admin` |

> ⚠️ En la Fase 2 (desarrollo actual), los roles se simulan mediante **mocks**.
> En la Fase 3 (integración) se conectarán al API Gateway del Backend (Track A).

---

## 📐 Fórmula del IMA (Índice de Masa Animal)

```
IMA = Peso Actual (kg) / Peso Ideal (kg)

Interpretación:
  IMA < 0.85  →  Bajo peso       (badge ROJO)
  IMA 0.85–1.15  →  Peso ideal   (badge VERDE)
  IMA > 1.15  →  Sobrepeso       (badge NARANJA)
```

---

## 🔗 Integración con Backend (Track A)

Este Frontend se comunicará con el **API Gateway** del Backend mediante:
- `GET /api/catalogos/tipos` → Lista de tipos de mascota
- `GET /api/catalogos/razas?tipoId=` → Razas filtradas por tipo
- `POST /api/solicitudes` → Enviar solicitud de apoyo
- `GET /api/solicitudes` → Listar solicitudes (Autoridad)
- `PATCH /api/solicitudes/:id` → Aprobar/Rechazar (Autoridad)

> Durante la **Fase 2**, estas llamadas son interceptadas por `src/services/api.service.js`
> que retorna datos de `src/mocks/`.

---

## ⚠️ Regla de No Intromisión (Bloqueo Activo)

Este repositorio sigue el protocolo de **Separación de Dominios**:
- ✅ Cualquier cambio en `/frontend` debe ser aprobado por el **Desarrollador Frontend (Track B)**
- 🚫 **PROHIBIDO** modificar archivos en `/backend` desde este track
- 🚫 **PROHIBIDO** alterar esquemas SQL o migraciones de base de datos

Conflictos cross-domain → **Crear un Issue o Pull Request en GitHub** y notificar al equipo.
