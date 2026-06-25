import { useState, useEffect } from 'react';
import {
  listarFormularios, crearFormulario, actualizarFormulario,
  eliminarFormulario, toggleEstadoFormulario
} from '../../services/adminService';

const initialForm = { nombre: '', descripcion: '', evento: '', fecha_inicio: '', fecha_cierre: '', estado: 'activo' };

export default function FormulariosPage() {
  const [formularios, setFormularios] = useState([]);
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

  useEffect(() => { cargar(); }, []);

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
      fecha_inicio: f.fecha_inicio ? f.fecha_inicio.split('T')[0] : '',
      fecha_cierre: f.fecha_cierre ? f.fecha_cierre.split('T')[0] : '',
      estado: f.estado
    });
    setEditandoId(f.id);
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        <h2 className="page-title" style={{ margin: 0 }}>Gestión de Formularios</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Formulario</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Evento</th>
                <th>Inicio</th>
                <th>Cierre</th>
                <th>Estado</th>
                <th>QR</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {formularios.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No hay formularios registrados</td></tr>
              ) : (
                formularios.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.nombre}</strong></td>
                    <td>{f.evento || '-'}</td>
                    <td>{new Date(f.fecha_inicio).toLocaleDateString('es-PE')}</td>
                    <td>{new Date(f.fecha_cierre).toLocaleDateString('es-PE')}</td>
                    <td>
                      <span className={`badge ${f.estado === 'activo' ? 'badge-activo' : 'badge-inactivo'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => window.open(`/admin/qrs`, '_blank')}>
                        Ver QR
                      </button>
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
            <h3 className="modal-title">{editandoId ? 'Editar Formulario' : 'Nuevo Formulario'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del formulario</label>
                <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Evento <span style={{ fontWeight: 400, color: '#718096' }}>(opcional)</span></label>
                <input className="form-input" value={form.evento} onChange={(e) => setForm({ ...form, evento: e.target.value })} placeholder="Ej: Escuela de Padres, APAFA, Charla" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha de inicio</label>
                  <input type="date" className="form-input" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de cierre</label>
                  <input type="date" className="form-input" value={form.fecha_cierre} onChange={(e) => setForm({ ...form, fecha_cierre: e.target.value })} required />
                </div>
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
