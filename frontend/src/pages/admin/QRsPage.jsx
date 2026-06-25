import { useState, useEffect } from 'react';
import { listarQRs, listarFormularios, crearQR, eliminarQR, toggleActivoQR } from '../../services/adminService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const codigoCorto = (cod) => cod ? cod.substring(0, 8) + '...' : '-';
const formatearFecha = (f) => f ? f.split('T')[0] : null;

export default function QRsPage() {
  const [qrs, setQrs] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoQR, setNuevoQR] = useState({ formulario_id: '', fecha_inicio: '', fecha_cierre: '' });

  const cargar = async () => {
    try {
      const [data, forms] = await Promise.all([listarQRs(), listarFormularios()]);
      setQrs(data);
      setFormularios(forms);
    } catch { }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleCrearQR = async (e) => {
    e.preventDefault();
    try {
      await crearQR(nuevoQR);
      setMostrarModal(false);
      setNuevoQR({ formulario_id: '', fecha_inicio: '', fecha_cierre: '' });
      await cargar();
    } catch { }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este código QR? Las asistencias vinculadas quedarán sin referencia.')) return;
    try {
      await eliminarQR(id);
      await cargar();
    } catch { }
  };

  const handleToggle = async (id) => {
    try {
      await toggleActivoQR(id);
      await cargar();
    } catch { }
  };

  const descargarPNG = (codigo) => {
    window.open(`${API_URL}/qr/imagen/${codigo}`, '_blank');
  };

  const descargarConNombre = async (codigo, nombre) => {
    try {
      const imgResp = await fetch(`${API_URL}/qr/imagen/${codigo}`);
      const imgBlob = await imgResp.blob();
      const img = await createImageBitmap(imgBlob);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height + 60;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = '#1a365d';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(nombre, canvas.width / 2, canvas.height - 20);
      const link = document.createElement('a');
      link.download = `${codigo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { }
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Códigos QR</h2>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Crear QR
        </button>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Crear nuevo código QR</h3>
            <form onSubmit={handleCrearQR}>
              <div className="form-group">
                <label className="form-label">Taller</label>
                <select className="form-input" value={nuevoQR.formulario_id} onChange={(e) => setNuevoQR({ ...nuevoQR, formulario_id: e.target.value })} required>
                  <option value="">Seleccionar taller</option>
                  {formularios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de inicio <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
                <input type="date" className="form-input" value={nuevoQR.fecha_inicio} onChange={(e) => setNuevoQR({ ...nuevoQR, fecha_inicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de cierre <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
                <input type="date" className="form-input" value={nuevoQR.fecha_cierre} onChange={(e) => setNuevoQR({ ...nuevoQR, fecha_cierre: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear QR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <h3>No hay códigos QR generados</h3>
            <p>Crea un QR para comenzar a registrar asistencias.</p>
          </div>
        </div>
      ) : (
        <div className="qr-grid">
          {qrs.map((qr) => {
            const url = `${window.location.origin}/a/${qr.codigo}`;
            return (
              <div key={qr.id} className="qr-card">
                <div className="qr-card-top">
                  <div className="qr-card-info">
                    <h4>{qr.formulario_nombre}</h4>
                    <span className="qr-grados">{(qr.grados || []).join(', ') || 'Sin grados'}</span>
                  </div>
                  <span className={`badge ${qr.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                    {qr.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="qr-card-body">
                  <div className="qr-code-block">
                    <span className="qr-code-label">Código</span>
                    <span className="qr-code-value">{codigoCorto(qr.codigo)}</span>
                  </div>
                  <div className="qr-code-block">
                    <span className="qr-code-label">Vigencia</span>
                    <span className="qr-code-value">
                      {formatearFecha(qr.fecha_inicio) && formatearFecha(qr.fecha_cierre)
                        ? `${formatearFecha(qr.fecha_inicio)} → ${formatearFecha(qr.fecha_cierre)}`
                        : 'Sin vigencia'}
                    </span>
                  </div>
                </div>

                <div className="qr-card-url">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                </div>

                <div className="qr-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => descargarPNG(qr.codigo)} title="Ver QR">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ver
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => descargarConNombre(qr.codigo, qr.formulario_nombre)} title="Descargar QR con nombre">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Descargar
                  </button>
                  {qr.activo ? (
                    <button className="btn btn-warning btn-sm" onClick={() => handleToggle(qr.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      Desactivar
                    </button>
                  ) : (
                    <button className="btn btn-success btn-sm" onClick={() => handleToggle(qr.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Activar
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(qr.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }
        .qr-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          transition: var(--transition);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .qr-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .qr-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 18px 20px 12px;
          gap: 12px;
        }
        .qr-card-info h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 2px;
          line-height: 1.3;
        }
        .qr-grados {
          font-size: 12px;
          color: var(--text-muted);
        }
        .qr-card-body {
          padding: 0 20px 12px;
          display: flex;
          gap: 24px;
        }
        .qr-code-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .qr-code-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
          color: var(--text-muted);
        }
        .qr-code-value {
          font-size: 13px;
          color: var(--text-secondary);
          font-family: 'SF Mono', 'Consolas', 'Liberation Mono', monospace;
        }
        .qr-card-url {
          padding: 10px 20px;
          background: var(--bg);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-muted);
          min-width: 0;
        }
        .qr-card-url a {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--secondary);
        }
        .qr-card-actions {
          display: flex;
          gap: 8px;
          padding: 14px 20px;
          flex-wrap: nowrap;
        }
        .qr-card-actions .btn {
          flex: 1;
          justify-content: center;
          min-width: 0;
        }
        @media (max-width: 600px) {
          .qr-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
