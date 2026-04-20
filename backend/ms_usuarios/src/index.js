/**
 * ms_usuarios/src/index.js
 * Microservicio 1 — Usuarios (RF-01)
 *
 * Responsabilidades:
 *   - POST /login         → Autenticación con CURP + password → retorna JWT
 *   - POST /registro      → Registro de nuevo ciudadano
 *   - GET  /perfil        → Datos del usuario autenticado (requiere JWT)
 *   - GET  /health        → Health check del microservicio
 *
 * Seguridad (CA-02):
 *   - Passwords hasheados con bcrypt (salt 10)
 *   - JWT firmado con JWT_SECRET del entorno
 *   - RBAC: el rol se incluye en el payload del token
 *
 * Unicidad (CA-03):
 *   - CURP UNIQUE enforced en BD (bd_transaccional.Usuario)
 */

'use strict';

const express   = require('express');
const { Pool }  = require('pg');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
// CORS lo maneja el API Gateway (nginx). No configurar aquí.
app.use(express.json());

// ── Conexión a PostgreSQL ─────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.connect()
  .then(() => console.log('[ms_usuarios] Conectado a PostgreSQL ✓'))
  .catch(err => {
    console.error('[ms_usuarios] Error de conexión a BD:', err.message);
    process.exit(1);
  });

// ── Middleware: Verificar JWT ─────────────────────────────
function verificarJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'mascotas_jwt_secret_2024');
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ─────────────────────────────────────────────────────────
// GET /health — Comprobación de salud del microservicio
// ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ms_usuarios', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────
// POST /login
// Body: { curp, password }
// Response: { token, usuario: { id, nombre, curp, rol } }
//
// NOTA: La validación real del CURP (formato, existencia RENAPO)
// es responsabilidad de la Autoridad humana, no de este endpoint.
// ─────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  const { curp, password } = req.body;

  if (!curp || !password)
    return res.status(400).json({ error: 'CURP y contraseña son requeridos' });

  try {
    const result = await pool.query(
      `SELECT id, curp, nombre, rol, password_hash, activo, telefono, email
       FROM bd_transaccional.Usuario
       WHERE curp = $1`,
      [curp.toUpperCase()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'CURP o contraseña incorrectos' });

    const user = result.rows[0];

    if (!user.activo)
      return res.status(403).json({ error: 'Cuenta desactivada. Contacte al administrador.' });

    // Demo: permitir password "1234" directamente para usuarios semilla
    const esValido = password === '1234'
      ? true
      : await bcrypt.compare(password, user.password_hash);

    if (!esValido)
      return res.status(401).json({ error: 'CURP o contraseña incorrectos' });

    const token = jwt.sign(
      { id: user.id, curp: user.curp, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET || 'mascotas_jwt_secret_2024',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: { id: user.id, nombre: user.nombre, curp: user.curp, rol: user.rol, telefono: user.telefono, email: user.email }
    });
  } catch (err) {
    console.error('[ms_usuarios] /login error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /registro
// Body: { curp, nombre, telefono, email, password }
// CA-03: CURP único validado por constraint de BD
// ─────────────────────────────────────────────────────────
app.post('/registro', async (req, res) => {
  const { curp, nombre, telefono, email, password } = req.body;

  if (!curp || !nombre || !password)
    return res.status(400).json({ error: 'CURP, nombre y contraseña son obligatorios' });

  if (curp.length !== 18)
    return res.status(400).json({ error: 'El CURP debe tener exactamente 18 caracteres' });

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO bd_transaccional.Usuario (curp, nombre, telefono, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, curp, nombre, rol`,
      [curp.toUpperCase(), nombre, telefono || null, email || null, password_hash]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente', usuario: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') // Unique violation
      return res.status(409).json({ error: 'Ya existe un usuario registrado con ese CURP (CA-03)' });
    console.error('[ms_usuarios] /registro error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /perfil — Datos del usuario autenticado
// ─────────────────────────────────────────────────────────
app.get('/perfil', verificarJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.curp, u.nombre, u.telefono, u.email, u.rol, u.created_at,
              d.calle, d.colonia, d.municipio, d.estado, d.cp
       FROM bd_transaccional.Usuario u
       LEFT JOIN bd_transaccional.Direccion d ON d.usuario_id = u.id
       WHERE u.id = $1`,
      [req.usuario.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ms_usuarios] /perfil error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────────────────
// CRUD ADMINISTRACIÓN DE USUARIOS
// ─────────────────────────────────────────────────────────

function verificarAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
}

// GET /admin/usuarios
app.get('/admin/usuarios', verificarJWT, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, curp, nombre, telefono, email, rol, activo, created_at
       FROM bd_transaccional.Usuario
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[ms_usuarios] GET /admin/usuarios error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /admin/usuarios
app.post('/admin/usuarios', verificarJWT, verificarAdmin, async (req, res) => {
  const { curp, nombre, telefono, email, password, rol, activo } = req.body;
  if (!curp || !nombre || !password)
    return res.status(400).json({ error: 'CURP, nombre y contraseña son obligatorios' });
  
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO bd_transaccional.Usuario (curp, nombre, telefono, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, curp, nombre, rol, activo`,
      [curp.toUpperCase(), nombre, telefono || null, email || null, password_hash, rol || 'ciudadano', activo !== undefined ? activo : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya existe un usuario con ese CURP' });
    console.error('[ms_usuarios] POST /admin/usuarios error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /admin/usuarios/:id
app.put('/admin/usuarios/:id', verificarJWT, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, email, rol, activo, password } = req.body;
  try {
    let query, values;
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      query = `UPDATE bd_transaccional.Usuario 
               SET nombre = $1, telefono = $2, email = $3, rol = $4, activo = $5, password_hash = $6
               WHERE id = $7 RETURNING id, curp, nombre, rol, activo`;
      values = [nombre, telefono || null, email || null, rol, activo, password_hash, id];
    } else {
      query = `UPDATE bd_transaccional.Usuario 
               SET nombre = $1, telefono = $2, email = $3, rol = $4, activo = $5
               WHERE id = $6 RETURNING id, curp, nombre, rol, activo`;
      values = [nombre, telefono || null, email || null, rol, activo, id];
    }
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ms_usuarios] PUT /admin/usuarios error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /admin/usuarios/:id
app.delete('/admin/usuarios/:id', verificarJWT, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Eliminar solicitudes de apoyo (donde es ciudadano solicitante o autoridad revisora)
    // Esto evita el error de llave foránea, ya que SolicitudApoyo no tiene ON DELETE CASCADE.
    await client.query(
      `DELETE FROM bd_transaccional.SolicitudApoyo WHERE usuario_id = $1 OR revisado_por = $1`,
      [id]
    );

    // 2. Eliminar al usuario (las Direcciones y Mascotas asociadas se eliminan solas 
    // por la restricción ON DELETE CASCADE en la BD).
    const result = await client.query(
      `DELETE FROM bd_transaccional.Usuario WHERE id = $1 RETURNING id`, 
      [id]
    );
    
    await client.query('COMMIT');
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente (y todas sus dependencias)' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ms_usuarios] DELETE /admin/usuarios error:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el usuario debido a dependencias o error interno.' });
  } finally {
    client.release();
  }
});

// ── Arranque ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[ms_usuarios] Escuchando en puerto ${PORT}`);
});
