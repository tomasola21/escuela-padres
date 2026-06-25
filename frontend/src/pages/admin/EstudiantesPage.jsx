import { useState, useEffect } from 'react';
import { listarGrados, listarSecciones, listarEstudiantes, crearEstudiante, actualizarEstudiante, eliminarEstudiante, importarExcelEstudiantes } from '../../services/adminService';

const initialForm = { codigo: '', nombre_completo: '', grado_id: '', seccion_id: '' };

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [excelResult, setExcelResult] = useState(null);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');

  const cargar = async () => {
    try {
      const params = {};
      if (filtroGrado) params.grado_id = filtroGrado;
      if (filtroSeccion) params.seccion_id = filtroSeccion;
      setEstudiantes(await listarEstudiantes(params));
      setGrados(await listarGrados());
      setSecciones(await listarSecciones());
    } catch { }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [filtroGrado, filtroSeccion]);

  const openCreate = () => { setForm(initialForm); setEditandoId(null); setError(''); setModal(true); };

  const openEdit = (e) => {
    setForm({ codigo: e.codigo, nombre_completo: e.nombre_completo, grado_id: e.grado_id.toString(), seccion_id: e.seccion_id.toString() });
    setEditandoId(e.id);
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await actualizarEstudiante(editandoId, { ...form, grado_id: parseInt(form.grado_id), seccion_id: parseInt(form.seccion_id) });
      } else {
        await crearEstudiante({ ...form, grado_id: parseInt(form.grado_id), seccion_id: parseInt(form.seccion_id) });
      }
      setModal(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este estudiante?')) return;
    try { await eliminarEstudiante(id); await cargar(); } catch { }
  };

  const handleImportExcel = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setExcelResult(null);
    try {
      const result = await importarExcelEstudiantes(archivo);
      setExcelResult(result);
      await cargar();
    } catch (err) {
      setExcelResult({ error: true, mensaje: err.response?.data?.mensaje || 'Error al importar' });
    }
    e.target.value = '';
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Gestión de Estudiantes</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="btn btn-success btn-sm" style={{ cursor: 'pointer' }}>
            Importar Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Estudiante</button>
        </div>
      </div>

      {excelResult && (
        <div className={`alert ${excelResult.error ? 'alert-error' : 'alert-success'}`}>
          {excelResult.mensaje || (excelResult.importados ? `Importados: ${excelResult.importados}, Errores: ${excelResult.errores}` : '')}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 200, margin: 0 }}>
            <label className="form-label">Filtrar por Grado</label>
            <select className="form-input" value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)}>
              <option value="">Todos</option>
              {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 200, margin: 0 }}>
            <label className="form-label">Filtrar por Sección</label>
            <select className="form-input" value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)}>
              <option value="">Todos</option>
              {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setFiltroGrado(''); setFiltroSeccion(''); }}>Limpiar</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Código</th><th>Nombre Completo</th><th>Grado</th><th>Sección</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {estudiantes.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No hay estudiantes registrados</td></tr>
              ) : (
                estudiantes.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'monospace' }}>{e.codigo}</td>
                    <td><strong>{e.nombre_completo}</strong></td>
                    <td>{e.grado_nombre}</td>
                    <td>{e.seccion_nombre}</td>
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
            <h3 className="modal-title">{editandoId ? 'Editar Estudiante' : 'Nuevo Estudiante'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Código</label>
                <input className="form-input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: EST-001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input className="form-input" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Grado</label>
                  <select className="form-input" value={form.grado_id} onChange={(e) => setForm({ ...form, grado_id: e.target.value })} required>
                    <option value="">Seleccionar</option>
                    {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sección</label>
                  <select className="form-input" value={form.seccion_id} onChange={(e) => setForm({ ...form, seccion_id: e.target.value })} required>
                    <option value="">Seleccionar</option>
                    {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
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
