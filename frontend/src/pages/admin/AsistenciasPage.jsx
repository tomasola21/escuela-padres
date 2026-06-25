import { useState, useEffect } from 'react';
import { listarAsistencias, listarFormularios, listarGrados, listarSecciones, listarEstudiantes } from '../../services/adminService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ formulario_id: '', grado_id: '', seccion_id: '', estudiante_id: '', fecha_desde: '', fecha_hasta: '' });
  const [asistenciaMapa, setAsistenciaMapa] = useState(null);

  const [formularioSel, setFormularioSel] = useState(null);

  const cargar = async () => {
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      setAsistencias(await listarAsistencias(params));
      const forms = await listarFormularios();
      setFormularios(forms);
      setGrados(await listarGrados());
      setSecciones(await listarSecciones());
    } catch { }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const buscar = () => cargar();

  const handleFormularioChange = (e) => {
    const val = e.target.value;
    setFiltros(prev => ({ ...prev, formulario_id: val, grado_id: '', seccion_id: '' }));
    const sel = formularios.find(f => f.id === parseInt(val));
    setFormularioSel(sel || null);
  };

  const gradosFiltrados = formularioSel?.grados?.length
    ? grados.filter(g => formularioSel.grados.some(fg => fg.id === g.id))
    : grados;

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Registro de Asistencias</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 180, margin: 0 }}>
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
          <button className="btn btn-primary btn-sm" onClick={buscar}>Buscar</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Formulario</th>
                <th>Evento</th>
                <th>Grado</th>
                <th>Sección</th>
                <th>Estudiante</th>
                <th>Fecha</th>
                <th>Registrado por</th>
                <th>Navegador</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.length === 0 ? (
                <tr><td colSpan={10} className="empty-state">No hay registros de asistencia</td></tr>
              ) : (
                asistencias.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td>{a.formulario_nombre}</td>
                    <td>{a.evento_nombre || '-'}</td>
                    <td>{a.grado_nombre}</td>
                    <td>{a.seccion_nombre}</td>
                    <td><strong>{a.estudiante_nombre}</strong></td>
                    <td>{new Date(a.fecha_registro).toLocaleString('es-PE')}</td>
                    <td>{a.registrado_por || '-'}</td>
                    <td>{a.navegador}</td>
                    <td>
                      {a.latitud && a.longitud ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setAsistenciaMapa(a)}>
                          Ver mapa
                        </button>
                      ) : 'Sin ubicación'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {asistenciaMapa && (
        <div className="modal-overlay" onClick={() => setAsistenciaMapa(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 className="modal-title">Ubicación del Registro</h3>
            <p style={{ marginBottom: 16, fontSize: 14, color: '#4a5568' }}>
              <strong>{asistenciaMapa.estudiante_nombre}</strong> &middot; {asistenciaMapa.formulario_nombre}
            </p>
            <MapContainer
              center={[parseFloat(asistenciaMapa.latitud), parseFloat(asistenciaMapa.longitud)]}
              zoom={15}
              style={{ height: 350, borderRadius: 8 }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[parseFloat(asistenciaMapa.latitud), parseFloat(asistenciaMapa.longitud)]}>
                <Popup>
                  {asistenciaMapa.estudiante_nombre}<br />
                  {new Date(asistenciaMapa.fecha_registro).toLocaleString('es-PE')}
                </Popup>
              </Marker>
            </MapContainer>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAsistenciaMapa(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
