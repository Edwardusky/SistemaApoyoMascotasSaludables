/**
 * solicitudes.mock.js
 * Datos simulados de SolicitudApoyo, PoliticaApoyo y CostoAlimento.
 * FASE 2 (Track B): Serán reemplazados por llamadas reales al API Gateway en la Fase 3.
 *
 * Contratos de API simulados:
 *   GET    /api/solicitudes             → listSolicitudes()
 *   POST   /api/solicitudes             → crearSolicitud()
 *   PATCH  /api/solicitudes/:id         → actualizarEstado()
 *   GET    /api/admin/politicas         → POLITICAS_APOYO
 *   GET    /api/admin/costos-alimento   → COSTOS_ALIMENTO
 */

// Estado posible de una solicitud
export const ESTADOS = {
  PENDIENTE:  'PENDIENTE',
  APROBADO:   'APROBADO',
  RECHAZADO:  'RECHAZADO',
  EN_REVISION:'EN_REVISION',
};

// Almacén en memoria (simula la BD transaccional)
let _solicitudes = [
  {
    id: 'SOL-2024-001',
    fechaCreacion: '2024-09-10T09:15:00Z',
    estado: ESTADOS.PENDIENTE,
    // Dueño
    dueno: {
      nombre: 'María González',
      curp: 'GOMA850312MDFNRR09',
      telefono: '7411234567',
      email: 'maria.gonzalez@gmail.com',
    },
    // Mascota
    mascota: {
      nombre: 'Max',
      tipoId: 1, tipoNombre: 'Perro',
      razaId: 1,  razaNombre: 'Labrador Retriever',
      tamanoId: 4, tamanoNombre: 'Grande',
      pesoActualKg: 38,
      pesoIdealKg: 32,
      ima: 1.19,
      clasificacionIMA: 'Sobrepeso',
      certificadoVeterinario: 'certificado_max_vet.pdf',
    },
    montoSugerido: 850,
    comentarioAutoridad: '',
  },
  {
    id: 'SOL-2024-002',
    fechaCreacion: '2024-09-11T14:30:00Z',
    estado: ESTADOS.APROBADO,
    dueno: {
      nombre: 'Carlos Ramírez',
      curp: 'RAMC900615HDFMRR05',
      telefono: '7419876543',
      email: 'carlos.ramirez@outlook.com',
    },
    mascota: {
      nombre: 'Luna',
      tipoId: 2, tipoNombre: 'Gato',
      razaId: 17, razaNombre: 'Doméstico / Mestizo',
      tamanoId: 2, tamanoNombre: 'Pequeño',
      pesoActualKg: 3.8,
      pesoIdealKg: 4.5,
      ima: 0.84,
      clasificacionIMA: 'Bajo Peso',
      certificadoVeterinario: null,
    },
    montoSugerido: 650,
    comentarioAutoridad: 'Mascota requiere plan nutricional. Apoyo aprobado.',
  },
  {
    id: 'SOL-2024-003',
    fechaCreacion: '2024-09-12T11:00:00Z',
    estado: ESTADOS.RECHAZADO,
    dueno: {
      nombre: 'Ana Torres',
      curp: 'TOAA950201MDFRRN07',
      telefono: '7412345678',
      email: 'ana.torres@gmail.com',
    },
    mascota: {
      nombre: 'Rocky',
      tipoId: 1, tipoNombre: 'Perro',
      razaId: 2, razaNombre: 'Pastor Alemán',
      tamanoId: 4, tamanoNombre: 'Grande',
      pesoActualKg: 34,
      pesoIdealKg: 35,
      ima: 0.97,
      clasificacionIMA: 'Peso Ideal',
      certificadoVeterinario: 'certif_rocky.pdf',
    },
    montoSugerido: 0,
    comentarioAutoridad: 'IMA dentro del rango saludable. No aplica para apoyo.',
  },
  {
    id: 'SOL-2024-004',
    fechaCreacion: '2024-09-13T08:45:00Z',
    estado: ESTADOS.EN_REVISION,
    dueno: {
      nombre: 'Luis Hernández',
      curp: 'HEFL880430HDFRNR03',
      telefono: '7413456789',
      email: 'luis.hdez@yahoo.com',
    },
    mascota: {
      nombre: 'Michi',
      tipoId: 2, tipoNombre: 'Gato',
      razaId: 12, razaNombre: 'Persa',
      tamanoId: 3, tamanoNombre: 'Mediano',
      pesoActualKg: 9.5,
      pesoIdealKg: 7,
      ima: 1.36,
      clasificacionIMA: 'Obesidad',
      certificadoVeterinario: 'certif_michi_persa.pdf',
    },
    montoSugerido: 1200,
    comentarioAutoridad: '',
  },
];

/** Retorna todas las solicitudes (copia defensiva) */
export function listSolicitudes() {
  return [..._solicitudes];
}

/** Retorna las solicitudes de un ciudadano por CURP */
export function getSolicitudesPorCURPMock(curp) {
  return _solicitudes.filter(s => s.dueno.curp === curp);
}

