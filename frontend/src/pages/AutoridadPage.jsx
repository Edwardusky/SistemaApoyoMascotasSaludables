import { useState, useEffect } from 'react';
import { getSolicitudes, actualizarEstadoSolicitud, getPoliticasApoyo, getCostosAlimento, updatePoliticaApoyo, updateCostoAlimento } from '../services/api.service.js';
import { ESTADOS } from '../mocks/solicitudes.mock.js';

/** Badge de estado de solicitud */
function EstadoBadge({ estado }) {
  const map = {
    [ESTADOS.PENDIENTE]:   { cls: 'badge-info',    label: '⏳ Pendiente'    },
    [ESTADOS.EN_REVISION]: { cls: 'badge-warning',  label: '🔍 En Revisión' },
    [ESTADOS.APROBADO]:    { cls: 'badge-success',  label: '✅ Aprobado'    },
    [ESTADOS.RECHAZADO]:   { cls: 'badge-danger',   label: '❌ Rechazado'   },
  };
  const { cls, label } = map[estado] || { cls: 'badge-neutral', label: estado };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/** Modal de confirmación para Aprobar / Rechazar */
function ConfirmModal({ solicitud, accion, onConfirm, onCancel }) {
  const [comentario, setComentario] = useState('');
  const esAprobacion = accion === ESTADOS.APROBADO;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true"
      aria-labelledby="modal-title" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal animate-slide-up">
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">
            {esAprobacion ? '✅ Aprobar Solicitud' : '❌ Rechazar Solicitud'}
          </h2>
        </div>
        <div className="modal__body">
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
            {esAprobacion
              ? `Confirmas la aprobación de la solicitud de apoyo para `
              : `Confirmas el rechazo de la solicitud de apoyo para `}
            <strong>{solicitud.mascota.nombre}</strong> ({solicitud.dueno.nombre}).
          </p>
          {esAprobacion && (
            <div style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}>
              💰 Monto a aprobar: <strong>${solicitud.montoSugerido.toLocaleString()} MXN</strong>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="modal-comentario" className="form-label">
              Comentario de la Autoridad
              {!esAprobacion && <span className="required"> *</span>}
              {esAprobacion && <span className="optional"> opcional</span>}
            </label>
            <textarea
              id="modal-comentario"
              className="form-input form-textarea"
              rows={3}
              placeholder={esAprobacion
                ? 'Observaciones adicionales (opcional)'
                : 'Motivo del rechazo...'}
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
        <div className="modal__footer">
          <button id="btn-modal-cancelar" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button
            id="btn-modal-confirmar"
            className={`btn ${esAprobacion ? 'btn-success' : 'btn-danger'}`}
            onClick={() => onConfirm(comentario)}
            disabled={!esAprobacion && !comentario.trim()}
          >
            {esAprobacion ? '✅ Confirmar Aprobación' : '❌ Confirmar Rechazo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta individual de solicitud con detalles del dueño y mascota */
function SolicitudCard({ solicitud, onAccion }) {
  const [expanded, setExpanded] = useState(false);
  const m = solicitud.mascota;
  const d = solicitud.dueno;
  const puedeActuar = solicitud.estado === ESTADOS.PENDIENTE || solicitud.estado === ESTADOS.EN_REVISION;

  return (
    <div id={`solicitud-card-${solicitud.id}`} className="card animate-fade-in" style={{ marginBottom: '1rem' }}>
      <div className="card__header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>{m.tipoNombre === 'Perro' ? '🐕' : '🐈'}</span>
          <div>
            <div className="card__title">{m.nombre} <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>· {d.nombre}</span></div>
            <div className="card__subtitle">{solicitud.id} · {new Date(solicitud.fechaCreacion).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <EstadoBadge estado={solicitud.estado} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="card__body animate-fade-in">
          {/* Info mascota */}
          <div className="form-grid-3" style={{ marginBottom: '1rem' }}>
            <div>
              <div className="text-sm text-muted">Raza / Tamaño</div>
              <div style={{ fontWeight: 600 }}>{m.razaNombre}<br />{m.tamanoNombre}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Peso actual / ideal</div>
              <div style={{ fontWeight: 600 }}>{m.pesoActualKg} kg / {m.pesoIdealKg || '—'} kg</div>
            </div>
            <div>
              <div className="text-sm text-muted">IMA</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                {m.ima?.toFixed(2)} — <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>{m.clasificacionIMA}</span>
              </div>
            </div>
          </div>

          {/* Info dueño */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.87rem' }}>
            <strong>👤 Datos del solicitante:</strong> {d.nombre} · CURP: <code style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>{d.curp}</code> · Tel: {d.telefono}
            <div style={{ marginTop: '0.25rem', color: 'var(--color-info)', fontSize: '0.8rem' }}>
              ℹ️ La validación del CURP es responsabilidad de la Autoridad. Revisar documentos originales.
            </div>
          </div>

          {/* Certificado */}
          {m.certificadoVeterinario ? (
            <div style={{ background: 'var(--color-info-bg)', border: '1px solid #90CAF9', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-info)' }}>
              📎 Certificado veterinario adjunto: <strong>{m.certificadoVeterinario}</strong>
              <button
                id={`btn-ver-certif-${solicitud.id}`}
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: '0.5rem' }}
                onClick={() => alert('Función de visualización de certificado activa en Fase 3')}
              >
                Ver documento
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--color-warning-bg)', border: '1px solid #FFB74D', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-warning)' }}>
              ⚠️ Sin certificado veterinario adjunto — La Autoridad puede solicitar presentación física.
            </div>
          )}

          {/* Monto sugerido */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="text-sm text-muted">Monto de apoyo sugerido</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: solicitud.montoSugerido > 0 ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>
                {solicitud.montoSugerido > 0 ? `$${solicitud.montoSugerido.toLocaleString()} MXN` : 'No aplica'}
              </div>
            </div>

            {/* Acciones */}
            {puedeActuar && (
              <div className="flex gap-3">
                <button
                  id={`btn-rechazar-${solicitud.id}`}
                  className="btn btn-danger"
                  onClick={() => onAccion(solicitud, ESTADOS.RECHAZADO)}
                >
                  ❌ Rechazar
                </button>
                <button
                  id={`btn-aprobar-${solicitud.id}`}
                  className="btn btn-success"
                  onClick={() => onAccion(solicitud, ESTADOS.APROBADO)}
                >
                  ✅ Aprobar
                </button>
              </div>
            )}
          </div>

          {/* Comentario de autoridad */}
          {solicitud.comentarioAutoridad && (
            <div style={{ marginTop: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.87rem' }}>
              💬 <strong>Decisión:</strong> {solicitud.comentarioAutoridad}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * AutoridadPage — Bandeja de entrada para la Autoridad revisora.
 * Permite ver, filtrar, aprobar y rechazar solicitudes ciudadanas.
 * La validación del CURP y revisión del certificado veterinario se realiza aquí (CA-02).
 */
export default function AutoridadPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null); // { solicitud, accion }
  const [procesando, setProcesando] = useState(false);

  const [tab, setTab] = useState('solicitudes'); // 'solicitudes' | 'politicas' | 'costos'
  const [politicas, setPoliticas] = useState([]);
  const [costos, setCostos] = useState([]);
  
  // Modales de edición
  const [editingPolitica, setEditingPolitica] = useState(null);
  const [editingCosto, setEditingCosto] = useState(null);

  useEffect(() => {
    Promise.all([
      getSolicitudes(),
      getPoliticasApoyo(),
      getCostosAlimento()
    ])
      .then(([sol, pol, cos]) => {
        setSolicitudes(sol);
        setPoliticas(pol);
        setCostos(cos);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdatePolitica = async (e) => {
    e.preventDefault();
    try {
      const data = await updatePoliticaApoyo(editingPolitica.id, { montoPeso: editingPolitica.montoPeso, descripcion: editingPolitica.descripcion });
      setPoliticas(prev => prev.map(p => p.id === data.id ? { ...p, montoPeso: Number(data.monto_apoyo_mxn), descripcion: data.descripcion } : p));
      setEditingPolitica(null);
      alert('Política actualizada correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateCosto = async (e) => {
    e.preventDefault();
    try {
      const data = await updateCostoAlimento(editingCosto.id, { costoMensual: editingCosto.costoMensual, precioKg: editingCosto.precioKg });
      setCostos(prev => prev.map(c => c.id === data.id ? { ...c, costoMensual: Number(data.costo_mensual), precioKg: Number(data.precio_kg) } : c));
      setEditingCosto(null);
      alert('Costo actualizado correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAccion = (solicitud, accion) => setModal({ solicitud, accion });

  const handleConfirm = async (comentario) => {
    if (!modal) return;
    setProcesando(true);
    try {
      const actualizada = await actualizarEstadoSolicitud(modal.solicitud.id, modal.accion, comentario);
      setSolicitudes(prev => prev.map(s => s.id === actualizada.id ? actualizada : s));
    } finally {
      setProcesando(false);
      setModal(null);
    }
  };

  // Filtrar solicitudes
  const filtradas = solicitudes.filter(s => {
    const matchEstado = !filtroEstado || s.estado === filtroEstado;
    const matchTipo   = !filtroTipo   || s.mascota.tipoNombre === filtroTipo;
    const matchBusq   = !busqueda || [s.id, s.dueno.nombre, s.mascota.nombre, s.dueno.curp]
      .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()));
    return matchEstado && matchTipo && matchBusq;
  });

  // Métricas rápidas
  const pendientes = solicitudes.filter(s => s.estado === ESTADOS.PENDIENTE || s.estado === ESTADOS.EN_REVISION).length;
  const aprobadas  = solicitudes.filter(s => s.estado === ESTADOS.APROBADO).length;
  const rechazadas = solicitudes.filter(s => s.estado === ESTADOS.RECHAZADO).length;

  return (
    <div id="autoridad-page" className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🏛️ Panel de Autoridad</h1>
        <p className="page-subtitle">Revisión de solicitudes y configuración de variables de apoyo</p>
      </div>

      {/* Tabs de sección */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'solicitudes', icon: '📥', label: 'Solicitudes Pendientes' },
          { id: 'politicas',   icon: '📑', label: 'Políticas IMA' },
          { id: 'costos',      icon: '💰', label: 'Precios Alimento' },
        ].map(s => (
          <button
            key={s.id}
            className={`btn ${tab === s.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(s.id)}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {tab === 'solicitudes' && (
        <div id="tab-solicitudes" className="animate-fade-in">

      {/* Stats rápidas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary" aria-hidden="true">📥</div>
          <div>
            <div className="stat-value">{solicitudes.length}</div>
            <div className="stat-label">Total solicitudes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info" aria-hidden="true">⏳</div>
          <div>
            <div className="stat-value">{pendientes}</div>
            <div className="stat-label">Pendientes de revisión</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success" aria-hidden="true">✅</div>
          <div>
            <div className="stat-value">{aprobadas}</div>
            <div className="stat-label">Aprobadas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning" aria-hidden="true">❌</div>
          <div>
            <div className="stat-value">{rechazadas}</div>
            <div className="stat-label">Rechazadas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="card__body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            id="filtro-busqueda"
            type="search"
            className="form-input"
            placeholder="🔍 Buscar por nombre, ID o CURP..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: '1 1 200px' }}
            aria-label="Buscar solicitudes"
          />
          <select id="filtro-estado" className="form-select" value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)} style={{ flex: '0 0 180px' }}
            aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value={ESTADOS.PENDIENTE}>⏳ Pendiente</option>
            <option value={ESTADOS.EN_REVISION}>🔍 En Revisión</option>
            <option value={ESTADOS.APROBADO}>✅ Aprobado</option>
            <option value={ESTADOS.RECHAZADO}>❌ Rechazado</option>
          </select>
          <select id="filtro-tipo" className="form-select" value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)} style={{ flex: '0 0 160px' }}
            aria-label="Filtrar por tipo de mascota">
            <option value="">Todos los tipos</option>
            <option value="Perro">🐕 Perro</option>
            <option value="Gato">🐈 Gato</option>
          </select>
          <button id="btn-limpiar-filtros" className="btn btn-ghost btn-sm"
            onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroTipo(''); }}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de solicitudes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', animation: 'pulse 1s infinite', marginBottom: '1rem' }}>📋</div>
          Cargando solicitudes...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
            {busqueda || filtroEstado || filtroTipo ? 'Sin resultados para los filtros aplicados' : 'No hay solicitudes aún'}
          </h3>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Mostrando {filtradas.length} de {solicitudes.length} solicitudes
          </div>
          {filtradas.map(sol => (
            <SolicitudCard
              key={sol.id}
              solicitud={sol}
              onAccion={handleAccion}
            />
          ))}
        </div>
      )}

          {modal && (
            <ConfirmModal
              solicitud={modal.solicitud}
              accion={modal.accion}
              onConfirm={handleConfirm}
              onCancel={() => !procesando && setModal(null)}
            />
          )}
        </div>
      )}

      {/* ── PESTAÑA: POLÍTICAS IMA ── */}
      {tab === 'politicas' && (
        <div id="tab-politicas" className="animate-fade-in">
          <div className="card">
            <div className="card__header">
              <div className="card__title">📑 Tabla B — Políticas de Apoyo por IMA</div>
              <div className="card__subtitle">Ajusta los porcentajes o montos base para la evaluación automática</div>
            </div>
            <div className="card__body">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Clasificación IMA</th>
                      <th>Rango</th>
                      <th>Monto de apoyo (MXN)</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {politicas.map(p => (
                      <tr key={p.id}>
                        <td><span className="badge badge-info">{p.clasificacionIMA}</span></td>
                        <td style={{ fontFamily: 'monospace' }}>{p.imaMin} - {p.imaMax === 9.99 ? '∞' : p.imaMax}</td>
                        <td style={{ fontWeight: 'bold' }}>${p.montoPeso.toLocaleString()} MXN</td>
                        <td>{p.descripcion}</td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingPolitica({ ...p })}>
                            ✏️ Editar
                          </button>
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

      {/* ── PESTAÑA: COSTOS DE ALIMENTO ── */}
      {tab === 'costos' && (
        <div id="tab-costos" className="animate-fade-in">
          <div className="card">
            <div className="card__header">
              <div className="card__title">💰 Tabla de Costos de Alimento</div>
              <div className="card__subtitle">Configura el costo mensual base y el precio por kg de alimento</div>
            </div>
            <div className="card__body">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipo y Tamaño</th>
                      <th>Costo Mensual (MXN)</th>
                      <th>Precio por Kg (MXN)</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costos.map(c => (
                      <tr key={c.id}>
                        <td>{c.tipoNombre === 'Perro' ? '🐕' : '🐈'} {c.tipoNombre} - {c.tamanoNombre}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>${c.costoMensual.toLocaleString()} MXN</td>
                        <td style={{ fontWeight: 'bold' }}>${c.precioKg.toLocaleString()} MXN / Kg</td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingCosto({ ...c })}>
                            ✏️ Editar
                          </button>
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

      {/* Modal de Edición de Política */}
      {editingPolitica && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-md)', width: '90%', maxWidth: '400px' }}>
            <h2>Editar Política IMA</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>{editingPolitica.clasificacionIMA}</p>
            <form onSubmit={handleUpdatePolitica} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Monto de apoyo (MXN o Porcentaje)</label>
                <input type="number" className="form-input" value={editingPolitica.montoPeso} onChange={e => setEditingPolitica({...editingPolitica, montoPeso: Number(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" value={editingPolitica.descripcion} onChange={e => setEditingPolitica({...editingPolitica, descripcion: e.target.value})} required rows={3}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPolitica(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición de Costo de Alimento */}
      {editingCosto && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-md)', width: '90%', maxWidth: '400px' }}>
            <h2>Editar Costo de Alimento</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>{editingCosto.tipoNombre} - {editingCosto.tamanoNombre}</p>
            <form onSubmit={handleUpdateCosto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Costo Mensual Base (MXN)</label>
                <input type="number" className="form-input" value={editingCosto.costoMensual} onChange={e => setEditingCosto({...editingCosto, costoMensual: Number(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Precio por Kg (MXN)</label>
                <input type="number" step="0.01" className="form-input" value={editingCosto.precioKg} onChange={e => setEditingCosto({...editingCosto, precioKg: Number(e.target.value)})} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingCosto(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
