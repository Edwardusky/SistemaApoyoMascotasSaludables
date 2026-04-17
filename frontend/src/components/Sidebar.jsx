import { NavLink } from 'react-router-dom';

const NAV_ITEMS = {
  ciudadano: [
    { path: '/ciudadano',           icon: '📋', label: 'Mis Solicitudes'     },
    { path: '/ciudadano/nueva',     icon: '➕', label: 'Nueva Solicitud'     },
  ],
  autoridad: [
    { path: '/autoridad',           icon: '📥', label: 'Bandeja de Entrada'  },
    { path: '/autoridad/historia',  icon: '📜', label: 'Historial'           },
  ],
  admin: [
    { path: '/admin',               icon: '📊', label: 'Dashboard'           },
    { path: '/admin/politicas',     icon: '📑', label: 'Políticas de Apoyo'  },
    { path: '/admin/costos',        icon: '💰', label: 'Costos de Alimento'  },
    { path: '/admin/usuarios',      icon: '👥', label: 'Usuarios'            },
  ],
};

/**
 * Sidebar — Menú lateral de navegación condicional por rol.
 * Muestra solo las rutas pertenecientes al rol del usuario autenticado.
 */
export default function Sidebar({ rol }) {
  const items = NAV_ITEMS[rol] || [];

  return (
    <aside className="sidebar" role="complementary" aria-label="Menú lateral de navegación">
      <div className="sidebar__section-title">Navegación</div>
      <nav aria-label={`Menú para rol ${rol}`}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length === 2}
            className={({ isActive }) =>
              `sidebar__nav-item${isActive ? ' active' : ''}`
            }
            id={`nav-${item.path.replace(/\//g, '-').replace(/^-/, '')}`}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            Fase 2 — Mocks activos
          </div>
          MascotasApoya MX v0.1.0<br />
          Track B — Frontend
        </div>
      </div>
    </aside>
  );
}
