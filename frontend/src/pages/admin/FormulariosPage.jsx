import { useState, useEffect } from 'react';
import {
  listarFormularios, crearFormulario, actualizarFormulario,
  eliminarFormulario, toggleEstadoFormulario, listarGrados, listarEventos
} from '../../services/adminService';

const initialForm = { nombre: '', descripcion: '', evento: '', estado: 'activo', evento_id: '', grado_ids: [] };

export default function FormulariosPage() {
  const [formularios, setFormularios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const data = await listarFormularios();
      setFormularios(data);
    } catch { }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    listarGrados().then(setGrados).catch(() => {});
    listarEventos().then(setEventos).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(initialForm);
    setEditandoId(null);
    setError('');
    setModal(true);
  };

  const openEdit = (f) => {
    setForm({
      nombre: f.nombre,
      descripcion: f.descripcion || '',
      evento: f.evento || '',
      estado: f.estado,
      evento_id: f.evento_id || '',
      grado_ids: (f.grados || []).map(g => g.id)
    });
    setEditandoId(f.id);
    setError('');
    setModal(true);
  };

  const handleGradoToggle = (gradoId) => {
    setForm(prev => ({
      ...prev,
      grado_ids: prev.grado_ids.includes(gradoId)
        ? prev.grado_ids.filter(id => id !== gradoId)
        : [...prev.grado_ids, gradoId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.grado_ids.length === 0) {
      setError('Debes seleccionar al menos un grado.');
      return;
    }
    try {
      if (editandoId) {
        await actualizarFormulario(editandoId, form);
      } else {
        await crearFormulario(form);
      }
      setModal(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este formulario?')) return;
    try {
      await eliminarFormulario(id);
      await cargar();
    } catch { }
  };

  const handleToggle = async (id) => {
    try {
      await toggleEstadoFormulario(id);
      await cargar();
    } catch { }
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Gestión de Talleres</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Taller</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Taller</th>
                <th>Evento</th>
                <th>Grados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {formularios.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No hay talleres registrados</td></tr>
              ) : (
                formularios.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.nombre}</strong></td>
                    <td>{f.evento_nombre || f.evento || '-'}</td>
                    <td style={{ fontSize: 13 }}>{(f.grados || []).map(g => g.nombre).join(', ') || '-'}</td>
                    <td>
                      <span className={`badge ${f.estado === 'activo' ? 'badge-activo' : 'badge-inactivo'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>Editar</button>
                        <button className="btn btn-sm" style={{ background: f.estado === 'activo' ? '#fefcbf' : '#c6f6d5', color: f.estado === 'activo' ? '#744210' : '#22543d' }} onClick={() => handleToggle(f.id)}>
                          {f.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>Eliminar</button>
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
            <h3 className="modal-title">{editandoId ? 'Editar Taller' : 'Nuevo Taller'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del taller</label>
                <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Evento</label>
                <select className="form-input" value={form.evento_id} onChange={(e) => setForm({ ...form, evento_id: e.target.value })}>
                  <option value="">Sin evento</option>
                  {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Grados <span style={{ fontWeight: 400, color: '#e53e3e' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {grados.map((g) => (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: form.grado_ids.includes(g.id) ? '#bee3f8' : '#f7fafc', border: '1px solid', borderColor: form.grado_ids.includes(g.id) ? '#63b3ed' : '#e2e8f0' }}>
                      <input type="checkbox" checked={form.grado_ids.includes(g.id)} onChange={() => handleGradoToggle(g.id)} style={{ margin: 0 }} />
                      {g.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
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
