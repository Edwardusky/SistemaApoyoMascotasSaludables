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
// Claves sincronizadas con bd_catalogos.PesoIdeal (raza_id, tamano_id)
export const PESOS_IDEALES = {
  // Labrador Retriever (perro Grande=4)
  '1-4': { pesoIdeal: 32, pesoMinKg: 27, pesoMaxKg: 36 },
  // Pastor Alemán (Grande=4)
  '2-4': { pesoIdeal: 35, pesoMinKg: 30, pesoMaxKg: 40 },
  // Bulldog Francés (Pequeño=2)
  '3-2': { pesoIdeal: 9,  pesoMinKg: 7,  pesoMaxKg: 13 },
  // Chihuahua (Mini=1)
  '4-1': { pesoIdeal: 2.5, pesoMinKg: 1.5, pesoMaxKg: 3.5 },
  // Golden Retriever (Grande=4)
  '5-4': { pesoIdeal: 34, pesoMinKg: 29, pesoMaxKg: 38 },
  // Poodle (Mini=1)
  '6-1': { pesoIdeal: 3,  pesoMinKg: 2,  pesoMaxKg: 4  },
  // Beagle (Pequeño=2)
  '7-2': { pesoIdeal: 9,  pesoMinKg: 7,  pesoMaxKg: 11 },
  // Yorkshire (Mini=1)
  '8-1': { pesoIdeal: 2.5, pesoMinKg: 2, pesoMaxKg: 3.5 },
  // Dóberman (Grande=4)
  '9-4': { pesoIdeal: 35, pesoMinKg: 30, pesoMaxKg: 40 },
  // Mestizo Perro (Mediano=3)
  '10-3': { pesoIdeal: 16, pesoMinKg: 12, pesoMaxKg: 22 },
  // Siamés (Gato - Pequeño=2, según BD)
  '11-2': { pesoIdeal: 4.5, pesoMinKg: 3.5, pesoMaxKg: 5.5 },
  // Persa (Gato - Pequeño=2)
  '12-2': { pesoIdeal: 4,  pesoMinKg: 3,  pesoMaxKg: 6  },
  // Maine Coon (Gato - Mediano=3)
  '13-3': { pesoIdeal: 7,  pesoMinKg: 5,  pesoMaxKg: 9  },
  // Bengêlí (Gato - Pequeño=2)
  '14-2': { pesoIdeal: 5,  pesoMinKg: 4,  pesoMaxKg: 7  },
  // Ragdoll (Gato - Mediano=3)
  '15-3': { pesoIdeal: 8,  pesoMinKg: 6,  pesoMaxKg: 10 },
  // Sphynx (Gato - Pequeño=2)
  '16-2': { pesoIdeal: 4,  pesoMinKg: 3,  pesoMaxKg: 6  },
  // Doméstico Gato (Gato - Pequeño=2)
  '17-2': { pesoIdeal: 4.5, pesoMinKg: 3.5, pesoMaxKg: 5.5 },
};

/**
 * Mapeo de asignación automática de raza a tamaño fijo.
 * Fuente de verdad: bd_catalogos.PesoIdeal (SELECT raza_id, tamano_id ...)
 * Perros: 1=Lab(4), 2=Pastor(4), 3=Bulldog(2), 4=Chihuahua(1), 5=Golden(4),
 *         6=Poodle(1 ó 2), 7=Beagle(2), 8=Yorkshire(1), 9=Dóberman(4), 10=Mestizo(3)
 * Gatos:  11=Siamés(2), 12=Persa(2), 13=Maine Coon(3), 14=Beng(2), 15=Ragdoll(3),
 *         16=Sphynx(2), 17=Doméstico(2)
 */
export const RAZA_TAMANO_MAPPING = {
  // Perros
  1: 4, // Labrador Retriever → Grande
  2: 4, // Pastor Alemán → Grande
  3: 2, // Bulldog Francés → Pequeño
  4: 1, // Chihuahua → Mini / Toy
  5: 4, // Golden Retriever → Grande
  6: 1, // Poodle → Mini / Toy (según init.sql: raza_id=6, tamano_id=1)
  7: 2, // Beagle → Pequeño
  8: 1, // Yorkshire Terrier → Mini / Toy
  9: 4, // Dóberman → Grande
  10: 3, // Mestizo Perro → Mediano
  // Gatos (según init.sql real: todos usan tamano_id=2 excepto Maine Coon y Ragdoll)
  11: 2, // Siamés → Pequeño
  12: 2, // Persa → Pequeño
  13: 3, // Maine Coon → Mediano
  14: 2, // Bengêlí → Pequeño
  15: 3, // Ragdoll → Mediano
  16: 2, // Sphynx → Pequeño
  17: 2, // Doméstico / Mestizo → Pequeño
};

/** Obtiene el peso ideal dado una raza y tamaño */
export function getPesoIdeal(razaId, tamanoId) {
  return PESOS_IDEALES[`${razaId}-${tamanoId}`] || null;
}

/** Filtra razas por tipo de mascota */
export function getRazasPorTipo(tipoId) {
  return RAZAS_MASCOTA.filter(r => r.tipoId === tipoId);
}
