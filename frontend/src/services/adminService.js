import api from './api';

export const obtenerDashboard = async (queryString = '') => {
  const response = await api.get(`/reportes/dashboard${queryString ? '?' + queryString : ''}`);
  return response.data;
};

export const listarFormularios = async () => {
  const response = await api.get('/formularios');
  return response.data;
};

export const obtenerFormulario = async (id) => {
  const response = await api.get(`/formularios/${id}`);
  return response.data;
};

export const crearFormulario = async (data) => {
  const response = await api.post('/formularios', data);
  return response.data;
};

export const actualizarFormulario = async (id, data) => {
  const response = await api.put(`/formularios/${id}`, data);
  return response.data;
};

export const eliminarFormulario = async (id) => {
  const response = await api.delete(`/formularios/${id}`);
  return response.data;
};

export const toggleEstadoFormulario = async (id) => {
  const response = await api.patch(`/formularios/${id}/toggle-estado`);
  return response.data;
};

export const listarQRs = async () => {
  const response = await api.get('/qr');
  return response.data;
};

export const obtenerQRPorFormulario = async (formularioId) => {
  const response = await api.get(`/qr/formulario/${formularioId}`);
  return response.data;
};

export const crearQR = async (data) => {
  const response = await api.post('/qr', data);
  return response.data;
};

export const eliminarQR = async (id) => {
  const response = await api.delete(`/qr/${id}`);
  return response.data;
};

export const regenerarQR = async (formularioId) => {
  const response = await api.post(`/qr/${formularioId}/regenerar`);
  return response.data;
};

export const toggleActivoQR = async (id) => {
  const response = await api.patch(`/qr/${id}/toggle-activo`);
  return response.data;
};

export const listarGrados = async () => {
  const response = await api.get('/grados');
  return response.data;
};

export const crearGrado = async (nombre) => {
  const response = await api.post('/grados', { nombre });
  return response.data;
};

export const actualizarGrado = async (id, nombre) => {
  const response = await api.put(`/grados/${id}`, { nombre });
  return response.data;
};

export const eliminarGrado = async (id) => {
  const response = await api.delete(`/grados/${id}`);
  return response.data;
};

export const listarSecciones = async (params = {}) => {
  const response = await api.get('/secciones', { params });
  return response.data;
};

export const crearSeccion = async (nombre) => {
  const response = await api.post('/secciones', { nombre });
  return response.data;
};

export const actualizarSeccion = async (id, nombre) => {
  const response = await api.put(`/secciones/${id}`, { nombre });
  return response.data;
};

export const eliminarSeccion = async (id) => {
  const response = await api.delete(`/secciones/${id}`);
  return response.data;
};

export const listarEstudiantes = async (params) => {
  const response = await api.get('/estudiantes', { params });
  return response.data;
};

export const obtenerEstudiante = async (id) => {
  const response = await api.get(`/estudiantes/${id}`);
  return response.data;
};

export const crearEstudiante = async (data) => {
  const response = await api.post('/estudiantes', data);
  return response.data;
};

export const actualizarEstudiante = async (id, data) => {
  const response = await api.put(`/estudiantes/${id}`, data);
  return response.data;
};

export const eliminarEstudiante = async (id) => {
  const response = await api.delete(`/estudiantes/${id}`);
  return response.data;
};

export const importarExcelEstudiantes = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const response = await api.post('/estudiantes/importar-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const listarAsistencias = async (params) => {
  const response = await api.get('/asistencias', { params });
  return response.data;
};

export const obtenerConfiguracion = async () => {
  const response = await api.get('/configuracion');
  return response.data;
};

export const actualizarConfiguracion = async (clave, valor) => {
  const response = await api.put('/configuracion', { clave, valor });
  return response.data;
};

export const descargarReporte = async (formato, params) => {
  const response = await api.get('/reportes', {
    params: { ...params, formato },
    responseType: formato === 'pdf' ? 'blob' : 'blob'
  });
  return response.data;
};

export const listarEventos = async () => {
  const response = await api.get('/eventos');
  return response.data;
};

export const obtenerEvento = async (id) => {
  const response = await api.get(`/eventos/${id}`);
  return response.data;
};

export const crearEvento = async (data) => {
  const response = await api.post('/eventos', data);
  return response.data;
};

export const actualizarEvento = async (id, data) => {
  const response = await api.put(`/eventos/${id}`, data);
  return response.data;
};

export const eliminarEvento = async (id) => {
  const response = await api.delete(`/eventos/${id}`);
  return response.data;
};
