import { useState, useEffect } from 'react';
import { listarFormularios, listarGrados, listarSecciones, descargarReporte } from '../../services/adminService';

export default function ReportesPage() {
  const [formularios, setFormularios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    formulario_id: '', grado_id: '', seccion_id: '',
    fecha_desde: '', fecha_hasta: '', busqueda: ''
  });

  const [formularioSel, setFormularioSel] = useState(null);

  useEffect(() => {
    Promise.all([
      listarFormularios().then(setFormularios).catch(() => {}),
      listarGrados().then(setGrados).catch(() => {}),
      listarSecciones().then(setSecciones).catch(() => {})
    ]).finally(() => setCargando(false));
  }, []);

  const handleFormularioChange = (e) => {
    const val = e.target.value;
    setFiltros(prev => ({ ...prev, formulario_id: val, grado_id: '', seccion_id: '' }));
    const sel = formularios.find(f => f.id === parseInt(val));
    setFormularioSel(sel || null);
  };

  const gradosFiltrados = formularioSel?.grados?.length
    ? grados.filter(g => formularioSel.grados.some(fg => fg.id === g.id))
    : grados;

  const exportar = async (formato) => {
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v && k !== 'busqueda') params[k] = v; });
      const blob = await descargarReporte(formato, params);

      if (formato === 'pdf') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_asistencias.${formato}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_asistencias.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Error al descargar reporte');
    }
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Reportes</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success btn-sm" onClick={() => exportar('xlsx')}>Exportar Excel</button>
          <button className="btn btn-danger btn-sm" onClick={() => exportar('pdf')}>Exportar PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportar('csv')}>Exportar CSV</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 200, margin: 0 }}>
            <label className="form-label">Formulario</label>
            <select className="form-input" value={filtros.formulario_id} onChange={handleFormularioChange}>
              <option value="">Todos</option>
              {formularios.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150, margin: 0 }}>
            <label className="form-label">Grado</label>
            <select className="form-input" value={filtros.grado_id} onChange={(e) => setFiltros({ ...filtros, grado_id: e.target.value })}>
              <option value="">Todos</option>
              {gradosFiltrados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150, margin: 0 }}>
            <label className="form-label">Sección</label>
            <select className="form-input" value={filtros.seccion_id} onChange={(e) => setFiltros({ ...filtros, seccion_id: e.target.value })}>
              <option value="">Todos</option>
              {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150, margin: 0 }}>
            <label className="form-label">Desde</label>
            <input type="date" className="form-input" value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} />
          </div>
          <div className="form-group" style={{ minWidth: 150, margin: 0 }}>
            <label className="form-label">Hasta</label>
            <input type="date" className="form-input" value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="empty-state">
          <h3>Reportes de Asistencia</h3>
          <p>Selecciona los filtros deseados y exporta el reporte en el formato de tu preferencia.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-success" onClick={() => exportar('xlsx')}>📊 Exportar Excel</button>
            <button className="btn btn-danger" onClick={() => exportar('pdf')}>📄 Exportar PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
