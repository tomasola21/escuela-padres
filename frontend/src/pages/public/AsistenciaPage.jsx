import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { verificarQR, verificarDispositivo, registrarAsistencia } from '../../services/asistenciaService';
import { listarSecciones, listarEstudiantes } from '../../services/adminService';
import { obtenerDeviceId } from '../../hooks/useDeviceId';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function AsistenciaPage() {
  const { codigo } = useParams();
  const [qrValido, setQrValido] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificarQR(codigo)
      .then((data) => {
        if (data.disponible) {
          setQrValido(true);
          setFormulario(data.formulario);
        } else {
          setQrValido(false);
        }
      })
      .catch((err) => {
        const mensaje = err.response?.data?.mensaje || 'Error al verificar QR';
        setError(mensaje);
        setQrValido(false);
      })
      .finally(() => setCargando(false));
  }, [codigo]);

  if (cargando) return <PublicLayout><div className="loading">Verificando QR</div></PublicLayout>;
  if (!qrValido) return <PublicLayout><MensajeError mensaje={error || 'Este formulario no se encuentra disponible.'} /></PublicLayout>;

  return <FormularioAsistencia formulario={formulario} />;
}

function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <div className="public-header">
        <h1>Escuela de Padres</h1>
        <p>Control de Asistencia</p>
      </div>
      <div className="public-body">
        <div className="public-card">
          {children}
        </div>
      </div>
    </div>
  );
}

function MensajeError({ mensaje }) {
  return (
    <div className="success-screen">
      <div className="icon">&#10060;</div>
      <h2 style={{ color: '#e53e3e' }}>Formulario no disponible</h2>
      <p>{mensaje}</p>
    </div>
  );
}

function FormularioAsistencia({ formulario }) {
  const [grados, setGrados] = useState(formulario.grados || []);
  const [gradoId, setGradoId] = useState('');
  const [secciones, setSecciones] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [seccionId, setSeccionId] = useState('');
  const [estudianteId, setEstudianteId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { ubicacion, error: geoError, solicitando, solicitarUbicacion } = useGeolocation();

  useEffect(() => {
    solicitarUbicacion();
  }, []);

  const cargarSecciones = useCallback(async (gradoId) => {
    if (gradoId) {
      try {
        const data = await listarSecciones({ grado_id: gradoId });
        setSecciones(data);
      } catch {
        setSecciones([]);
      }
    } else {
      setSecciones([]);
    }
  }, []);

  const cargarEstudiantes = useCallback(async (gradoId, seccionId) => {
    if (gradoId && seccionId) {
      try {
        const data = await listarEstudiantes({ grado_id: gradoId, seccion_id: seccionId });
        setEstudiantes(data);
      } catch {
        setEstudiantes([]);
      }
    } else {
      setEstudiantes([]);
    }
  }, []);

  const handleGradoChange = (e) => {
    const val = e.target.value;
    setGradoId(val);
    setSeccionId('');
    setEstudianteId('');
    setSecciones([]);
    setEstudiantes([]);
    if (val) cargarSecciones(val);
  };

  const handleSeccionChange = (e) => {
    const val = e.target.value;
    setSeccionId(val);
    setEstudianteId('');
    setEstudiantes([]);
    if (gradoId && val) cargarEstudiantes(gradoId, val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!gradoId || !seccionId || !estudianteId) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }

    if (!ubicacion) {
      setErrorMsg('Debes proporcionar tu ubicación para registrar la asistencia.');
      return;
    }

    const deviceId = obtenerDeviceId();

    try {
      const verif = await verificarDispositivo(formulario.id, deviceId);
      if (!verif.puedeRegistrar) {
        setErrorMsg('Este dispositivo ya registró asistencia.');
        return;
      }
    } catch {
      const config = await (await fetch(import.meta.env.VITE_API_URL + '/configuracion')).json();
      if (config.permitir_un_solo_envio === 'true') {
        setErrorMsg('No se pudo verificar el dispositivo.');
        return;
      }
    }

    setEnviando(true);

    try {
      await registrarAsistencia({
        formulario_id: formulario.id,
        grado_id: parseInt(gradoId),
        seccion_id: parseInt(seccionId),
        estudiante_id: parseInt(estudianteId),
        latitud: ubicacion?.latitud || null,
        longitud: ubicacion?.longitud || null,
        device_id: deviceId
      });
      setRegistrado(true);
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al registrar asistencia.';
      if (err.response?.data?.yaRegistrado) {
        setErrorMsg('Este dispositivo ya registró asistencia.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (registrado) {
    return (
      <PublicLayout>
        <div className="success-screen">
          <div className="icon">&#10004;</div>
          <h2>Registro realizado correctamente</h2>
          <p>Tu asistencia ha sido registrada exitosamente.</p>
          <p style={{ marginTop: 16, fontSize: 12, color: '#a0aec0' }}>
            {formulario.nombre}
            {formulario.evento && <> &middot; {formulario.evento}</>}
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {formulario.evento_logo && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src={formulario.evento_logo} alt={formulario.evento} style={{ maxWidth: 200, maxHeight: 80, objectFit: 'contain' }} />
        </div>
      )}
      <h2>{formulario.nombre}</h2>
      {formulario.evento && <p className="subtitle">{formulario.evento}</p>}
      {!formulario.evento && <p className="subtitle">Registro de asistencia</p>}

      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Grado</label>
          <select className="form-input" value={gradoId} onChange={handleGradoChange} required>
            <option value="">Seleccionar grado</option>
            {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Sección</label>
          <select className="form-input" value={seccionId} onChange={handleSeccionChange} required disabled={!gradoId}>
            <option value="">{gradoId ? 'Seleccionar sección' : 'Primero selecciona un grado'}</option>
            {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del Estudiante</label>
          <select className="form-input" value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)} required disabled={!gradoId || !seccionId}>
            <option value="">{gradoId && seccionId ? 'Seleccionar estudiante' : 'Primero selecciona grado y sección'}</option>
            {estudiantes.map((e) => <option key={e.id} value={e.id}>{e.nombre_completo}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Ubicación</label>
          {ubicacion ? (
            <div style={{ fontSize: 13, color: '#38a169' }}>
              &#10004; Ubicación obtenida correctamente
            </div>
          ) : solicitando ? (
            <div style={{ fontSize: 13, color: '#718096' }}>
              Solicitando ubicación...
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: '#e53e3e', marginBottom: 8 }}>
                {geoError || 'No se ha obtenido la ubicación'}
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={solicitarUbicacion}>
                Obtener ubicación
              </button>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar Asistencia'}
        </button>
      </form>
    </PublicLayout>
  );
}
