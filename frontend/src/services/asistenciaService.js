import api from './api';

export const verificarQR = async (codigo) => {
  const response = await api.get(`/qr/verificar/${codigo}`);
  return response.data;
};

export const verificarDispositivo = async (formularioId, deviceId) => {
  const response = await api.get(`/asistencias/verificar-dispositivo/${formularioId}/${deviceId}`);
  return response.data;
};

export const registrarAsistencia = async (data) => {
  const response = await api.post('/asistencias', data);
  return response.data;
};

export const obtenerEstadisticas = async (formularioId) => {
  const params = formularioId ? { formulario_id: formularioId } : {};
  const response = await api.get('/asistencias/estadisticas', { params });
  return response.data;
};
