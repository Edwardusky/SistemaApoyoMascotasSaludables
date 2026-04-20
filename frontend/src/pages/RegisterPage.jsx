import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registro } from '../services/api.service.js';

/**
 * RegisterPage — Registro de nuevo ciudadano.
 *
 * Campos:
 *   - Nombre completo (obligatorio)
 *   - CURP (obligatorio, 18 caracteres) — validación oficial por Autoridad
 *   - Teléfono (obligatorio)
 *   - Email (opcional)
 *   - Contraseña (obligatorio, mín 6 caracteres)
 *   - Confirmar contraseña
 *
 * Solo crea cuentas con rol 'ciudadano'.
 * Los roles 'autoridad' y 'admin' son asignados por el administrador del sistema.
 *
 * CA-03: El CURP debe ser único en el sistema (constraint en BD).
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    curp: '',
    telefono: '',
    email: '',
    password: '',
    confirmar: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim())          errs.nombre    = 'El nombre completo es obligatorio';
    if (!form.curp.trim())            errs.curp      = 'El CURP es obligatorio';
    else if (form.curp.trim().length !== 18) errs.curp = 'El CURP debe tener exactamente 18 caracteres';
    if (!form.telefono.trim())        errs.telefono  = 'El teléfono es obligatorio';
    else if (!/^\d{10}$/.test(form.telefono.trim())) errs.telefono = 'Ingresa un teléfono de 10 dígitos';
    if (!form.password)               errs.password  = 'La contraseña es obligatoria';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmar) errs.confirmar = 'Las contraseñas no coinciden';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Correo electrónico inválido';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await registro({
        nombre:   form.nombre.trim(),
        curp:     form.curp.trim(),
        telefono: form.telefono.trim(),
        email:    form.email.trim() || null,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setErrors({ general: err.message || 'Error al registrar. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ───────────────────────────────────
  if (success) {
    return (
      <div id="register-success" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F2544 0%, #1A3C6E 50%, #0d4f3c 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}>
        <div className="animate-slide-up" style={{
          background: 'white', borderRadius: 20, padding: '3rem 2.5rem',
          maxWidth: 460, width: '100%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
            ¡Registro exitoso!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Tu cuenta ciudadana ha sido creada correctamente.
          </p>
          <div style={{
            background: 'var(--color-info-bg)', border: '1px solid #90CAF9',
            borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1.5rem',
            fontSize: '0.85rem', color: 'var(--color-info)',
          }}>
            ℹ️ Tu CURP será verificado por la Autoridad al revisar tu primera solicitud de apoyo.
          </div>
          <button
            id="btn-ir-login"
            className="btn btn-primary btn-lg w-full"
            onClick={() => navigate('/login')}
          >
            Ir al inicio de sesión →
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario de registro ──────────────────────────────
  return (
    <div id="register-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2544 0%, #1A3C6E 50%, #0d4f3c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Decoración de fondo */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {['🐕','🐈','🐾','🦴','🐟'].map((emoji, i) => (
          <span key={i} style={{
            position: 'absolute', fontSize: `${2 + i * 0.8}rem`, opacity: 0.07,
            top: `${10 + i * 18}%`, left: `${5 + i * 19}%`, userSelect: 'none',
          }}>{emoji}</span>
        ))}
      </div>

      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.4rem' }}>🐾</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Crear cuenta ciudadana
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Sistema de Apoyo para Mascotas Saludables
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ borderRadius: 20 }}>
          {/* Banner */}
          <div style={{
            background: 'var(--color-primary)', padding: '0.85rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span>📝</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
              Registro de Ciudadano
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              Solo para ciudadanos
            </span>
          </div>

          <div className="card__body">
            <form id="form-registro" onSubmit={handleSubmit} noValidate>

              {/* Error general */}
              {errors.general && (
                <div id="register-error" role="alert" style={{
                  background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                  color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  ⚠️ {errors.general}
                </div>
              )}

              {/* Nombre */}
              <div className="form-group">
                <label htmlFor="reg-nombre" className="form-label">
                  Nombre Completo <span className="required">*</span>
                </label>
                <input
                  id="reg-nombre" name="nombre" type="text" className="form-input"
                  placeholder="Nombre(s) y apellidos"
                  value={form.nombre} onChange={handleChange}
                  aria-required="true"
                  aria-describedby={errors.nombre ? 'err-reg-nombre' : undefined}
                />
                {errors.nombre && <p id="err-reg-nombre" className="form-error">{errors.nombre}</p>}
              </div>

              {/* CURP */}
              <div className="form-group">
                <label htmlFor="reg-curp" className="form-label">
                  CURP <span className="required">*</span>
                  <span className="optional">18 caracteres</span>
                </label>
                <input
                  id="reg-curp" name="curp" type="text" className="form-input"
                  placeholder="Ej. GOMA850312MDFNRR09"
                  value={form.curp} onChange={handleChange}
                  maxLength={18}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  aria-required="true"
                  aria-describedby="curp-reg-helper"
                />
                {errors.curp
                  ? <p className="form-error">{errors.curp}</p>
                  : <p id="curp-reg-helper" className="form-helper">
                      ℹ️ La validación oficial del CURP será realizada por la Autoridad al revisar tu solicitud.
                    </p>
                }
              </div>

              {/* Teléfono + Email */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="reg-telefono" className="form-label">
                    Teléfono <span className="required">*</span>
                  </label>
                  <input
                    id="reg-telefono" name="telefono" type="tel" className="form-input"
                    placeholder="10 dígitos"
                    value={form.telefono} onChange={handleChange}
                    maxLength={10} aria-required="true"
                  />
                  {errors.telefono && <p className="form-error">{errors.telefono}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email" className="form-label">
                    Correo electrónico <span className="optional">opcional</span>
                  </label>
                  <input
                    id="reg-email" name="email" type="email" className="form-input"
                    placeholder="correo@ejemplo.com"
                    value={form.email} onChange={handleChange}
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
              </div>

              {/* Contraseña + Confirmar */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="reg-password" className="form-label">
                    Contraseña <span className="required">*</span>
                  </label>
                  <input
                    id="reg-password" name="password" type="password" className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password} onChange={handleChange}
                    autoComplete="new-password" aria-required="true"
                  />
                  {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="reg-confirmar" className="form-label">
                    Confirmar contraseña <span className="required">*</span>
                  </label>
                  <input
                    id="reg-confirmar" name="confirmar" type="password" className="form-input"
                    placeholder="Repite tu contraseña"
                    value={form.confirmar} onChange={handleChange}
                    autoComplete="new-password" aria-required="true"
                  />
                  {errors.confirmar && <p className="form-error">{errors.confirmar}</p>}
                </div>
              </div>

              {/* Nota de roles */}
              <div style={{
                background: 'var(--color-info-bg)', border: '1px solid #90CAF9',
                borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--color-info)',
              }}>
                🔐 Las cuentas de <strong>Autoridad</strong> y <strong>Administrador</strong> son asignadas
                directamente por el equipo administrativo del sistema.
              </div>

              {/* Submit */}
              <button
                id="btn-registrar"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                aria-busy={loading}
              >
                {loading
                  ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Creando cuenta...</>
                  : '✅ Crear mi cuenta'
                }
              </button>

              {/* Link al login */}
              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  id="link-ir-login"
                  style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  Iniciar sesión →
                </Link>
              </p>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          © 2024 Gobierno Municipal · Sistema de Apoyo para Mascotas Saludables
        </p>
      </div>
    </div>
  );
}
