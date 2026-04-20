/**
 * catalogos.mock.js
 * Datos simulados de catálogos basados en el diccionario de datos del SRS.
 * FASE 2 (Track B): Estos datos serán reemplazados por llamadas reales al API Gateway en la Fase 3.
 *
 * Contratos de API simulados:
 *   GET /api/catalogos/tipos       → TIPOS_MASCOTA
 *   GET /api/catalogos/razas       → RAZAS_MASCOTA (filtrar por tipoId)
 *   GET /api/catalogos/tamanos     → TAMANOS
 *   GET /api/catalogos/peso-ideal  → PESOS_IDEALES (filtrar por razaId + tamanoId)
 */

export const TIPOS_MASCOTA = [
  { id: 1, nombre: 'Perro', emoji: '🐕' },
  { id: 2, nombre: 'Gato', emoji: '🐈' },
];

export const RAZAS_MASCOTA = [
  // --- Perros (tipoId: 1) ---
  { id: 1, tipoId: 1, nombre: 'Labrador Retriever' },
  { id: 2, tipoId: 1, nombre: 'Pastor Alemán' },
  { id: 3, tipoId: 1, nombre: 'Bulldog Francés' },
  { id: 4, tipoId: 1, nombre: 'Chihuahua' },
  { id: 5, tipoId: 1, nombre: 'Golden Retriever' },
  { id: 6, tipoId: 1, nombre: 'Poodle' },
  { id: 7, tipoId: 1, nombre: 'Beagle' },
  { id: 8, tipoId: 1, nombre: 'Yorkshire Terrier' },
  { id: 9, tipoId: 1, nombre: 'Dóberman' },
  { id: 10, tipoId: 1, nombre: 'Mestizo / Criollo' },

  // --- Gatos (tipoId: 2) ---
  { id: 11, tipoId: 2, nombre: 'Siamés' },
  { id: 12, tipoId: 2, nombre: 'Persa' },
  { id: 13, tipoId: 2, nombre: 'Maine Coon' },
  { id: 14, tipoId: 2, nombre: 'Bengalí' },
  { id: 15, tipoId: 2, nombre: 'Ragdoll' },
  { id: 16, tipoId: 2, nombre: 'Sphynx' },
  { id: 17, tipoId: 2, nombre: 'Doméstico / Mestizo' },
];

export const TAMANOS = [
  { id: 1, nombre: 'Mini / Toy', descripcion: 'Menos de 5 kg en adulto' },
  { id: 2, nombre: 'Pequeño', descripcion: '5 – 10 kg en adulto' },
  { id: 3, nombre: 'Mediano', descripcion: '10 – 25 kg en adulto' },
  { id: 4, nombre: 'Grande', descripcion: '25 – 45 kg en adulto' },
  { id: 5, nombre: 'Gigante', descripcion: 'Más de 45 kg en adulto' },
];

/**
 * TABLA A — Pesos Ideales por Raza y Tamaño (kg)
 * Fuente: SRS Tabla A — Peso Ideal de Referencia
 *
 * @param {number} pesoActual  - Peso actual de la mascota en kg
 * @param {number} pesoIdeal   - Peso ideal de referencia en kg
 * @returns {number} IMA calculado con 2 decimales
 */
export function calcularIMA(pesoActual, pesoIdeal) {
  if (!pesoIdeal || pesoIdeal <= 0) return null;
  return Math.round((pesoActual / pesoIdeal) * 100) / 100;
}

/**
 * Devuelve la clasificación del IMA según rangos definidos en el SRS.
 * @param {number} ima - Valor numérico del IMA
 * @returns {{ label: string, clase: string, descripcion: string }}
 */
export function clasificarIMA(ima) {
  if (ima === null || isNaN(ima)) return { label: 'Sin calcular', clase: 'neutral', descripcion: '—' };
  if (ima < 0.85)  return { label: 'Bajo peso',  clase: 'underweight', descripcion: 'Por debajo del rango saludable (70% de apoyo)' };
  if (ima <= 1.15) return { label: 'Peso ideal', clase: 'normal',      descripcion: 'Rango saludable (100% de apoyo)' };
  if (ima <= 1.30) return { label: 'Sobrepeso',  clase: 'overweight',  descripcion: 'Requiere plan de dieta (30% de apoyo)' };
  return           { label: 'Obeso',      clase: 'obese',       descripcion: 'Riesgo alto para la salud (0% de apoyo)' };
}

