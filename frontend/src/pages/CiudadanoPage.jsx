import { useState, useEffect, useRef } from 'react';
import {
  getTiposMascota, getRazas, getTamanos, getPesoIdealService,
  calcularIMAService, clasificarIMAService,
  getMisSolicitudes, crearSolicitud, calcularMontoSugeridoService,
} from '../services/api.service.js';
import { ESTADOS } from '../mocks/solicitudes.mock.js';
import { RAZA_TAMANO_MAPPING } from '../mocks/catalogos.mock.js';

const MAX_MASCOTAS = 3;

/**
 * IMAGauge — Indicador visual en tiempo real del Índice de Masa Animal.
 * Modificado para soportar 4 estados (Bajo peso, Peso ideal, Sobrepeso, Obeso) y mover el marcador dinámicamente.
 */
function IMAGauge({ estadoCalculado }) {
  let pct = 0;
  let colorVar = 'var(--color-text)';

  if (estadoCalculado === 'Bajo peso') {
    pct = 12.5;
    colorVar = '#90CAF9'; // Azul claro
  } else if (estadoCalculado === 'Peso ideal') {
    pct = 37.5;
    colorVar = 'var(--color-success)';
  } else if (estadoCalculado === 'Sobrepeso') {
    pct = 62.5;
    colorVar = 'var(--color-warning)';
  } else if (estadoCalculado === 'Obeso') {
    pct = 87.5;
    colorVar = 'var(--color-danger)';
  } else {
    pct = 50; // Centro por defecto
  }

  return (
    <div id="ima-gauge" className="ima-gauge-container animate-fade-in">
      <div className="ima-gauge-title">📊 Índice de Masa Animal (IMA)</div>
      
      <div
        className={`ima-value`}
        style={{ fontWeight: 800, fontSize: '1.4rem', color: colorVar, margin: '0.5rem 0', transition: 'color 0.3s ease' }}
        aria-live="polite"
      >
        {estadoCalculado || '—'}
      </div>

      <div className="ima-bar-track" role="img" aria-label="Barra de IMA" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Fondo de 4 colores para la barra */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '25%', height: '100%', background: '#90CAF9', opacity: 0.3 }} />
        <div style={{ position: 'absolute', top: 0, left: '25%', width: '25%', height: '100%', background: 'var(--color-success)', opacity: 0.3 }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', width: '25%', height: '100%', background: 'var(--color-warning)', opacity: 0.3 }} />
        <div style={{ position: 'absolute', top: 0, left: '75%', width: '25%', height: '100%', background: 'var(--color-danger)', opacity: 0.3 }} />
        
        <div className="ima-bar-indicator" style={{ 
          left: `${pct}%`, 
          background: colorVar,
          transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease' 
        }} />
      </div>

      <div className="ima-labels" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontSize: '0.72rem', marginTop: '0.5rem' }}>
        <span>Bajo peso</span>
        <span>Peso ideal</span>
        <span>Sobrepeso</span>
        <span>Obeso</span>
      </div>
    </div>
  );
}

