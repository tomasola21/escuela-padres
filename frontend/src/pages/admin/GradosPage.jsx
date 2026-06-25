import { useState, useEffect } from 'react';
import { listarGrados, crearGrado, actualizarGrado, eliminarGrado } from '../../services/adminService';

export default function GradosPage() {
  const [grados, setGrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    try { setGrados(await listarGrados()); } catch { }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const openCreate = () => { setNombre(''); setEditandoId(null); setError(''); setModal(true); };

  const openEdit = (g) => { setNombre(g.nombre); setEditandoId(g.id); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await actualizarGrado(editandoId, nombre);
      } else {
        await crearGrado(nombre);
      }
      setModal(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este grado?')) return;
    try { await eliminarGrado(id); await cargar(); } catch { }
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Gestión de Grados</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Grado</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {grados.length === 0 ? (
                <tr><td colSpan={2} className="empty-state">No hay grados registrados</td></tr>
              ) : (
                grados.map((g) => (
                  <tr key={g.id}>
                    <td><strong>{g.nombre}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(g)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>Eliminar</button>
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
            <h3 className="modal-title">{editandoId ? 'Editar Grado' : 'Nuevo Grado'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del grado</label>
                <input className="form-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: 1° Primaria" required />
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