export const POLITICAS_APOYO = [
  { id: 1, clasificacionIMA: 'Bajo peso',        imaMin: 0.00, imaMax: 0.84, montoPeso: 70,  descripcion: 'Por debajo del rango saludable (70% de apoyo)' },
  { id: 2, clasificacionIMA: 'Peso ideal',       imaMin: 0.85, imaMax: 1.15, montoPeso: 100, descripcion: 'Rango saludable - 100% de apoyo económico' },
  { id: 3, clasificacionIMA: 'Sobrepeso',        imaMin: 1.16, imaMax: 1.30, montoPeso: 30,  descripcion: 'Plan nutricional requerido (30% de apoyo)' },
  { id: 4, clasificacionIMA: 'Obeso',            imaMin: 1.31, imaMax: 9.99, montoPeso: 0,   descripcion: 'Riesgo de salud elevado (0% de apoyo)' },
];

// Peso ideal de referencia (kg): clave = `${razaId}-${tamanoId}`
export const PESOS_IDEALES = {
  // Labrador Retriever
  '1-4': { pesoIdeal: 32, pesoMinKg: 27, pesoMaxKg: 36 },
  // Pastor Alemán
  '2-4': { pesoIdeal: 35, pesoMinKg: 30, pesoMaxKg: 40 },
  // Bulldog Francés
  '3-2': { pesoIdeal: 9,  pesoMinKg: 7,  pesoMaxKg: 13 },
  // Chihuahua
  '4-1': { pesoIdeal: 2.5, pesoMinKg: 1.5, pesoMaxKg: 3.5 },
  // Golden Retriever
  '5-4': { pesoIdeal: 34, pesoMinKg: 29, pesoMaxKg: 38 },
  // Poodle
  '6-2': { pesoIdeal: 7,  pesoMinKg: 6,  pesoMaxKg: 9  },
  // Beagle
  '7-3': { pesoIdeal: 13, pesoMinKg: 10, pesoMaxKg: 16 },
  // Yorkshire
  '8-1': { pesoIdeal: 2.5, pesoMinKg: 2, pesoMaxKg: 3.5 },
  // Dóberman
  '9-4': { pesoIdeal: 35, pesoMinKg: 30, pesoMaxKg: 40 },
  // Mestizo Perro
  '10-3': { pesoIdeal: 16, pesoMinKg: 12, pesoMaxKg: 22 },
  // Siamés (Gato - Mediano)
  '11-3': { pesoIdeal: 4.5, pesoMinKg: 3.5, pesoMaxKg: 5.5 },
  // Persa (Gato - Mediano)
  '12-3': { pesoIdeal: 5,  pesoMinKg: 3,  pesoMaxKg: 7  },
  // Maine Coon (Gato - Grande)
  '13-4': { pesoIdeal: 10, pesoMinKg: 8,  pesoMaxKg: 12 },
  // Bengalí (Gato - Mediano)
  '14-3': { pesoIdeal: 6,  pesoMinKg: 4,  pesoMaxKg: 8  },
  // Ragdoll (Gato - Grande)
  '15-4': { pesoIdeal: 9,  pesoMinKg: 7,  pesoMaxKg: 11 },
  // Sphynx (Gato - Mediano)
  '16-3': { pesoIdeal: 4,  pesoMinKg: 3,  pesoMaxKg: 6  },
  // Doméstico Gato (Gato - Mediano)
  '17-3': { pesoIdeal: 5,  pesoMinKg: 4,  pesoMaxKg: 6  },
};

/** Mapeo de asignación automática de raza a tamaño fijo */
export const RAZA_TAMANO_MAPPING = {
  1: 4, 2: 4, 3: 2, 4: 1, 5: 4, 6: 2, 7: 3, 8: 1, 9: 4, 10: 3, // Perros
  11: 3, 12: 3, 13: 4, 14: 3, 15: 4, 16: 3, 17: 3              // Gatos
};

/** Obtiene el peso ideal dado una raza y tamaño */
export function getPesoIdeal(razaId, tamanoId) {
  return PESOS_IDEALES[`${razaId}-${tamanoId}`] || null;
}

/** Filtra razas por tipo de mascota */
export function getRazasPorTipo(tipoId) {
  return RAZAS_MASCOTA.filter(r => r.tipoId === tipoId);
}
