/**
 * ms_solicitudes/src/index.js
 * Microservicio 3 — Solicitudes / Auditoría
 *
 * Responsabilidades:
 *   - GET    /          → Listar solicitudes (autoridad ve todas; ciudadano ve las suyas)
 *   - POST   /          → Crear nueva solicitud (ciudadano)
 *   - GET    /:id       → Detalle de una solicitud
 *   - PATCH  /:id       → Actualizar estado (APROBADO | RECHAZADO) — solo autoridad/admin
 *   - GET    /health
 *
 * Reglas de negocio:
 *   - CA-03: Máximo 3 mascotas activas (solicitudes) por ciudadano
 *   - CA-02: Solo la Autoridad puede cambiar estado
 *   - El certificado veterinario es opcional; la validación real es de la Autoridad
 */

'use strict';

const express  = require('express');
const { Pool } = require('pg');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.connect()
  .then(() => console.log('[ms_solicitudes] Conectado a PostgreSQL ✓'))
  .catch(err => { console.error('[ms_solicitudes] Error BD:', err.message); process.exit(1); });

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

function soloRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol))
      return res.status(403).json({ error: `Acceso denegado. Roles permitidos: ${roles.join(', ')}` });
    next();
  };
}

// ── ENDPOINTS ─────────────────────────────────────────────

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'ms_solicitudes', timestamp: new Date().toISOString() })
);

// GET / — Listar solicitudes
app.get('/', verificarJWT, async (req, res) => {
  try {
    let query, params;

    if (req.usuario.rol === 'ciudadano') {
      // El ciudadano solo ve sus propias solicitudes
      query = `
        SELECT s.*, u.nombre as dueno_nombre, u.curp,
               m.nombre as mascota_nombre, t.nombre as tipo_nombre
        FROM bd_transaccional.SolicitudApoyo s
        JOIN bd_transaccional.Usuario u ON u.id = s.usuario_id
        JOIN bd_transaccional.Mascota m ON m.id = s.mascota_id
        JOIN bd_catalogos.TipoMascota t ON t.id = m.tipo_id
        WHERE s.usuario_id = $1
        ORDER BY s.created_at DESC`;
      params = [req.usuario.id];
    } else {
      // Autoridad y Admin ven todas
      query = `
        SELECT s.*, u.nombre as dueno_nombre, u.curp,
               m.nombre as mascota_nombre, t.nombre as tipo_nombre
        FROM bd_transaccional.SolicitudApoyo s
        JOIN bd_transaccional.Usuario u ON u.id = s.usuario_id
        JOIN bd_transaccional.Mascota m ON m.id = s.mascota_id
        JOIN bd_catalogos.TipoMascota t ON t.id = m.tipo_id
        ORDER BY s.created_at DESC`;
      params = [];
    }

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — Crear nueva solicitud
// CA-03: Valida que el ciudadano no tenga más de 3 solicitudes activas
app.post('/', verificarJWT, soloRol('ciudadano'), async (req, res) => {
  const { mascota_id, peso_actual_kg, peso_ideal_kg, ima_calculado,
          clasificacion_ima, monto_sugerido_mxn, certificado_vet_path } = req.body;

  if (!mascota_id || !peso_actual_kg)
    return res.status(400).json({ error: 'mascota_id y peso_actual_kg son requeridos' });

  try {
    // CA-03: Verificar límite de 3 mascotas
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM bd_transaccional.SolicitudApoyo
       WHERE usuario_id = $1 AND estado NOT IN ('RECHAZADO')`,
      [req.usuario.id]
    );
    if (parseInt(countResult.rows[0].count) >= 3)
      return res.status(409).json({
        error: 'Límite alcanzado: máximo 3 solicitudes activas por ciudadano (CA-03)',
      });

    const r = await pool.query(
      `INSERT INTO bd_transaccional.SolicitudApoyo
         (mascota_id, usuario_id, peso_actual_kg, peso_ideal_kg, ima_calculado,
          clasificacion_ima, monto_sugerido_mxn, certificado_vet_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [mascota_id, req.usuario.id, peso_actual_kg, peso_ideal_kg || null,
       ima_calculado || null, clasificacion_ima || null,
       monto_sugerido_mxn || 0, certificado_vet_path || null]
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — Detalle de solicitud
app.get('/:id', verificarJWT, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT s.*, u.nombre as dueno_nombre, u.curp, u.telefono,
              m.nombre as mascota_nombre
       FROM bd_transaccional.SolicitudApoyo s
       JOIN bd_transaccional.Usuario u ON u.id = s.usuario_id
       JOIN bd_transaccional.Mascota m ON m.id = s.mascota_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Ciudadano solo puede ver las suyas
    if (req.usuario.rol === 'ciudadano' && r.rows[0].usuario_id !== req.usuario.id)
      return res.status(403).json({ error: 'Acceso denegado' });

    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id — Actualizar estado (solo Autoridad/Admin)
app.patch('/:id', verificarJWT, soloRol('autoridad', 'admin'), async (req, res) => {
  const { estado, comentario_autoridad } = req.body;
  const estadosValidos = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO'];

  if (!estado || !estadosValidos.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Valores: ${estadosValidos.join(', ')}` });

  try {
    const r = await pool.query(
      `UPDATE bd_transaccional.SolicitudApoyo
       SET estado = $1,
           comentario_autoridad = $2,
           revisado_por = $3,
           fecha_revision = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [estado, comentario_autoridad || null, req.usuario.id, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`[ms_solicitudes] Escuchando en puerto ${PORT}`));
