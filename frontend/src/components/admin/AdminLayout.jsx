import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const links = [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/formularios', label: 'Formularios', icon: '📋' },
    { to: '/admin/qrs', label: 'Códigos QR', icon: '📱' },
    { to: '/admin/grados', label: 'Grados', icon: '📚' },
    { to: '/admin/secciones', label: 'Secciones', icon: '📐' },
    { to: '/admin/estudiantes', label: 'Estudiantes', icon: '👨‍🎓' },
    { to: '/admin/asistencias', label: 'Asistencias', icon: '✅' },
    { to: '/admin/reportes', label: 'Reportes', icon: '📈' },
    { to: '/admin/configuracion', label: 'Configuración', icon: '⚙️' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Escuela de Padres</h2>
          <p>Panel Administrativo</p>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} style={{ marginTop: 16 }}>
            <span>🚪</span>
            Cerrar Sesión
          </button>
        </nav>
      </div>

      <div className="main-content" style={{ flex: 1 }}>
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1>Panel de Control</h1>
          </div>
          <div className="topbar-user">
            <span>{usuario?.nombre}</span>
            <span className="badge" style={{ background: '#bee3f8', color: '#2a4365' }}>
              {usuario?.rol}
            </span>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
