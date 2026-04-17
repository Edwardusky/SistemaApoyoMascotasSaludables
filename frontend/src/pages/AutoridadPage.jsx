import { useState, useEffect } from 'react';
import { getSolicitudes, actualizarEstadoSolicitud } from '../services/api.service.js';
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

  useEffect(() => {
    getSolicitudes()
      .then(setSolicitudes)
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="page-title">🏛️ Bandeja de Autoridad</h1>
        <p className="page-subtitle">Revisión y resolución de solicitudes de apoyo ciudadano</p>
      </div>

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

      {/* Modal de confirmación */}
      {modal && (
        <ConfirmModal
          solicitud={modal.solicitud}
          accion={modal.accion}
          onConfirm={handleConfirm}
          onCancel={() => !procesando && setModal(null)}
        />
      )}
    </div>
  );
}
