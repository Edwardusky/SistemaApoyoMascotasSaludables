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
  const data = await apiFetch(`${API_BASE_URL}/solicitudes/`, { headers: authHeaders() });
  return data.map(mapSolicitudToFrontend);
}

/** GET /api/solicitudes/ — Solicitudes del ciudadano autenticado */
export async function getMisSolicitudes() {
  const data = await apiFetch(`${API_BASE_URL}/solicitudes/`, { headers: authHeaders() });
  return data.map(mapSolicitudToFrontend);
}

function mapSolicitudToFrontend(sol) {
  return {
    ...sol,
    id: sol.id,
    fechaCreacion: sol.created_at,
    estado: sol.estado,
    montoSugerido: Number(sol.monto_sugerido_mxn) || 0,
    comentarioAutoridad: sol.comentario_autoridad,
    certificadoVeterinario: sol.certificado_vet_path,
    mascota: {
      nombre: sol.mascota_nombre || 'Mascota',
      tipoNombre: sol.tipo_nombre || 'Desconocido',
      razaNombre: sol.raza_nombre || 'Desconocido',
      tamanoNombre: sol.tamano_nombre || 'Desconocido',
      pesoActualKg: Number(sol.peso_actual_kg),
      pesoIdealKg: Number(sol.peso_ideal_kg),
      ima: Number(sol.ima_calculado),
      clasificacionIMA: sol.clasificacion_ima
    },
    dueno: {
      nombre: sol.dueno_nombre,
      curp: sol.curp
    }
  };
}

/** POST /api/solicitudes/ — Crear nueva solicitud */
export async function crearSolicitud(datos) {
  const row = await apiFetch(`${API_BASE_URL}/solicitudes/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });

  return {
    ...row,
    id: row.id,
    fechaCreacion: row.created_at,
    estado: row.estado,
    montoSugerido: Number(row.monto_sugerido_mxn) || 0,
    comentarioAutoridad: row.comentario_autoridad,
    certificadoVeterinario: row.certificado_vet_path,
    mascota: {
      nombre: datos.mascota.nombre,
      tipoNombre: datos.mascota.tipoNombre,
      razaNombre: datos.mascota.razaNombre,
      tamanoNombre: datos.mascota.tamanoNombre,
      pesoActualKg: Number(row.peso_actual_kg),
      pesoIdealKg: Number(row.peso_ideal_kg),
      ima: Number(row.ima_calculado),
      clasificacionIMA: row.clasificacion_ima
    },
    dueno: {
      nombre: datos.dueno.nombre,
      curp: datos.dueno.curp
    }
  };
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
  const data = await apiFetch(`${API_BASE_URL}/admin/politicas`);
  return data.map(p => ({
    ...p,
    clasificacionIMA: p.clasificacion_ima,
    imaMin: Number(p.ima_min),
    imaMax: Number(p.ima_max),
    montoPeso: Number(p.monto_apoyo_mxn) || 0,
    descripcion: p.descripcion
  }));
}

/** GET /api/admin/costos-alimento */
export async function getCostosAlimento() {
  const data = await apiFetch(`${API_BASE_URL}/admin/costos-alimento`);
  return data.map(c => ({
    ...c,
    tipoNombre: c.tipo_nombre,
    tamanoNombre: c.tamano_nombre,
    costoMensual: Number(c.costo_mensual) || 0
  }));
}

/** GET /api/admin/metricas */
export async function getMetricas() {
  const data = await apiFetch(`${API_BASE_URL}/admin/metricas`, { headers: authHeaders() });
  return {
    total: Number(data.total) || 0,
    pendientes: Number(data.pendientes) || 0,
    enRevision: Number(data.en_revision) || 0,
    aprobadas: Number(data.aprobadas) || 0,
    rechazadas: Number(data.rechazadas) || 0,
    montoTotal: Number(data.monto_total_aprobado) || 0
  };
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

// ─── ADMIN DE USUARIOS (ms_usuarios) ─────────────────────────────────────────

export async function getUsuariosAdmin() {
  return apiFetch(`${API_BASE_URL}/usuarios/admin/usuarios`, { headers: authHeaders() });
}

export async function createUsuarioAdmin(datos) {
  return apiFetch(`${API_BASE_URL}/usuarios/admin/usuarios`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
}

export async function updateUsuarioAdmin(id, datos) {
  return apiFetch(`${API_BASE_URL}/usuarios/admin/usuarios/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
}

export async function deleteUsuarioAdmin(id) {
  return apiFetch(`${API_BASE_URL}/usuarios/admin/usuarios/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export function getSession() {
  const raw = sessionStorage.getItem('session');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  let token = sessionStorage.getItem('token') || '';
  
  // Limpieza absoluta de formato
  try {
    const parsed = JSON.parse(token);
    if (parsed && parsed.token) token = parsed.token;
    else if (typeof parsed === 'string') token = parsed;
  } catch (e) {} // Ignorar si no es JSON
  
  // Remover prefijo si se guardó por error
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7);
  }
  
  return token.trim();
}
