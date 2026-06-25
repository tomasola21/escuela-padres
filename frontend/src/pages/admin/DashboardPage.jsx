import { useState, useEffect } from 'react';
import { obtenerDashboard } from '../../services/adminService';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="loading">Cargando dashboard</div>;
  if (!data) return <div className="alert alert-error">Error al cargar datos del dashboard</div>;

  const stats = [
    { label: 'Total Formularios', value: data.totalFormularios },
    { label: 'Total Registros', value: data.totalRegistros },
    { label: 'Total Grados', value: data.totalGrados },
    { label: 'Total Secciones', value: data.totalSecciones },
    { label: 'Total Estudiantes', value: data.totalEstudiantes },
    { label: 'Formularios Activos', value: data.formulariosActivos },
    { label: 'Formularios Inactivos', value: data.formulariosInactivos }
  ];

  const barData = {
    labels: data.asistenciasPorGrado?.map((g) => g.nombre) || [],
    datasets: [{
      label: 'Asistencias',
      data: data.asistenciasPorGrado?.map((g) => g.total) || [],
      backgroundColor: '#2a4a7f',
      borderRadius: 4
    }]
  };

  const doughnutData = {
    labels: data.asistenciasPorFormulario?.map((f) => f.nombre) || [],
    datasets: [{
      data: data.asistenciasPorFormulario?.map((f) => f.total) || [],
      backgroundColor: ['#2a4a7f', '#3182ce', '#63b3ed', '#38a169', '#d69e2e', '#e53e3e', '#805ad5']
    }]
  };

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, color: '#1a365d' }}>Asistencias por Grado</h3>
          {data.asistenciasPorGrado?.length > 0 ? (
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          ) : (
            <p className="empty-state" style={{ padding: 40 }}>Sin datos disponibles</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, color: '#1a365d' }}>Asistencias por Formulario</h3>
          {data.asistenciasPorFormulario?.length > 0 ? (
            <Doughnut data={doughnutData} options={{ responsive: true }} />
          ) : (
            <p className="empty-state" style={{ padding: 40 }}>Sin datos disponibles</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, color: '#1a365d' }}>Asistencias por Fecha</h3>
        {data.asistenciasPorFecha?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Asistencias</th>
                </tr>
              </thead>
              <tbody>
                {data.asistenciasPorFecha.map((item, i) => (
                  <tr key={i}>
                    <td>{new Date(item.fecha).toLocaleDateString('es-PE')}</td>
                    <td>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state" style={{ padding: 40 }}>Sin registros de asistencia</p>
        )}
      </div>
    </div>
  );
}
