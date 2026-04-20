/**
 * api.service.js — FASE 3 (Backend real conectado)
 * Capa de abstracción entre el Frontend y el API Gateway.
 *
 * Rutas del API Gateway (nginx.conf):
 *   /api/usuarios/    → ms_usuarios:3000/
 *   /api/evaluacion/  → ms_evaluacion:3000/
 *   /api/solicitudes/ → ms_solicitudes:3000/
 *   /api/admin/       → ms_administracion:3000/
 */

import { calcularIMA, clasificarIMA } from '../mocks/catalogos.mock.js';
import { calcularMontoSugerido }       from '../mocks/solicitudes.mock.js';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const USE_MOCKS    = false;
const API_BASE_URL = 'http://localhost:8080/api';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Retorna los headers comunes para peticiones autenticadas */
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

/**
 * Wrapper genérico de fetch con manejo de errores unificado.
 * Lanza un Error con el mensaje del backend si la respuesta no es OK.
 */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const body = await res.json(); msg = body.error || body.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── CATÁLOGOS (ms_evaluacion) ───────────────────────────────────────────────

/** GET /api/evaluacion/catalogos/tipos */
export async function getTiposMascota() {
  return apiFetch(`${API_BASE_URL}/evaluacion/catalogos/tipos`);
}

/** GET /api/evaluacion/catalogos/razas?tipoId=X */
export async function getRazas(tipoId) {
  return apiFetch(`${API_BASE_URL}/evaluacion/catalogos/razas?tipoId=${tipoId}`);
}

/** GET /api/evaluacion/catalogos/tamanos */
export async function getTamanos() {
  return apiFetch(`${API_BASE_URL}/evaluacion/catalogos/tamanos`);
}

/** GET /api/evaluacion/catalogos/peso-ideal?razaId=X&tamanoId=Y */
export async function getPesoIdealService(razaId, tamanoId) {
  try {
    return await apiFetch(
      `${API_BASE_URL}/evaluacion/catalogos/peso-ideal?razaId=${razaId}&tamanoId=${tamanoId}`
    );
  } catch {
    return null; // Combinación no encontrada
  }
}

// ─── IMA (cálculo local para feedback inmediato) ─────────────────────────────

/** Calcula el IMA localmente: pesoActual / pesoIdeal */
export function calcularIMAService(pesoActual, pesoIdeal) {
  return calcularIMA(pesoActual, pesoIdeal);
}

/** Clasifica el IMA según rangos de la Tabla B del SRS */
export function clasificarIMAService(ima) {
  return clasificarIMA(ima);
}

export function calcularMontoSugeridoService(ima) {
  return calcularMontoSugerido(ima);
}

// ─── SOLICITUDES (ms_solicitudes) ────────────────────────────────────────────

/** GET /api/solicitudes/ — Listar (rol filtra en backend) */
export async function getSolicitudes() {
  return apiFetch(`${API_BASE_URL}/solicitudes/`, { headers: authHeaders() });
}

/** GET /api/solicitudes/ — Solicitudes del ciudadano autenticado */
export async function getMisSolicitudes() {
  return apiFetch(`${API_BASE_URL}/solicitudes/`, { headers: authHeaders() });
}

/** POST /api/solicitudes/ — Crear nueva solicitud */
export async function crearSolicitud(datos) {
  return apiFetch(`${API_BASE_URL}/solicitudes/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
}

/** PATCH /api/solicitudes/:id — Aprobar o Rechazar */
export async function actualizarEstadoSolicitud(id, estado, comentario_autoridad) {
  return apiFetch(`${API_BASE_URL}/solicitudes/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ estado, comentario_autoridad }),
  });
}

// ─── ADMINISTRACIÓN (ms_administracion) ──────────────────────────────────────

/** GET /api/admin/politicas */
export async function getPoliticasApoyo() {
  return apiFetch(`${API_BASE_URL}/admin/politicas`);
}

/** GET /api/admin/costos-alimento */
export async function getCostosAlimento() {
  return apiFetch(`${API_BASE_URL}/admin/costos-alimento`);
}

/** GET /api/admin/metricas */
export async function getMetricas() {
  return apiFetch(`${API_BASE_URL}/admin/metricas`, { headers: authHeaders() });
}

// ─── AUTH (ms_usuarios) ──────────────────────────────────────────────────────

/**
 * POST /api/usuarios/login
 * Autentica con CURP + contraseña y guarda el JWT + sesión en sessionStorage.
 * La validación real del CURP es responsabilidad de la Autoridad humana.
 *
 * @param {string} curp
 * @param {string} password
 * @returns {{ token: string, usuario: { id, nombre, curp, rol } }}
 */
export async function login(curp, password) {
  const data = await apiFetch(`${API_BASE_URL}/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curp: curp.toUpperCase(), password }),
  });
  // Guardar token Y sesión en sessionStorage
  sessionStorage.setItem('token', data.token);
  sessionStorage.setItem('session', JSON.stringify(data.usuario));
  return data.usuario;
}

/**
 * POST /api/usuarios/registro
 * Registra un nuevo ciudadano en el sistema.
 * CURP único validado por constraint de BD (CA-03).
 *
 * @param {{ curp, nombre, telefono, email, password }} datos
 */
export async function registro(datos) {
  return apiFetch(`${API_BASE_URL}/usuarios/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, curp: datos.curp.toUpperCase() }),
  });
}

export function logout() {
  sessionStorage.removeItem('session');
  sessionStorage.removeItem('token');
}

export function getSession() {
  const raw = sessionStorage.getItem('session');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return sessionStorage.getItem('token') || '';
}
