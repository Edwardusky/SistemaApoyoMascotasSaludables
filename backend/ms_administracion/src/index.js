/**
 * ms_administracion/src/index.js
 * Microservicio 4 — Administración (RF-05)
 *
 * Responsabilidades:
 *   - GET    /politicas          → Leer PoliticaApoyo (Tabla B del SRS)
 *   - PUT    /politicas/:id      → Actualizar monto de apoyo (solo admin)
 *   - GET    /costos-alimento    → Leer CostoAlimento
 *   - PUT    /costos-alimento/:id → Actualizar costo (solo admin)
 *   - GET    /metricas           → KPIs del dashboard de administración
 *   - GET    /health
 */

'use strict';

const express  = require('express');
const { Pool } = require('pg');
const jwt      = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.connect()
  .then(() => console.log('[ms_administracion] Conectado a PostgreSQL ✓'))
  .catch(err => { console.error('[ms_administracion] Error BD:', err.message); process.exit(1); });

// ── Middleware JWT ────────────────────────────────────────
function verificarJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin')
    return res.status(403).json({ error: 'Solo el Administrador puede realizar esta acción' });
  next();
}

// ── ENDPOINTS ─────────────────────────────────────────────

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'ms_administracion', timestamp: new Date().toISOString() })
);

// GET /politicas — Tabla B: PoliticaApoyo
app.get('/politicas', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, clasificacion_ima, ima_min, ima_max, monto_apoyo_mxn, descripcion, activo
       FROM bd_catalogos.PoliticaApoyo
       ORDER BY ima_min`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /politicas/:id — Actualizar monto de política (solo admin)
app.put('/politicas/:id', verificarJWT, soloAdmin, async (req, res) => {
  const { monto_apoyo_mxn, descripcion } = req.body;
  if (monto_apoyo_mxn === undefined)
    return res.status(400).json({ error: 'monto_apoyo_mxn es requerido' });
  try {
    const r = await pool.query(
      `UPDATE bd_catalogos.PoliticaApoyo
       SET monto_apoyo_mxn = $1, descripcion = COALESCE($2, descripcion), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [monto_apoyo_mxn, descripcion || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Política no encontrada' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /costos-alimento
app.get('/costos-alimento', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ca.id, t.nombre as tipo_nombre, s.nombre as tamano_nombre,
              ca.costo_mensual, ca.moneda
       FROM bd_catalogos.CostoAlimento ca
       JOIN bd_catalogos.TipoMascota t ON t.id = ca.tipo_id
       JOIN bd_catalogos.Tamano s ON s.id = ca.tamano_id
       ORDER BY ca.tipo_id, ca.tamano_id`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /costos-alimento/:id (solo admin)
app.put('/costos-alimento/:id', verificarJWT, soloAdmin, async (req, res) => {
  const { costo_mensual } = req.body;
  if (!costo_mensual) return res.status(400).json({ error: 'costo_mensual es requerido' });
  try {
    const r = await pool.query(
      `UPDATE bd_catalogos.CostoAlimento
       SET costo_mensual = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [costo_mensual, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /metricas — KPIs del dashboard
app.get('/metricas', verificarJWT, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*)                                                      AS total,
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE')                 AS pendientes,
        COUNT(*) FILTER (WHERE estado = 'EN_REVISION')               AS en_revision,
        COUNT(*) FILTER (WHERE estado = 'APROBADO')                  AS aprobadas,
        COUNT(*) FILTER (WHERE estado = 'RECHAZADO')                 AS rechazadas,
        COALESCE(SUM(monto_sugerido_mxn) FILTER (WHERE estado = 'APROBADO'), 0) AS monto_total_aprobado
      FROM bd_transaccional.SolicitudApoyo
    `);
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`[ms_administracion] Escuchando en puerto ${PORT}`));