/** Crea una nueva solicitud y la agrega al almacén */
export function crearSolicitudMock(datos) {
  const nueva = {
    id: `SOL-2024-${String(_solicitudes.length + 1).padStart(3, '0')}`,
    fechaCreacion: new Date().toISOString(),
    estado: ESTADOS.PENDIENTE,
    montoSugerido: calcularMontoSugerido(datos.mascota?.ima),
    comentarioAutoridad: '',
    ...datos,
  };
  _solicitudes.push(nueva);
  return nueva;
}

/** Actualiza el estado de una solicitud (Aprobar / Rechazar) */
export function actualizarEstadoMock(id, nuevoEstado, comentario = '') {
  const idx = _solicitudes.findIndex(s => s.id === id);
  if (idx === -1) throw new Error(`Solicitud ${id} no encontrada`);
  _solicitudes[idx] = { ..._solicitudes[idx], estado: nuevoEstado, comentarioAutoridad: comentario };
  return _solicitudes[idx];
}

/**
 * TABLA B — Políticas de Apoyo por Clasificación IMA
 * Fuente: SRS Tabla B — PoliticaApoyo
 *
 * Determina el monto de apoyo ($MXN) según el IMA de la mascota.
 */
export const POLITICAS_APOYO = [
  { id: 1, clasificacionIMA: 'Bajo Peso Severo', imaMin: 0.00, imaMax: 0.74, montoPeso: 1500, descripcion: 'Apoyo máximo: riesgo crítico de salud' },
  { id: 2, clasificacionIMA: 'Bajo Peso',        imaMin: 0.75, imaMax: 0.84, montoPeso: 1000, descripcion: 'Apoyo alto: por debajo del rango saludable' },
  { id: 3, clasificacionIMA: 'Peso Ideal',        imaMin: 0.85, imaMax: 1.15, montoPeso: 0,    descripcion: 'Sin apoyo: mascota en rango saludable' },
  { id: 4, clasificacionIMA: 'Sobrepeso',         imaMin: 1.16, imaMax: 1.30, montoPeso: 850,  descripcion: 'Apoyo moderado: plan nutricional' },
  { id: 5, clasificacionIMA: 'Obesidad',          imaMin: 1.31, imaMax: 9.99, montoPeso: 1200, descripcion: 'Apoyo alto: riesgo de salud elevado' },
];

/** Calcula el monto sugerido según el IMA */
export function calcularMontoSugerido(ima) {
  if (!ima) return 0;
  const politica = POLITICAS_APOYO.find(p => ima >= p.imaMin && ima <= p.imaMax);
  return politica ? politica.montoPeso : 0;
}

/** Costo de alimento mensual (MXN) por tipo y tamaño */
export const COSTOS_ALIMENTO = [
  { id: 1, tipoId: 1, tipoNombre: 'Perro', tamanoId: 1, tamanoNombre: 'Mini / Toy', costoMensual: 280 },
  { id: 2, tipoId: 1, tipoNombre: 'Perro', tamanoId: 2, tamanoNombre: 'Pequeño',    costoMensual: 380 },
  { id: 3, tipoId: 1, tipoNombre: 'Perro', tamanoId: 3, tamanoNombre: 'Mediano',    costoMensual: 520 },
  { id: 4, tipoId: 1, tipoNombre: 'Perro', tamanoId: 4, tamanoNombre: 'Grande',     costoMensual: 720 },
  { id: 5, tipoId: 1, tipoNombre: 'Perro', tamanoId: 5, tamanoNombre: 'Gigante',    costoMensual: 980 },
  { id: 6, tipoId: 2, tipoNombre: 'Gato',  tamanoId: 1, tamanoNombre: 'Mini / Toy', costoMensual: 220 },
  { id: 7, tipoId: 2, tipoNombre: 'Gato',  tamanoId: 2, tamanoNombre: 'Pequeño',    costoMensual: 310 },
  { id: 8, tipoId: 2, tipoNombre: 'Gato',  tamanoId: 3, tamanoNombre: 'Mediano',    costoMensual: 450 },
  { id: 9, tipoId: 2, tipoNombre: 'Gato',  tamanoId: 4, tamanoNombre: 'Grande',     costoMensual: 600 },
];

/** Métricas del dashboard de administrador */
export function getMetricasAdmin() {
  const total = _solicitudes.length;
  const aprobadas = _solicitudes.filter(s => s.estado === ESTADOS.APROBADO).length;
  const pendientes = _solicitudes.filter(s => s.estado === ESTADOS.PENDIENTE).length;
  const rechazadas = _solicitudes.filter(s => s.estado === ESTADOS.RECHAZADO).length;
  const montoTotal = _solicitudes
    .filter(s => s.estado === ESTADOS.APROBADO)
    .reduce((acc, s) => acc + (s.montoSugerido || 0), 0);
  return { total, aprobadas, pendientes, rechazadas, montoTotal };
}
