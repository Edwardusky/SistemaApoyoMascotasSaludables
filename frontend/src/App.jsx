import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CiudadanoPage from './pages/CiudadanoPage.jsx';
import AutoridadPage from './pages/AutoridadPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { getSession, logout } from './services/api.service.js';

/**
 * ProtectedRoute — Redirige al login si no hay sesión activa.
 * También valida que el rol del usuario coincida con el permitido en esa ruta.
 */
function ProtectedRoute({ children, rolesPermitidos, session }) {
  const location = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(session.rol)) {
    // Redirigir al destino correcto para su rol
    const destino = session.rol === 'ciudadano' ? '/ciudadano'
                  : session.rol === 'autoridad'  ? '/autoridad'
                  : '/admin';
    return <Navigate to={destino} replace />;
  }
  return children;
}

/**
 * AppLayout — Wrapper que incluye Navbar + Sidebar + contenido principal.
 * Solo se muestra si hay una sesión activa (no en la página de login).
 */
function AppLayout({ session, children, onLogout }) {
  return (
    <>
      <Navbar session={session} onLogout={onLogout} />
      <Sidebar rol={session?.rol} />
      <main id="main-content" className="main-content" role="main">
        {children}
      </main>
    </>
  );
}

/**
 * App — Raíz de la aplicación React SPA.
 * Gestiona la sesión activa y el enrutamiento protegido por rol.
 */
export default function App() {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    // Sincronizar sesión si se cierra en otra pestaña
    const handler = () => setSession(getSession());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleLogin = (sessionData) => setSession(sessionData);

  return (
    <BrowserRouter>
      <Routes>
        {/* Registro — sin auth, solo para nuevos ciudadanos */}
        <Route
          path="/registro"
          element={
            session
              ? <Navigate to={
                  session.rol === 'ciudadano' ? '/ciudadano'
                  : session.rol === 'autoridad' ? '/autoridad'
                  : '/admin'
                } replace />
              : <RegisterPage />
          }
        />

        {/* Login — sin layout */}
        <Route
          path="/login"
          element={
            session
              ? <Navigate to={
                  session.rol === 'ciudadano' ? '/ciudadano'
                  : session.rol === 'autoridad' ? '/autoridad'
                  : '/admin'
                } replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Portal Ciudadano — Track B RF-01, RF-02 */}
        <Route
          path="/ciudadano/*"
          element={
            <ProtectedRoute rolesPermitidos={['ciudadano']} session={session}>
              <AppLayout session={session} onLogout={() => setSession(null)}>
                <CiudadanoPage session={session} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Bandeja de Autoridad — Track B RF-03, RF-04 */}
        <Route
          path="/autoridad/*"
          element={
            <ProtectedRoute rolesPermitidos={['autoridad']} session={session}>
              <AppLayout session={session} onLogout={() => setSession(null)}>
                <AutoridadPage session={session} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Panel de Administrador — Track B RF-05 */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute rolesPermitidos={['admin']} session={session}>
              <AppLayout session={session} onLogout={() => setSession(null)}>
                <AdminPage session={session} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Raíz: redirige al destino según sesión */}
        <Route
          path="/"
          element={
            session
              ? <Navigate to={
                  session.rol === 'ciudadano' ? '/ciudadano'
                  : session.rol === 'autoridad' ? '/autoridad'
                  : '/admin'
                } replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* 404 genérico */}
        <Route
          path="*"
          element={
            <div style={{ textAlign: 'center', padding: '4rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐾</div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Página no encontrada</h1>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>La ruta que buscas no existe en este sistema.</p>
              <a href="/" className="btn btn-primary">← Ir al inicio</a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
