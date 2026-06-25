import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AsistenciaPage from './pages/public/AsistenciaPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import FormulariosPage from './pages/admin/FormulariosPage';
import QRsPage from './pages/admin/QRsPage';
import EventosPage from './pages/admin/EventosPage';
import GradosPage from './pages/admin/GradosPage';
import SeccionesPage from './pages/admin/SeccionesPage';
import EstudiantesPage from './pages/admin/EstudiantesPage';
import AsistenciasPage from './pages/admin/AsistenciasPage';
import ReportesPage from './pages/admin/ReportesPage';
import ConfiguracionPage from './pages/admin/ConfiguracionPage';
import AdminLayout from './components/admin/AdminLayout';

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return <div className="loading">Cargando</div>;
  return usuario ? children : <Navigate to="/admin/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/a/:codigo" element={<AsistenciaPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="formularios" element={<FormulariosPage />} />
        <Route path="qrs" element={<QRsPage />} />
        <Route path="eventos" element={<EventosPage />} />
        <Route path="grados" element={<GradosPage />} />
        <Route path="secciones" element={<SeccionesPage />} />
        <Route path="estudiantes" element={<EstudiantesPage />} />
        <Route path="asistencias" element={<AsistenciasPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" />} />
      <Route path="*" element={<Navigate to="/admin" />} />
    </Routes>
  );
}
