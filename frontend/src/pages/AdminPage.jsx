import { useState, useEffect } from 'react';
import {
  getMetricas, getPoliticasApoyo, getCostosAlimento,
} from '../services/api.service.js';

/**
 * AdminPage — Panel de Administrador del Sistema.
 * Responsabilidades (RF-05):
 *   - Dashboard con métricas globales
 *   - Visualización y edición de PoliticaApoyo (Tabla B del SRS)
 *   - Visualización de CostoAlimento por tipo y tamaño
 */
export default function AdminPage() {
  const [seccion, setSeccion] = useState('dashboard');
  const [metricas, setMetricas] = useState(null);
  const [politicas, setPoliticas] = useState([]);
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMetricas(), getPoliticasApoyo(), getCostosAlimento()])
      .then(([m, p, c]) => { setMetricas(m); setPoliticas(p); setCostos(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: '2.5rem', animation: 'pulse 1s infinite', marginBottom: '1rem' }}>⚙️</div>
      Cargando panel de administración...
    </div>
  );

  return (
    <div id="admin-page" className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">⚙️ Panel de Administrador</h1>
        <p className="page-subtitle">Gestión de políticas de apoyo y configuración del sistema</p>
      </div>

      {/* Tabs de sección */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'politicas', icon: '📑', label: 'Políticas de Apoyo' },
          { id: 'costos',    icon: '💰', label: 'Costos de Alimento' },
        ].map(s => (
          <button
            key={s.id}
            id={`tab-admin-${s.id}`}
            className={`btn ${seccion === s.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSeccion(s.id)}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {seccion === 'dashboard' && metricas && (
        <div id="admin-dashboard">
          {/* KPIs principales */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary" aria-hidden="true">📋</div>
              <div>
                <div className="stat-value">{metricas.total}</div>
                <div className="stat-label">Solicitudes totales</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info" aria-hidden="true">⏳</div>
              <div>
                <div className="stat-value">{metricas.pendientes}</div>
                <div className="stat-label">Pendientes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success" aria-hidden="true">✅</div>
              <div>
                <div className="stat-value">{metricas.aprobadas}</div>
                <div className="stat-label">Aprobadas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning" aria-hidden="true">❌</div>
              <div>
                <div className="stat-value">{metricas.rechazadas}</div>
                <div className="stat-label">Rechazadas</div>
              </div>
            </div>
          </div>

          {/* Monto total aprobado */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', marginBottom: '1.5rem' }}>
            <div className="card__body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  💰 Monto Total Aprobado (Fase 2 / Demo)
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginTop: '0.25rem' }}>
                  ${metricas.montoTotal.toLocaleString()} MXN
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Tasa de aprobación</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>
                  {metricas.total > 0 ? Math.round((metricas.aprobadas / metricas.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="card">
            <div className="card__header">
              <div className="card__title">📈 Actividad del Sistema</div>
            </div>
            <div className="card__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                    Por estado
                  </div>
                  {[
                    { label: 'Pendientes',  val: metricas.pendientes,  total: metricas.total, color: 'var(--color-info)' },
                    { label: 'Aprobadas',   val: metricas.aprobadas,   total: metricas.total, color: 'var(--color-success)' },
                    { label: 'Rechazadas',  val: metricas.rechazadas,  total: metricas.total, color: 'var(--color-danger)' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: 4 }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>{item.val}</span>
                      </div>
                      <div style={{ background: 'var(--color-border)', borderRadius: 'var(--radius-full)', height: 8 }}>
                        <div style={{
                          width: `${item.total > 0 ? (item.val / item.total) * 100 : 0}%`,
                          height: '100%',
                          background: item.color,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>ℹ️ Fase actual</p>
                  <p>El sistema opera en <strong>Fase 2</strong> con datos simulados (mocks).</p>
                  <p style={{ marginTop: '0.5rem' }}>En la <strong>Fase 3</strong> los datos se conectarán al API Gateway del Backend (Track A).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── POLÍTICAS DE APOYO ── */}
      {seccion === 'politicas' && (
        <div id="admin-politicas" className="animate-fade-in">
          <div className="card">
            <div className="card__header">
              <div>
                <div className="card__title">📑 Tabla B — Políticas de Apoyo por IMA</div>
                <div className="card__subtitle">Define los montos de apoyo según el Índice de Masa Animal (SRS Tabla B)</div>
              </div>
              <button
                id="btn-editar-politicas"
                className="btn btn-outline btn-sm"
                onClick={() => alert('Edición de políticas disponible en Fase 3 (conexión con Backend Track A)')}
              >
                ✏️ Editar
              </button>
            </div>
            <div className="card__body">
              <div className="table-wrapper">
                <table className="data-table" aria-label="Tabla de políticas de apoyo">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Clasificación IMA</th>
                      <th>Rango IMA</th>
                      <th>Monto de apoyo (MXN/mes)</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {politicas.map(p => (
                      <tr key={p.id} id={`politica-row-${p.id}`}>
                        <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.id}</td>
                        <td>
                          <span className={`badge badge-${
                            p.montoPeso === 0            ? 'success'
                            : p.imaMax <= 0.84           ? 'info'
                            : p.imaMax <= 1.30           ? 'warning'
                            : 'danger'
                          }`}>
                            {p.clasificacionIMA}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {p.imaMin.toFixed(2)} – {p.imaMax === 9.99 ? '∞' : p.imaMax.toFixed(2)}
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: p.montoPeso > 0 ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                          }}>
                            {p.montoPeso > 0 ? `$${p.montoPeso.toLocaleString()}` : 'Sin apoyo'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{p.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--color-info)' }}>
                ℹ️ Los montos mostrados son de referencia para la Fase 2. La edición real requiere privilegios de administrador en el Backend (Track A).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COSTOS DE ALIMENTO ── */}
      {seccion === 'costos' && (
        <div id="admin-costos" className="animate-fade-in">
          <div className="card">
            <div className="card__header">
              <div>
                <div className="card__title">💰 Tabla de Costo de Alimento Mensual</div>
                <div className="card__subtitle">Costo estimado de alimentación mensual (MXN) por tipo y tamaño de mascota</div>
              </div>
              <button
                id="btn-editar-costos"
                className="btn btn-outline btn-sm"
                onClick={() => alert('Edición de costos disponible en Fase 3 (conexión con Backend Track A)')}
              >
                ✏️ Editar
              </button>
            </div>
            <div className="card__body">
              <div className="table-wrapper">
                <table className="data-table" aria-label="Tabla de costos de alimento">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Tamaño</th>
                      <th>Costo mensual (MXN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costos.map(c => (
                      <tr key={c.id} id={`costo-row-${c.id}`}>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{c.tipoNombre === 'Perro' ? '🐕' : '🐈'}</span>
                            {c.tipoNombre}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{c.tamanoNombre}</td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
                            ${c.costoMensual.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: 4 }}>MXN/mes</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
