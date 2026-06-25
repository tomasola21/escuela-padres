import { useState, useEffect } from 'react';
import { listarQRs, regenerarQR, toggleActivoQR, actualizarConfigQR } from '../../services/adminService';
import QRCustomizer from '../../components/admin/QRCustomizer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function QRsPage() {
  const [qrs, setQrs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [qrSeleccionado, setQrSeleccionado] = useState(null);
  const [qrCustomizando, setQrCustomizando] = useState(false);
  const [qrGuardando, setQrGuardando] = useState(false);

  const cargar = async () => {
    try {
      const data = await listarQRs();
      setQrs(data);
    } catch { }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

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

  const handleGuardarConfig = async (config) => {
    setQrGuardando(true);
    try {
      const actualizado = await actualizarConfigQR(qrSeleccionado.id, config);
      setQrSeleccionado(actualizado);
      setQrCustomizando(false);
      await cargar();
    } catch {}
    setQrGuardando(false);
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
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Formulario</th>
                <th>Código</th>
                <th>Estado</th>
                <th>URL de Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {qrs.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No hay códigos QR generados</td></tr>
              ) : (
                qrs.map((qr) => {
                  const url = `${window.location.origin}/a/${qr.codigo}`;
                  return (
                    <tr key={qr.id}>
                      <td><strong>{qr.formulario_nombre}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{qr.codigo.substring(0, 16)}...</td>
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
                          <button className="btn btn-primary btn-sm" onClick={() => setQrSeleccionado(qr)}>Ver QR</button>
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

      {qrSeleccionado && (
        <div className="modal-overlay" onClick={() => setQrSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: qrCustomizando ? 560 : 500 }}>
            {qrCustomizando ? (
              <QRCustomizer
                codigo={qrSeleccionado.codigo}
                configActual={qrSeleccionado.config ? JSON.parse(qrSeleccionado.config) : null}
                onGuardar={handleGuardarConfig}
                guardando={qrGuardando}
              />
            ) : (
              <>
                <h3 className="modal-title">{qrSeleccionado.formulario_nombre}</h3>
                <div style={{ margin: '20px 0' }}>
                  <img
                    src={`${API_URL}/qr/imagen/${qrSeleccionado.codigo}`}
                    alt="QR"
                    style={{ maxWidth: 280, borderRadius: 8 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <p style={{ fontSize: 12, color: '#718096', wordBreak: 'break-all' }}>
                  {window.location.origin}/a/{qrSeleccionado.codigo}
                </p>
                <div className="modal-actions" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setQrCustomizando(true)}>Personalizar</button>
                  <button className="btn btn-secondary" onClick={() => setQrSeleccionado(null)}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
