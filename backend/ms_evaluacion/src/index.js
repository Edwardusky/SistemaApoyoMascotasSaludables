/**
 * ms_evaluacion/src/index.js
 * Microservicio 2 — Evaluación / Cálculo IMA (RF-02, RF-03, RF-04)
 *
 * Responsabilidades:
 *   - GET  /catalogos/tipos           → Lista de TipoMascota
 *   - GET  /catalogos/razas?tipoId=X  → Razas filtradas por tipo
 *   - GET  /catalogos/tamanos         → Lista de tamaños
 *   - GET  /catalogos/peso-ideal      → PesoIdeal por razaId + tamanoId
 *   - POST /calcular-ima              → Calcula y clasifica el IMA
 *   - GET  /health
 *
 * Fórmula del IMA (Índice de Masa Animal):
 *   IMA = peso_actual_kg / peso_ideal_kg
 *
 * Clasificación (Tabla B — SRS):
 *   IMA < 0.75            → Bajo Peso Severo  (apoyo $1,500)
 *   0.75 <= IMA < 0.85    → Bajo Peso         (apoyo $1,000)
 *   0.85 <= IMA <= 1.15   → Peso Ideal        (sin apoyo)
 *   1.16 <= IMA <= 1.30   → Sobrepeso         (apoyo $850)
 *   IMA > 1.30            → Obesidad          (apoyo $1,200)
 */

'use strict';

const express  = require('express');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.connect()
  .then(() => console.log('[ms_evaluacion] Conectado a PostgreSQL ✓'))
  .catch(err => { console.error('[ms_evaluacion] Error BD:', err.message); process.exit(1); });

// ─────────────────────────────────────────────────────────
// LÓGICA DE NEGOCIO — Funciones matemáticas del IMA
// (Documentadas según el estándar del SRS §5 Tablas A y B)
// ─────────────────────────────────────────────────────────

/**
 * Calcula el Índice de Masa Animal (IMA).
 * Fuente: SRS — Tabla A (PesoIdeal de referencia)
 *
 * @param {number} pesoActual  - Peso real de la mascota en kg
 * @param {number} pesoIdeal   - Peso ideal de referencia en kg (de bd_catalogos.PesoIdeal)
 * @returns {number} IMA redondeado a 2 decimales
 */
function calcularIMA(pesoActual, pesoIdeal) {
  if (!pesoIdeal || pesoIdeal <= 0) throw new Error('Peso ideal inválido');
  return Math.round((pesoActual / pesoIdeal) * 100) / 100;
}

/**
 * Clasifica el IMA según los rangos de la Tabla B (PoliticaApoyo) del SRS.
 *
 * @param {number} ima - Valor del IMA calculado
 * @returns {{ clasificacion: string, montoApoyo: number, descripcion: string }}
 */
function clasificarIMA(ima) {
  // 4 estados: Bajo peso, Peso ideal, Sobrepeso, Obeso
  // 100% apoyo a Peso ideal, 0% a Obesidad
  if (ima < 0.85)  return { clasificacion: 'Bajo peso',  porcentajeApoyo: 50,  montoApoyo: 50,  descripcion: 'Por debajo del rango saludable (50% de apoyo)' };
  if (ima <= 1.15) return { clasificacion: 'Peso ideal', porcentajeApoyo: 100, montoApoyo: 100, descripcion: 'Rango saludable — 100% de apoyo económico' };
  if (ima <= 1.30) return { clasificacion: 'Sobrepeso',  porcentajeApoyo: 50,  montoApoyo: 50,  descripcion: 'Plan nutricional requerido (50% de apoyo)' };
  return           { clasificacion: 'Obeso',      porcentajeApoyo: 0,   montoApoyo: 0,   descripcion: 'Riesgo de salud elevado (0% de apoyo)' };
}

// ─────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ms_evaluacion', timestamp: new Date().toISOString() });
});

// GET /catalogos/tipos
app.get('/catalogos/tipos', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, nombre, emoji FROM bd_catalogos.TipoMascota WHERE activo = TRUE ORDER BY id`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catalogos/razas?tipoId=1
app.get('/catalogos/razas', async (req, res) => {
  const { tipoId } = req.query;
  if (!tipoId) return res.status(400).json({ error: 'tipoId es requerido' });
  try {
    const r = await pool.query(
      `SELECT id, tipo_id, nombre
       FROM bd_catalogos.RazaMascota
       WHERE tipo_id = $1 AND activo = TRUE
       ORDER BY nombre`,
      [tipoId]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catalogos/tamanos
app.get('/catalogos/tamanos', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, nombre, descripcion FROM bd_catalogos.Tamano ORDER BY id`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catalogos/peso-ideal?razaId=1&tamanoId=4
app.get('/catalogos/peso-ideal', async (req, res) => {
  const { razaId, tamanoId } = req.query;
  if (!razaId || !tamanoId)
    return res.status(400).json({ error: 'razaId y tamanoId son requeridos' });
  try {
    const r = await pool.query(
      `SELECT id, raza_id, tamano_id, peso_min_kg, peso_max_kg, peso_ideal_kg
       FROM bd_catalogos.PesoIdeal
       WHERE raza_id = $1 AND tamano_id = $2`,
      [razaId, tamanoId]
    );
    if (r.rows.length === 0)
      return res.status(404).json({ error: 'Combinación raza/tamaño no encontrada en Tabla A' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /calcular-ima
 * Calcula el IMA y retorna la clasificación + monto de apoyo sugerido.
 *
 * Body: { pesoActualKg, razaId, tamanoId }
 * Response: { ima, pesoIdealKg, clasificacion, montoApoyo, descripcion }
 */
app.post('/calcular-ima', async (req, res) => {
  const { pesoActualKg, razaId, tamanoId } = req.body;

  if (!pesoActualKg || !razaId || !tamanoId)
    return res.status(400).json({ error: 'pesoActualKg, razaId y tamanoId son requeridos' });

  try {
    // Obtener peso ideal de la Tabla A
    const piResult = await pool.query(
      `SELECT peso_ideal_kg FROM bd_catalogos.PesoIdeal
       WHERE raza_id = $1 AND tamano_id = $2`,
      [razaId, tamanoId]
    );

    if (piResult.rows.length === 0)
      return res.status(404).json({ error: 'Peso ideal no encontrado para raza/tamaño' });

    const pesoIdealKg = parseFloat(piResult.rows[0].peso_ideal_kg);
    const ima         = calcularIMA(parseFloat(pesoActualKg), pesoIdealKg);
    const resultado   = clasificarIMA(ima);

    res.json({
      ima,
      pesoIdealKg,
      ...resultado,
    });
  } catch (err) {
    console.error('[ms_evaluacion] /calcular-ima error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[ms_evaluacion] Escuchando en puerto ${PORT}`);
});
