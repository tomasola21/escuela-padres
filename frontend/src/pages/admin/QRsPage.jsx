import { useState, useEffect } from 'react';
import { listarQRs, listarFormularios, crearQR, regenerarQR, toggleActivoQR } from '../../services/adminService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

  const handleRegenerar = async (formularioId) => {
    if (!confirm('¿Regenerar código QR? El anterior dejará de funcionar.')) return;
    try {
      await regenerarQR(formularioId);
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

  const descargarPDF = async (codigo, nombre) => {
    try {
      const imgUrl = `${API_URL}/qr/imagen/${codigo}`;
      const imgResp = await fetch(imgUrl);
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
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>Crear QR</button>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Crear nuevo código QR</h3>
            <form onSubmit={handleCrearQR}>
              <div className="form-group">
                <label className="form-label">Formulario</label>
                <select className="form-input" value={nuevoQR.formulario_id} onChange={(e) => setNuevoQR({ ...nuevoQR, formulario_id: e.target.value })} required>
                  <option value="">Seleccionar formulario</option>
                  {formularios.filter((f) => !qrs.some((q) => q.formulario_id === f.id)).map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de inicio <span style={{ fontWeight: 400, color: '#718096' }}>(opcional)</span></label>
                <input type="date" className="form-input" value={nuevoQR.fecha_inicio} onChange={(e) => setNuevoQR({ ...nuevoQR, fecha_inicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de cierre <span style={{ fontWeight: 400, color: '#718096' }}>(opcional)</span></label>
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

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Formulario</th>
                <th>Grados</th>
                <th>Código</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>URL de Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {qrs.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No hay códigos QR generados</td></tr>
              ) : (
                qrs.map((qr) => {
                  const url = `${window.location.origin}/a/${qr.codigo}`;
                  return (
                    <tr key={qr.id}>
                      <td><strong>{qr.formulario_nombre}</strong></td>
                      <td style={{ fontSize: 12 }}>{(qr.grados || []).join(', ') || '-'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{qr.codigo.substring(0, 16)}...</td>
                      <td style={{ fontSize: 12 }}>
                        {qr.fecha_inicio ? `${qr.fecha_inicio.split('T')[0]} al ${qr.fecha_cierre ? qr.fecha_cierre.split('T')[0] : '∞'}` : 'Sin vigencia'}
                      </td>
                      <td>
                        <span className={`badge ${qr.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                          {qr.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>
                        <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button className="btn btn-success btn-sm" onClick={() => descargarPNG(qr.codigo)}>PNG</button>
                          <button className="btn btn-warning btn-sm" onClick={() => descargarPDF(qr.codigo, qr.formulario_nombre)}>Descargar PNG</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleRegenerar(qr.formulario_id)}>Regenerar</button>
                          <button className="btn btn-sm" style={{ background: qr.activo ? '#fefcbf' : '#c6f6d5', color: qr.activo ? '#744210' : '#22543d' }} onClick={() => handleToggle(qr.id)}>
                            {qr.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
