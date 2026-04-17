/**
 * api.service.js
 * Capa de abstracción entre el Frontend y el Backend.
 *
 * FASE 2: Retorna datos de los mocks locales.
 * FASE 3: Cambiar USE_MOCKS = false y configurar API_BASE_URL para
 *         conectar con el API Gateway real del Track A.
 *
 * Toda llamada del UI debe pasar por este servicio — NUNCA importar mocks directamente
 * desde los componentes/páginas, para facilitar el switch a la API real.
 */

import {
  TIPOS_MASCOTA,
  RAZAS_MASCOTA,
  TAMANOS,
  getPesoIdeal,
  getRazasPorTipo,
  calcularIMA,
  clasificarIMA,
} from '../mocks/catalogos.mock.js';

import {
  listSolicitudes,
  crearSolicitudMock,
  actualizarEstadoMock,
  getSolicitudesPorCURPMock,
  POLITICAS_APOYO,
  COSTOS_ALIMENTO,
  calcularMontoSugerido,
  getMetricasAdmin,
} from '../mocks/solicitudes.mock.js';

/** Simula latencia de red para hacer el sistema más realista en Fase 2 */
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const USE_MOCKS = true;               // Cambiar a false en Fase 3
const API_BASE_URL = '/api';          // URL del API Gateway (Track A)

// ─── CATÁLOGOS ───────────────────────────────────────────────────────────────

/** GET /api/catalogos/tipos → Lista de tipos de mascota */
export async function getTiposMascota() {
  if (USE_MOCKS) { await delay(); return TIPOS_MASCOTA; }
  const res = await fetch(`${API_BASE_URL}/catalogos/tipos`);
  return res.json();
}

/** GET /api/catalogos/razas?tipoId=X → Razas filtradas por tipo */
export async function getRazas(tipoId) {
  if (USE_MOCKS) { await delay(150); return getRazasPorTipo(tipoId); }
  const res = await fetch(`${API_BASE_URL}/catalogos/razas?tipoId=${tipoId}`);
  return res.json();
}

/** GET /api/catalogos/tamanos → Lista de tamaños */
export async function getTamanos() {
  if (USE_MOCKS) { await delay(); return TAMANOS; }
  const res = await fetch(`${API_BASE_URL}/catalogos/tamanos`);
  return res.json();
}

/** GET /api/catalogos/peso-ideal?razaId=X&tamanoId=Y */
export async function getPesoIdealService(razaId, tamanoId) {
  if (USE_MOCKS) { await delay(100); return getPesoIdeal(razaId, tamanoId); }
  const res = await fetch(`${API_BASE_URL}/catalogos/peso-ideal?razaId=${razaId}&tamanoId=${tamanoId}`);
  return res.json();
}

// ─── IMA ─────────────────────────────────────────────────────────────────────

/** Calcula el IMA localmente (lógica de frontend para feedback inmediato) */
export function calcularIMAService(pesoActual, pesoIdeal) {
  return calcularIMA(pesoActual, pesoIdeal);
}

/** Clasifica el IMA según las políticas del SRS */
export function clasificarIMAService(ima) {
  return clasificarIMA(ima);
}

// ─── SOLICITUDES ─────────────────────────────────────────────────────────────

/** GET /api/solicitudes → Lista todas las solicitudes (Autoridad) */
export async function getSolicitudes() {
  if (USE_MOCKS) { await delay(400); return listSolicitudes(); }
  const res = await fetch(`${API_BASE_URL}/solicitudes`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

/** GET /api/solicitudes?curp=X → Solicitudes de un ciudadano */
export async function getMisSolicitudes(curp) {
  if (USE_MOCKS) { await delay(300); return getSolicitudesPorCURPMock(curp); }
  const res = await fetch(`${API_BASE_URL}/solicitudes?curp=${curp}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

/**
 * POST /api/solicitudes → Crear nueva solicitud de apoyo
 * @param {object} datos - { dueno, mascota } según el SRS
 */
export async function crearSolicitud(datos) {
  if (USE_MOCKS) { await delay(600); return crearSolicitudMock(datos); }
  const res = await fetch(`${API_BASE_URL}/solicitudes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(datos),
  });
  return res.json();
}

/**
 * PATCH /api/solicitudes/:id → Aprobar o Rechazar (Autoridad)
 * @param {string} id        - ID de la solicitud
 * @param {string} estado    - 'APROBADO' | 'RECHAZADO'
 * @param {string} comentario - Comentario de la autoridad
 */
export async function actualizarEstadoSolicitud(id, estado, comentario) {
  if (USE_MOCKS) { await delay(400); return actualizarEstadoMock(id, estado, comentario); }
  const res = await fetch(`${API_BASE_URL}/solicitudes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ estado, comentario }),
  });
  return res.json();
}

// ─── ADMINISTRACIÓN ───────────────────────────────────────────────────────────

/** GET /api/admin/politicas → PoliticaApoyo */
export async function getPoliticasApoyo() {
  if (USE_MOCKS) { await delay(200); return POLITICAS_APOYO; }
  const res = await fetch(`${API_BASE_URL}/admin/politicas`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

/** GET /api/admin/costos-alimento → CostoAlimento */
export async function getCostosAlimento() {
  if (USE_MOCKS) { await delay(200); return COSTOS_ALIMENTO; }
  const res = await fetch(`${API_BASE_URL}/admin/costos-alimento`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

/** GET /api/admin/metricas → Dashboard metrics */
export async function getMetricas() {
  if (USE_MOCKS) { await delay(300); return getMetricasAdmin(); }
  const res = await fetch(`${API_BASE_URL}/admin/metricas`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

// ─── AUTH (simulada con sessionStorage en Fase 2) ─────────────────────────────

const MOCK_USERS = [
  { id: 1, nombre: 'María González',    curp: 'GOMA850312MDFNRR09', password: '1234', rol: 'ciudadano'  },
  { id: 2, nombre: 'Oficial Ramírez',   curp: 'RAOF900615HDFMRR05', password: '1234', rol: 'autoridad'  },
  { id: 3, nombre: 'Admin Sistema',     curp: 'ADSI800101HDFMIN01', password: '1234', rol: 'admin'      },
];

/**
 * POST /api/auth/login
 * En Fase 2: valida contra MOCK_USERS y guarda sesión en sessionStorage.
 * CURP es requerida para login pero la validación real del CURP es responsabilidad de la Autoridad.
 */
export async function login(curp, password) {
  if (USE_MOCKS) {
    await delay(500);
    const user = MOCK_USERS.find(u => u.curp.toUpperCase() === curp.toUpperCase() && u.password === password);
    if (!user) throw new Error('CURP o contraseña incorrectos');
    const session = { ...user };
    delete session.password;
    sessionStorage.setItem('session', JSON.stringify(session));
    return session;
  }
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curp, password }),
  });
  if (!res.ok) throw new Error('Credenciales incorrectas');
  const data = await res.json();
  sessionStorage.setItem('session', JSON.stringify(data));
  return data;
}

export function logout() {
  sessionStorage.removeItem('session');
}

export function getSession() {
  const raw = sessionStorage.getItem('session');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  // En Fase 3, retornar el JWT real del backend
  return 'mock-jwt-token';
}

export function calcularMontoSugeridoService(ima) {
  return calcularMontoSugerido(ima);
}
