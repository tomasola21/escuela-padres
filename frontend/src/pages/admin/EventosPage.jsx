import { useState, useEffect, useRef } from 'react';
import { listarEventos, crearEvento, actualizarEvento, eliminarEvento } from '../../services/adminService';

const initialForm = { nombre: '', logo: '' };

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const cargar = async () => {
    try {
      const data = await listarEventos();
      setEventos(data);
    } catch { }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const openCreate = () => {
    setForm(initialForm);
    setEditandoId(null);
    setLogoPreview(null);
    setError('');
    setModal(true);
  };

  const openEdit = (e) => {
    setForm({ nombre: e.nombre, logo: '' });
    setEditandoId(e.id);
    setLogoPreview(e.logo || null);
    setError('');
    setModal(true);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setForm({ ...form, logo: dataUrl });
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm({ ...form, logo: '' });
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await actualizarEvento(editandoId, form);
      } else {
        await crearEvento(form);
      }
      setModal(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await eliminarEvento(id);
      await cargar();
    } catch { }
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Gestión de Eventos</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Evento</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventos.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No hay eventos registrados</td></tr>
              ) : (
                eventos.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {e.logo ? (
                        <img src={e.logo} alt={e.nombre} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 4 }} />
                      ) : (
                        <span style={{ color: '#a0aec0' }}>-</span>
                      )}
                    </td>
                    <td><strong>{e.nombre}</strong></td>
                    <td>{new Date(e.created_at).toLocaleDateString('es-PE')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editandoId ? 'Editar Evento' : 'Nuevo Evento'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del evento</label>
                <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Logo</label>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFile} style={{ fontSize: 13 }} />
                {logoPreview && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={logoPreview} alt="preview" style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 4 }} />
                    <button type="button" className="btn btn-sm" style={{ background: '#fed7d7', color: '#c53030' }} onClick={removeLogo}>Quitar</button>
                  </div>
                )}
                {editandoId && !logoPreview && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#718096' }}>Sin logo actualmente</div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
