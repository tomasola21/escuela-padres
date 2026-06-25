import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const PRESETS = {
  clasico: { nombre: 'Clásico', dark: '#1a365d', light: '#ffffff' },
  moderno: { nombre: 'Moderno', dark: '#2b6cb0', light: '#ebf8ff' },
  redondeado: { nombre: 'Redondeado', dark: '#22543d', light: '#f0fff4' },
  colorido: { nombre: 'Colorido', dark: '#6b46c1', light: '#faf5ff' },
  minimal: { nombre: 'Minimal', dark: '#1a202c', light: '#ffffff' }
};

export default function QRCustomizer({ codigo, configActual, onGuardar, guardando }) {
  const [preset, setPreset] = useState(configActual?.preset || 'clasico');
  const [dark, setDark] = useState(configActual?.dark || PRESETS.clasico.dark);
  const [light, setLight] = useState(configActual?.light || PRESETS.clasico.light);

  const seleccionarPreset = (key) => {
    setPreset(key);
    setDark(PRESETS[key].dark);
    setLight(PRESETS[key].light);
  };

  const previewUrl = `${API_URL}/qr/imagen/${codigo}?dark=${encodeURIComponent(dark)}&light=${encodeURIComponent(light)}`;

  const handleGuardar = () => {
    onGuardar({ preset, dark, light });
  };

  return (
    <div>
      <h3 className="modal-title">Personalizar QR</h3>

      <p style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
        Elige un estilo o personaliza los colores
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => seleccionarPreset(key)}
            style={{
              padding: 12,
              border: `2px solid ${preset === key ? '#3182ce' : '#e2e8f0'}`,
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: 40, height: 40, margin: '0 auto 8px',
              borderRadius: 4,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              padding: 4,
              background: p.light
            }}>
              {[0,1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{
                  background: p.dark,
                  borderRadius: key === 'redondeado' ? 4 : key === 'minimal' ? 1 : 2
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#2d3748' }}>{p.nombre}</div>
            <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{p.dark}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Color oscuro</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={dark} onChange={(e) => { setDark(e.target.value); setPreset(null); }}
              style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e2e8f0', cursor: 'pointer', padding: 2 }} />
            <input className="form-input" value={dark} onChange={(e) => { setDark(e.target.value); setPreset(null); }}
              style={{ flex: 1 }} placeholder="#000000" />
          </div>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Color claro</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={light} onChange={(e) => { setLight(e.target.value); setPreset(null); }}
              style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e2e8f0', cursor: 'pointer', padding: 2 }} />
            <input className="form-input" value={light} onChange={(e) => { setLight(e.target.value); setPreset(null); }}
              style={{ flex: 1 }} placeholder="#ffffff" />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>Vista previa</p>
        <img src={previewUrl} alt="Vista previa QR"
          style={{ maxWidth: 200, borderRadius: 8, border: '1px solid #e2e8f0' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar estilo'}
        </button>
      </div>
    </div>
  );
}
