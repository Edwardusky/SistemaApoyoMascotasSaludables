import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api.service.js';

/**
 * LoginPage — Autenticación del sistema.
 *
 * CURP: se solicita como identificador principal.
 * IMPORTANTE (según SRS): La validación real del CURP del ciudadano es responsabilidad
 * de la Autoridad humana, no del sistema. El sistema solo verifica que el campo no esté vacío.
 *
 * Credenciales de prueba (Fase 2 / mocks):
 *   Ciudadano  → CURP: GOMA850312MDFNRR09  / Password: 1234
 *   Autoridad  → CURP: RAOF900615HDFMRR05  / Password: 1234
 *   Admin      → CURP: ADSI800101HDFMIN01   / Password: 1234
 */
export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ curp: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.curp.trim()) { setError('El CURP es requerido para identificarte.'); return; }
    if (!form.password)    { setError('Ingresa tu contraseña.'); return; }

    setLoading(true);
    try {
      const session = await login(form.curp.trim(), form.password);
      onLogin(session);
      const destino = session.rol === 'ciudadano' ? '/ciudadano'
                    : session.rol === 'autoridad'  ? '/autoridad'
                    : '/admin';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2544 0%, #1A3C6E 50%, #0d4f3c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Decoración de fondo */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        {['🐕','🐈','🐾','🦴','🐟'].map((emoji, i) => (
          <span key={i} style={{
            position: 'absolute',
            fontSize: `${2 + i * 0.8}rem`,
            opacity: 0.07,
            top: `${10 + i * 18}%`,
            left: `${5 + i * 19}%`,
            userSelect: 'none',
          }}>{emoji}</span>
        ))}
      </div>

      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🐾</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: 4 }}>
            MascotasApoya MX
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            Sistema de Apoyo para Mascotas Saludables
          </p>
          <div style={{
            marginTop: '0.75rem',
            display: 'inline-block',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '4px 16px',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Gobierno Municipal · Portal Ciudadano
          </div>
        </div>

        {/* Card de login */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
          {/* Banner superior */}
          <div style={{
            background: 'var(--color-primary)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1rem' }}>🔐</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
              Acceso al Sistema
            </span>
          </div>

          <div className="card__body">
            <form id="login-form" onSubmit={handleSubmit} noValidate>

              {/* Campo CURP */}
              <div className="form-group">
                <label htmlFor="login-curp" className="form-label">
                  CURP <span className="required">*</span>
                  <span className="optional">18 caracteres</span>
                </label>
                <input
                  id="login-curp"
                  name="curp"
                  type="text"
                  className="form-input"
                  placeholder="Ej. GOMA850312MDFNRR09"
                  value={form.curp}
                  onChange={handleChange}
                  maxLength={18}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}
                  autoComplete="username"
                  aria-required="true"
                  aria-describedby="curp-helper"
                />
                <p id="curp-helper" className="form-helper">
                  ℹ️ Tu CURP es tu identificador. La validación oficial será realizada por la Autoridad.
                </p>
              </div>

              {/* Campo Contraseña */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  Contraseña <span className="required">*</span>
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-required="true"
                />
              </div>

              {/* Error */}
              {error && (
                <div id="login-error" role="alert" style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Botón de submit */}
              <button
                id="btn-login-submit"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Verificando...</>
                ) : (
                  <>Ingresar al Sistema →</>
                )}
              </button>
            </form>

            {/* Info de credenciales de prueba */}
            <details style={{ marginTop: '1.5rem' }}>
              <summary style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                🧪 Credenciales de demostración (Fase 2)
              </summary>
              <div style={{
                marginTop: '0.75rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                color: 'var(--color-text-secondary)',
                lineHeight: 2,
              }}>
                <div>👤 <strong>Ciudadano:</strong> GOMA850312MDFNRR09 / 1234</div>
                <div>🏛️ <strong>Autoridad:</strong> RAOF900615HDFMRR05 / 1234</div>
                <div>⚙️ <strong>Admin:</strong> ADSI800101HDFMIN01 / 1234</div>
              </div>
            </details>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          © 2024 Gobierno Municipal · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
