import { useState, useEffect, useCallback } from 'react';
import { obtenerDashboard, listarFormularios, listarGrados, listarSecciones } from '../../services/adminService';
import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const COLORS = ['#2a4a7f', '#3182ce', '#63b3ed', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20', '#319795', '#d53f8c'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [formularios, setFormularios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);

  const [filtroFormulario, setFiltroFormulario] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    listarFormularios().then(setFormularios).catch(() => {});
    listarGrados().then(setGrados).catch(() => {});
  }, []);

  const formularioSel = formularios.find(f => f.id === parseInt(filtroFormulario));
  const gradosFiltrados = filtroFormulario && formularioSel?.grados?.length
    ? grados.filter(g => formularioSel.grados.some(fg => fg.id === g.id))
    : grados;

  const cargarSecciones = useCallback(async (gradoId) => {
    if (gradoId) {
      try {
        const data = await listarSecciones({ grado_id: gradoId });
        setSecciones(data);
      } catch { setSecciones([]); }
    } else {
      setSecciones([]);
    }
  }, []);

  const cargar = useCallback(async (filtros = {}) => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
      const qs = params.toString();
      const data = await obtenerDashboard(qs);
      setData(data);
    } catch {}
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleFormularioChange = (e) => {
    const val = e.target.value;
    setFiltroFormulario(val);
    setFiltroGrado('');
    setFiltroSeccion('');
    setSecciones([]);
  };

  const aplicarFiltros = () => {
    cargar({
      formulario_id: filtroFormulario,
      grado_id: filtroGrado,
      seccion_id: filtroSeccion,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta
    });
  };

  const limpiarFiltros = () => {
    setFiltroFormulario('');
    setFiltroGrado('');
    setFiltroSeccion('');
    setFechaDesde('');
    setFechaHasta('');
    setSecciones([]);
    cargar({});
  };

  const handleGradoChange = (e) => {
    const val = e.target.value;
    setFiltroGrado(val);
    setFiltroSeccion('');
    setSecciones([]);
    if (val) cargarSecciones(val);
  };

  if (cargando && !data) return <div className="loading">Cargando dashboard</div>;

  const stats = data ? [
    { label: 'Total Talleres', value: data.totalFormularios },
    { label: 'Registros Filtrados', value: data.totalRegistros },
    { label: 'Participación', value: data.totalEstudiantes > 0 ? Math.round(data.totalRegistros / data.totalEstudiantes * 100) + '%' : '0%' },
    { label: 'Total Estudiantes', value: data.totalEstudiantes },
    { label: 'Talleres Activos', value: data.formulariosActivos },
    { label: 'Talleres Inactivos', value: data.formulariosInactivos }
  ] : [];

  const barGradoData = data ? {
    labels: data.asistenciasPorGrado?.map(g => g.nombre) || [],
    datasets: [{
      label: 'Asistencias',
      data: data.asistenciasPorGrado?.map(g => g.total) || [],
      backgroundColor: COLORS[0],
      borderRadius: 4
    }]
  } : null;

  const barSeccionData = data ? {
    labels: data.asistenciasPorSeccion?.map(s => s.nombre) || [],
    datasets: [{
      label: 'Asistencias',
      data: data.asistenciasPorSeccion?.map(s => s.total) || [],
      backgroundColor: COLORS[1],
      borderRadius: 4
    }]
  } : null;

  const doughnutData = data ? {
    labels: data.asistenciasPorFormulario?.map(f => f.nombre) || [],
    datasets: [{
      data: data.asistenciasPorFormulario?.map(f => f.total) || [],
      backgroundColor: COLORS
    }]
  } : null;

  const lineData = data ? {
    labels: data.asistenciasPorFecha?.map(f => {
      const d = new Date(f.fecha);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    }) || [],
    datasets: [{
      label: 'Asistencias',
      data: data.asistenciasPorFecha?.map(f => f.total) || [],
      borderColor: COLORS[0],
      backgroundColor: COLORS[0] + '20',
      fill: true,
      tension: 0.3,
      pointRadius: 3
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  const barOptions = {
    ...chartOptions,
    plugins: { legend: { display: false } }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
            <label className="form-label">Taller</label>
            <select className="form-input" value={filtroFormulario} onChange={handleFormularioChange}>
              <option value="">Todos</option>
              {formularios.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
            <label className="form-label">Grado</label>
            <select className="form-input" value={filtroGrado} onChange={handleGradoChange}>
              <option value="">Todos</option>
              {gradosFiltrados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
            <label className="form-label">Sección</label>
            <select className="form-input" value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)} disabled={!filtroGrado}>
              <option value="">{filtroGrado ? 'Todas' : 'Primero grado'}</option>
              {secciones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label className="form-label">Desde</label>
            <input type="date" className="form-input" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label className="form-label">Hasta</label>
            <input type="date" className="form-input" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 0 4px 0' }}>
            <button className="btn btn-primary" onClick={aplicarFiltros}>Filtrar</button>
            <button className="btn btn-secondary" onClick={limpiarFiltros}>Limpiar</button>
          </div>
        </div>
        {cargando && <div style={{ marginTop: 8, fontSize: 12, color: '#718096' }}>Actualizando...</div>}
      </div>

      {data && (
        <>
          <div className="grid-3" style={{ marginBottom: 32 }}>
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={{ background: s.label === 'Registros Filtrados' ? '#ebf8ff' : '' }}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 32 }}>
            {lineData && lineData.labels.length > 0 && (
              <div className="card">
                <h3 className="card-title">Asistencias por Fecha</h3>
                <Line data={lineData} options={chartOptions} />
              </div>
            )}
            {doughnutData && doughnutData.labels.length > 0 && (
              <div className="card">
                <h3 className="card-title">Asistencias por Taller</h3>
                <Doughnut data={doughnutData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className="grid-2" style={{ marginBottom: 32 }}>
            {barGradoData && barGradoData.labels.length > 0 && (
              <div className="card">
                <h3 className="card-title">Asistencias por Grado</h3>
                <Bar data={barGradoData} options={barOptions} />
              </div>
            )}
            {barSeccionData && barSeccionData.labels.length > 0 && (
              <div className="card">
                <h3 className="card-title">Asistencias por Sección</h3>
                <Bar data={barSeccionData} options={barOptions} />
              </div>
            )}
          </div>

          {data.recientes?.length > 0 && (
            <div className="card">
              <h3 className="card-title">Registros Recientes</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Grado</th>
                      <th>Sección</th>
                      <th>Taller</th>
                      <th>Evento</th>
                      <th>Registrado por</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recientes.map((r, i) => (
                      <tr key={r.id || i}>
                        <td><strong>{r.estudiante_nombre}</strong></td>
                        <td>{r.grado_nombre}</td>
                        <td>{r.seccion_nombre}</td>
                        <td>{r.formulario_nombre}</td>
                        <td>{r.evento_nombre || '-'}</td>
                        <td>{r.registrado_por || '-'}</td>
                        <td>{new Date(r.fecha_registro).toLocaleString('es-PE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!data.asistenciasPorFecha?.length && !data.asistenciasPorGrado?.length && !data.recientes?.length && (
            <div className="card">
              <p className="empty-state" style={{ padding: 40 }}>Sin datos con los filtros seleccionados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