/** Badge de estado de solicitud */
function EstadoBadge({ estado }) {
  const map = {
    [ESTADOS.PENDIENTE]:   { cls: 'badge-info',    label: 'Pendiente'    },
    [ESTADOS.EN_REVISION]: { cls: 'badge-warning',  label: 'En Revisión' },
    [ESTADOS.APROBADO]:    { cls: 'badge-success',  label: 'Aprobado'    },
    [ESTADOS.RECHAZADO]:   { cls: 'badge-danger',   label: 'Rechazado'   },
  };
  const { cls, label } = map[estado] || { cls: 'badge-neutral', label: estado };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/**
 * CiudadanoPage — Vista principal del ciudadano.
 * Incluye:
 * - Listado de solicitudes propias
 * - Formulario de nueva solicitud con:
 *   · Cascada TipoMascota → RazaMascota
 *   · Cálculo de IMA en tiempo real
 *   · Upload de certificado veterinario (opcional)
 * - Validación: máximo 3 mascotas por ciudadano (CA-03)
 */
export default function CiudadanoPage({ session }) {
  const [tab, setTab] = useState('mis-solicitudes');  // 'mis-solicitudes' | 'nueva'

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [tipos, setTipos] = useState([]);
  const [razas, setRazas] = useState([]);
  const [tamanos, setTamanos] = useState([]);
  const [form, setForm] = useState({
    // Datos dueño
    nombre: session?.nombre || '',
    telefono: session?.telefono || '',
    email: session?.email || '',
    // Datos mascota
    mascotaNombre: '',
    tipoId: '',
    razaId: '',
    tamanoId: '',
    pesoActual: '',
    // Certificado veterinario (opcional)
    certificado: null,
    certificadoNombre: '',
  });
  const [pesoIdeal, setPesoIdeal] = useState(null);
  const [ima, setIMA] = useState(null);
  const [clasificacion, setClasificacion] = useState(null);
  const [montoPrevisto, setMontoPrevisto] = useState(0);
  const [estadoCalculado, setEstadoCalculado] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // ── Mis solicitudes ────────────────────────────────────────────────────────
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [loadingSol, setLoadingSol] = useState(true);
  const fileInputRef = useRef(null);

  // Carga inicial
  useEffect(() => {
    getTiposMascota().then(setTipos);
    getTamanos().then(setTamanos);
    if (session?.curp) {
      getMisSolicitudes(session.curp)
        .then(setMisSolicitudes)
        .catch(err => console.warn('No se pudieron cargar las solicitudes previas:', err.message))
        .finally(() => setLoadingSol(false));
    } else {
      setLoadingSol(false);
    }
  }, [session?.curp]);

  // Cascada: cuando cambia el tipo → cargar razas y resetear raza/tamaño
  useEffect(() => {
    if (form.tipoId) {
      getRazas(Number(form.tipoId)).then(setRazas);
    } else {
      setRazas([]);
    }
    setForm(prev => ({ ...prev, razaId: '', tamanoId: '' }));
    setPesoIdeal(null); setIMA(null); setClasificacion(null);
  }, [form.tipoId]);

  // Efecto: Auto-asignación de Tamaño basado en la Raza (Tabla A y B)
  useEffect(() => {
    if (form.razaId) {
      const tamanoAsignado = RAZA_TAMANO_MAPPING[form.razaId];
      if (tamanoAsignado) {
        setForm(prev => ({ ...prev, tamanoId: String(tamanoAsignado) }));
      }
    } else {
      setForm(prev => ({ ...prev, tamanoId: '' }));
    }
  }, [form.razaId]);

  // Recalcular peso ideal e IMA cuando cambia raza, tamaño o peso
  useEffect(() => {
    const recalcular = async () => {
      if (form.razaId && form.tamanoId) {
        const pi = await getPesoIdealService(Number(form.razaId), Number(form.tamanoId));
        setPesoIdeal(pi);
        if (pi && form.pesoActual) {
          const imaVal = calcularIMAService(Number(form.pesoActual), pi.pesoIdeal);
          const clasif = clasificarIMAService(imaVal);
          setIMA(imaVal);
          setClasificacion(clasif);
          setMontoPrevisto(calcularMontoSugeridoService(imaVal));
        } else {
          setIMA(null); setClasificacion(null); setMontoPrevisto(0);
        }
      } else {
        setPesoIdeal(null); setIMA(null); setClasificacion(null);
      }
    };
    recalcular();
  }, [form.razaId, form.tamanoId, form.pesoActual]);

  // useEffect para el cálculo dinámico en el Frontend (Mock temporal según instrucciones)
  useEffect(() => {
    if (form.razaId && form.pesoActual) {
      const mockPesosIdeales = {
        4: { peso_min: 2, peso_max: 3 }, // Chihuahua
        11: { peso_min: 3, peso_max: 5 }, // Siamés
      };
      const peso = Number(form.pesoActual);
      const limites = mockPesosIdeales[form.razaId] || { peso_min: 5, peso_max: 10 }; // Fallback para otras razas
      
      if (peso < limites.peso_min) {
        setEstadoCalculado('Bajo peso');
      } else if (peso <= limites.peso_max) {
        setEstadoCalculado('Peso ideal');
      } else if (peso <= limites.peso_max * 1.20) {
        setEstadoCalculado('Sobrepeso');
      } else {
        setEstadoCalculado('Obeso');
      }
    } else {
      setEstadoCalculado(null);
    }
  }, [form.razaId, form.pesoActual]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, certificado: file, certificadoNombre: file.name }));
    }
  };

  const handleDropFile = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setForm(prev => ({ ...prev, certificado: file, certificadoNombre: file.name }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim())     errors.nombre = 'El nombre es obligatorio';
    if (!form.telefono.trim())   errors.telefono = 'El teléfono es obligatorio';
    if (!form.mascotaNombre.trim()) errors.mascotaNombre = 'El nombre de la mascota es obligatorio';
    if (!form.tipoId)            errors.tipoId = 'Selecciona el tipo de mascota';
    if (!form.razaId)            errors.razaId = 'Selecciona la raza';
    if (!form.tamanoId)          errors.tamanoId = 'Selecciona el tamaño';
    if (!form.pesoActual || isNaN(Number(form.pesoActual)) || Number(form.pesoActual) <= 0)
      errors.pesoActual = 'Ingresa un peso válido en kilogramos';
    return errors;
  };

  // Filtrado de tamaños según tipo:
  // Gatos: Pequeño (id=2) y Mediano (id=3) — según bd_catalogos.PesoIdeal real
  // Perros: Todos (Mini=1, Pequeño=2, Mediano=3, Grande=4, Gigante=5)
  const tamanosFiltrados = tamanos.filter(t => {
    if (!form.tipoId) return true;
    if (form.tipoId === '2') return t.id === 2 || t.id === 3; // Gato: Pequeño, Mediano
    return true; // Perro: Todos
  });

  const handleSubmit = async e => {
    e.preventDefault();
    if (misSolicitudes.length >= MAX_MASCOTAS) return;

    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSubmitting(true);
    try {
      const tipoObj  = tipos.find(t => t.id === Number(form.tipoId));
      const razaObj  = razas.find(r => r.id === Number(form.razaId));
      const tamObj   = tamanos.find(t => t.id === Number(form.tamanoId));

      const pesoIdealKg = pesoIdeal?.pesoIdeal ?? null;
      const imaFinal    = ima;
      const montoCalc   = calcularMontoSugeridoService(imaFinal);

      const payload = {
        dueno: {
          nombre: form.nombre.trim(),
          curp: session?.curp || '',
          telefono: form.telefono.trim(),
          email: form.email.trim(),
        },
        mascota: {
          nombre: form.mascotaNombre.trim(),
          tipoId: Number(form.tipoId),     tipoNombre: tipoObj?.nombre,
          razaId: Number(form.razaId),     razaNombre: razaObj?.nombre,
          tamanoId: Number(form.tamanoId), tamanoNombre: tamObj?.nombre,
          pesoActualKg: Number(form.pesoActual),
          pesoIdealKg,
          ima: imaFinal,
          clasificacionIMA: clasificacion?.label || null,
          certificadoVeterinario: form.certificadoNombre || null,
          montoSugerido: montoCalc,
        },
      };

      const nueva = await crearSolicitud(payload);
      setMisSolicitudes(prev => [...prev, nueva]);
      setSuccessMsg(`✅ Solicitud ${nueva.id} enviada correctamente. La Autoridad la revisará pronto.`);
      setTab('mis-solicitudes');
      // Reset form
      setForm(prev => ({ ...prev, mascotaNombre: '', tipoId: '', razaId: '', tamanoId: '', pesoActual: '', certificado: null, certificadoNombre: '' }));
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const limitAlcanzado = misSolicitudes.length >= MAX_MASCOTAS;

  return (
    <div id="ciudadano-page" className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">👤 Portal Ciudadano</h1>
          <p className="page-subtitle">Gestiona las solicitudes de apoyo para tus mascotas</p>
        </div>
        {/* Contador de mascotas */}
        <div className={`pet-counter ${limitAlcanzado ? 'limit-reached' : ''}`}>
          🐾 {misSolicitudes.length} / {MAX_MASCOTAS} mascotas registradas
          {limitAlcanzado && <span style={{ marginLeft: 4 }}>· Límite alcanzado</span>}
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div id="success-alert" role="status" style={{
          background: 'var(--color-success-bg)',
          border: '1px solid var(--color-success)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: 'var(--color-success)',
          fontSize: '0.9rem',
        }}>
          {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          id="tab-mis-solicitudes"
          className={`btn ${tab === 'mis-solicitudes' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('mis-solicitudes')}
        >
          📋 Mis Solicitudes ({misSolicitudes.length})
        </button>
        <button
          id="tab-nueva-solicitud"
          className={`btn ${tab === 'nueva' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('nueva')}
          disabled={limitAlcanzado}
          title={limitAlcanzado ? `Límite de ${MAX_MASCOTAS} mascotas alcanzado (CA-03)` : ''}
        >
          ➕ Nueva Solicitud
        </button>
      </div>

      {/* ── TAB: Mis Solicitudes ── */}
      {tab === 'mis-solicitudes' && (
        <div id="tab-panel-mis-solicitudes">
          {loadingSol ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 1s infinite' }}>🐾</div>
              Cargando tus solicitudes...
            </div>
          ) : misSolicitudes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐕</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Aún no tienes solicitudes</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Registra a tu mascota para solicitar el apoyo económico.
              </p>
              <button id="btn-primera-solicitud" className="btn btn-primary" onClick={() => setTab('nueva')}>
                ➕ Crear primera solicitud
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {misSolicitudes.map(sol => (
                <div key={sol.id} className="card animate-fade-in" id={`solicitud-${sol.id}`}>
                  <div className="card__header">
                    <div>
                      <div className="card__title">
                        {sol.mascota.tipoNombre === 'Perro' ? '🐕' : '🐈'} {sol.mascota.nombre}
                      </div>
                      <div className="card__subtitle">{sol.id} · {new Date(sol.fechaCreacion).toLocaleDateString('es-MX')}</div>
                    </div>
                    <EstadoBadge estado={sol.estado} />
                  </div>
                  <div className="card__body">
                    <div className="form-grid">
                      <div>
                        <div className="text-sm text-muted">Raza / Tamaño</div>
                        <div style={{ fontWeight: 600 }}>{sol.mascota.razaNombre} — {sol.mascota.tamanoNombre}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted">Peso actual / ideal</div>
                        <div style={{ fontWeight: 600 }}>{sol.mascota.pesoActualKg} kg / {sol.mascota.pesoIdealKg} kg</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted">IMA Calculado</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {sol.mascota.ima?.toFixed(2)} — <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{sol.mascota.clasificacionIMA}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted">Monto Sugerido</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-secondary)', fontSize: '1.1rem' }}>
                          {sol.montoSugerido > 0 ? `$${sol.montoSugerido.toLocaleString()} MXN` : 'No aplica'}
                        </div>
                      </div>
                    </div>
                    {sol.certificadoVeterinario && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--color-info)' }}>
                        📎 Certificado veterinario adjunto: {sol.certificadoVeterinario}
                      </div>
                    )}
                    {sol.comentarioAutoridad && (
                      <div style={{ marginTop: '0.75rem', background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.87rem' }}>
                        💬 <strong>Comentario de la Autoridad:</strong> {sol.comentarioAutoridad}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Nueva Solicitud ── */}
      {tab === 'nueva' && (
        <div id="tab-panel-nueva-solicitud" className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
            {/* Formulario principal */}
            <form id="form-nueva-solicitud" onSubmit={handleSubmit} noValidate>

              {/* ─ Sección 1: Datos del Dueño ─ */}
              <div className="card mb-6">
                <div className="card__header">
                  <div>
                    <div className="card__title">👤 Datos del Solicitante</div>
                    <div className="card__subtitle">Información personal del dueño de la mascota</div>
                  </div>
                </div>
                <div className="card__body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="form-nombre" className="form-label">Nombre Completo <span className="required">*</span></label>
                      <input id="form-nombre" name="nombre" type="text" className="form-input"
                        placeholder="Nombre completo" value={form.nombre} onChange={handleChange}
                        aria-required="true" aria-describedby={formErrors.nombre ? 'err-nombre' : undefined} />
                      {formErrors.nombre && <p id="err-nombre" className="form-error">{formErrors.nombre}</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="form-curp-display" className="form-label">CURP <span className="optional">(validación por Autoridad)</span></label>
                      <input id="form-curp-display" type="text" className="form-input"
                        value={session?.curp || ''} disabled
                        style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="form-telefono" className="form-label">Teléfono <span className="required">*</span></label>
                      <input id="form-telefono" name="telefono" type="tel" className="form-input"
                        placeholder="10 dígitos" value={form.telefono} onChange={handleChange}
                        maxLength={10} aria-required="true" />
                      {formErrors.telefono && <p className="form-error">{formErrors.telefono}</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="form-email" className="form-label">Correo electrónico <span className="optional">opcional</span></label>
                      <input id="form-email" name="email" type="email" className="form-input"
                        placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─ Sección 2: Datos de la Mascota ─ */}
              <div className="card mb-6">
                <div className="card__header">
                  <div>
                    <div className="card__title">🐾 Datos de la Mascota</div>
                    <div className="card__subtitle">El IMA se calculará automáticamente</div>
                  </div>
                </div>
                <div className="card__body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="form-mascota-nombre" className="form-label">Nombre de la Mascota <span className="required">*</span></label>
                      <input id="form-mascota-nombre" name="mascotaNombre" type="text" className="form-input"
                        placeholder="Ej. Max, Luna..." value={form.mascotaNombre} onChange={handleChange} aria-required="true" />
                      {formErrors.mascotaNombre && <p className="form-error">{formErrors.mascotaNombre}</p>}
                    </div>

                    {/* Cascada: Tipo → Raza */}
                    <div className="form-group">
                      <label htmlFor="form-tipo" className="form-label">Tipo de Mascota <span className="required">*</span></label>
                      <select id="form-tipo" name="tipoId" className="form-select" value={form.tipoId} onChange={handleChange} aria-required="true">
                        <option value="">— Selecciona un tipo —</option>
                        {tipos.map(t => (
                          <option key={t.id} value={t.id}>{t.emoji} {t.nombre}</option>
                        ))}
                      </select>
                      {formErrors.tipoId && <p className="form-error">{formErrors.tipoId}</p>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="form-raza" className="form-label">Raza <span className="required">*</span></label>
                      <select id="form-raza" name="razaId" className="form-select" value={form.razaId}
                        onChange={handleChange} disabled={!form.tipoId} aria-required="true"
                        title={!form.tipoId ? 'Primero selecciona el tipo de mascota' : ''}>
                        <option value="">— Selecciona una raza —</option>
                        {razas.map(r => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                      {formErrors.razaId && <p className="form-error">{formErrors.razaId}</p>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="form-tamano" className="form-label">Tamaño <span className="required">*</span></label>
                      <select id="form-tamano" name="tamanoId" className="form-select" value={form.tamanoId} onChange={handleChange} aria-required="true" disabled={!!form.razaId} title={form.razaId ? 'El tamaño se asigna automáticamente según la raza' : ''}>
                        <option value="">— Selecciona un tamaño —</option>
                        {tamanosFiltrados.map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                      {formErrors.tamanoId && <p className="form-error">{formErrors.tamanoId}</p>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="form-peso" className="form-label">Peso Actual <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input id="form-peso" name="pesoActual" type="number" min="0.1" step="0.1"
                          className="form-input" placeholder="0.0" value={form.pesoActual} onChange={handleChange}
                          style={{ paddingRight: '3rem' }} aria-required="true" />
                        <span style={{
                          position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem',
                        }}>kg</span>
                      </div>
                      {pesoIdeal && (
                        <p className="form-helper">
                          ℹ️ Peso ideal de referencia: {pesoIdeal.pesoMinKg}–{pesoIdeal.pesoMaxKg} kg (ideal: {pesoIdeal.pesoIdeal} kg)
                        </p>
                      )}
                      {formErrors.pesoActual && <p className="form-error">{formErrors.pesoActual}</p>}
                    </div>
                  </div>

                  {/* Upload Certificado Veterinario */}
                  <div className="section-divider">
                    <h3>📎 Certificado Veterinario</h3>
                  </div>
                  <div
                    id="upload-certificado"
                    className={`upload-area ${form.certificadoNombre ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDropFile}
                    onDragOver={e => e.preventDefault()}
                    role="button"
                    tabIndex={0}
                    aria-label="Cargar certificado veterinario"
                  >
                    <div className="upload-icon">
                      {form.certificadoNombre ? '✅' : '📄'}
                    </div>
                    {form.certificadoNombre ? (
                      <>
                        <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>Archivo cargado</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{form.certificadoNombre}</p>
                      </>
                    ) : (
                      <>
                        <p className="upload-text">
                          <strong>Haz clic o arrastra</strong> tu certificado veterinario aquí
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                          PDF, JPG o PNG · Máx. 5 MB · <strong>Opcional — La Autoridad validará la documentación</strong>
                        </p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange} style={{ display: 'none' }}
                      id="input-certificado" aria-label="Seleccionar archivo de certificado" />
                  </div>
                </div>
              </div>

              {/* Error general */}
              {formErrors.submit && (
                <div role="alert" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                  ⚠️ {formErrors.submit}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <button type="button" id="btn-cancelar-solicitud" className="btn btn-ghost"
                  onClick={() => setTab('mis-solicitudes')}>
                  Cancelar
                </button>
                <button type="submit" id="btn-enviar-solicitud" className="btn btn-primary btn-lg"
                  disabled={submitting || limitAlcanzado}>
                  {submitting ? '⏳ Enviando...' : '📤 Enviar Solicitud de Apoyo'}
                </button>
              </div>
            </form>

            {/* Panel lateral IMA */}
            <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 2rem)' }}>
              <IMAGauge estadoCalculado={estadoCalculado} />
              {montoPrevisto > 0 && (
                <div id="monto-previsto" style={{
                  marginTop: '1rem',
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Apoyo estimado
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                    ${montoPrevisto.toLocaleString()} MXN
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Sujeto a revisión de la Autoridad
                  </div>
                </div>
              )}
              <div style={{
                marginTop: '1rem',
                background: 'var(--color-info-bg)',
                border: '1px solid #90CAF9',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.8rem',
                color: 'var(--color-info)',
              }}>
                <strong>ℹ️ Nota Importante</strong><br />
                La validación del CURP y la revisión del certificado veterinario son realizadas por la Autoridad humana, no de forma automática.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
