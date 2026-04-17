import { logout } from '../services/api.service.js';
import { useNavigate } from 'react-router-dom';

const ROL_LABELS = {
  ciudadano: 'Ciudadano',
  autoridad: 'Autoridad',
  admin: 'Administrador',
};

/**
 * Navbar — Barra de navegación superior del sistema.
 * Muestra el logo, el nombre del sistema y el badge de rol del usuario activo.
 */
export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Barra de navegación principal">
      {/* Brand */}
      <a className="navbar__brand" href="#" aria-label="Inicio del sistema">
        <span className="navbar__logo" aria-hidden="true">🐾</span>
        <div>
          <div className="navbar__title">MascotasApoya MX</div>
          <div className="navbar__subtitle">Sistema de Apoyo para Mascotas Saludables</div>
        </div>
      </a>

      {/* Right section */}
      <div className="navbar__right">
        {session && (
          <>
            <div className="navbar__user">
              <span style={{ fontSize: '1.4rem' }}>
                {session.rol === 'ciudadano' ? '👤' : session.rol === 'autoridad' ? '🏛️' : '⚙️'}
              </span>
              <div>
                <div className="navbar__user-name">{session.nombre}</div>
              </div>
            </div>
            <span className="badge-role" aria-label={`Rol: ${ROL_LABELS[session.rol]}`}>
              {ROL_LABELS[session.rol]}
            </span>
            <button
              id="btn-logout"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{ color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              Salir ↗
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
