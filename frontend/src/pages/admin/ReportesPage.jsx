import { useState, useEffect } from 'react';
import { listarFormularios, listarGrados, listarSecciones, descargarReporte } from '../../services/adminService';

export default function ReportesPage() {
  const [formularios, setFormularios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(null);
  const [filtros, setFiltros] = useState({
    formulario_id: '', grado_id: '', seccion_id: '',
    fecha_desde: '', fecha_hasta: ''
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
    setDescargando(formato);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const blob = await descargarReporte(formato, params);
      const ext = formato === 'word' ? 'doc' : formato;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_asistencias.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar reporte');
    }
    setDescargando(null);
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Descarga de Reportes</h2>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Filtros</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 200, margin: 0 }}>
            <label className="form-label">Taller</label>
            <select className="form-input" value={filtros.formulario_id} onChange={handleFormularioChange}>
              <option value="">Todos los talleres</option>
              {formularios.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150, margin: 0 }}>
            <label className="form-label">Grado</label>
            <select className="form-input" value={filtros.grado_id} onChange={(e) => setFiltros({ ...filtros, grado_id: e.target.value })}>
              <option value="">Todos los grados</option>
              {gradosFiltrados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 140, margin: 0 }}>
            <label className="form-label">Sección</label>
            <select className="form-input" value={filtros.seccion_id} onChange={(e) => setFiltros({ ...filtros, seccion_id: e.target.value })}>
              <option value="">Todas</option>
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
        <h3 className="card-title">Exportar datos</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Selecciona los filtros deseados y elige el formato de descarga.
        </p>
        <div className="descarga-grid">
          <button className="descarga-card" onClick={() => exportar('xlsx')} disabled={descargando === 'xlsx'}>
            <div className="descarga-icon" style={{ background: 'linear-gradient(135deg, #38a169, #2f855a)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
            </div>
            <span className="descarga-name">Excel</span>
            <span className="descarga-ext">.xlsx</span>
          </button>

          <button className="descarga-card" onClick={() => exportar('pdf')} disabled={descargando === 'pdf'}>
            <div className="descarga-icon" style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <span className="descarga-name">PDF</span>
            <span className="descarga-ext">.pdf</span>
          </button>

          <button className="descarga-card" onClick={() => exportar('word')} disabled={descargando === 'word'}>
            <div className="descarga-icon" style={{ background: 'linear-gradient(135deg, #3182ce, #2b6cb0)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            </div>
            <span className="descarga-name">Word</span>
            <span className="descarga-ext">.doc</span>
          </button>
        </div>

        {descargando && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
            Generando {descargando === 'xlsx' ? 'Excel' : descargando === 'pdf' ? 'PDF' : 'Word'}...
          </div>
        )}
      </div>

      <style>{`
        .descarga-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .descarga-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px 16px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
        }
        .descarga-card:hover {
          border-color: var(--secondary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .descarga-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .descarga-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .descarga-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
        .descarga-ext {
          font-size: 12px;
          color: var(--text-muted);
          font-family: 'SF Mono', monospace;
        }
      `}</style>
    </div>
  );
}
