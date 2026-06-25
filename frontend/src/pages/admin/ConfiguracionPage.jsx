import { useState, useEffect } from 'react';
import { obtenerConfiguracion, actualizarConfiguracion } from '../../services/adminService';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    obtenerConfiguracion()
      .then(setConfig)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const handleToggle = async (clave) => {
    const nuevoValor = config[clave] === 'true' ? 'false' : 'true';
    setMensaje('');
    try {
      await actualizarConfiguracion(clave, nuevoValor);
      setConfig({ ...config, [clave]: nuevoValor });
      setMensaje('Configuración actualizada correctamente.');
    } catch {
      setMensaje('Error al actualizar configuración.');
    }
  };

  if (cargando) return <div className="loading">Cargando</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" style={{ margin: 0 }}>Configuración del Sistema</h2>
      </div>

      {mensaje && <div className={`alert ${mensaje.includes('Error') ? 'alert-error' : 'alert-success'}`}>{mensaje}</div>}

      <div className="card">
        <h3 style={{ marginBottom: 20, color: '#1a365d' }}>Control de Registro</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f7fafc', borderRadius: 8 }}>
            <input
              type="checkbox"
              id="permitir_un_solo_envio"
              checked={config.permitir_un_solo_envio === 'true'}
              onChange={() => handleToggle('permitir_un_solo_envio')}
              style={{ width: 20, height: 20 }}
            />
            <div>
              <label htmlFor="permitir_un_solo_envio" style={{ fontWeight: 600, cursor: 'pointer' }}>
                Permitir solo un envío por dispositivo
              </label>
              <p style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
                Si está activado, cada dispositivo solo podrá registrar una vez por formulario.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f7fafc', borderRadius: 8 }}>
            <input
              type="checkbox"
              id="permitir_multiple_envio"
              checked={config.permitir_multiple_envio === 'true'}
              onChange={() => handleToggle('permitir_multiple_envio')}
              style={{ width: 20, height: 20 }}
            />
            <div>
              <label htmlFor="permitir_multiple_envio" style={{ fontWeight: 600, cursor: 'pointer' }}>
                Permitir múltiples envíos
              </label>
              <p style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
                Si está activado, un mismo dispositivo puede registrar varias veces.
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: '#ebf8ff', borderRadius: 8, fontSize: 13, color: '#2a4365' }}>
          <strong>Nota:</strong> Si activas "Permitir solo un envío por dispositivo", el sistema generará un ID único con <code>crypto.randomUUID()</code> y lo almacenará en localStorage para evitar registros duplicados.
        </div>
      </div>
    </div>
  );
}
