const pool = require('../config/database');
const { detectarNavegador } = require('../utils/helpers');

const registrar = async (req, res) => {
  try {
    const { formulario_id, qr_id, grado_id, seccion_id, estudiante_id, latitud, longitud, device_id, registrado_por } = req.body;

    const [config] = await pool.query("SELECT valor FROM configuracion WHERE clave = 'permitir_un_solo_envio'");
    const permitirUnSoloEnvio = config.length > 0 && config[0].valor === 'true';

    if (permitirUnSoloEnvio && device_id) {
      const [existente] = await pool.query(
        'SELECT id FROM asistencias WHERE formulario_id = ? AND device_id = ?',
        [formulario_id, device_id]
      );
      if (existente.length > 0) {
        return res.status(400).json({
          mensaje: 'Este dispositivo ya registró asistencia.',
          yaRegistrado: true
        });
      }
    }

    const navegador = detectarNavegador(req.headers['user-agent']);

    const [resultado] = await pool.query(
      `INSERT INTO asistencias (formulario_id, qr_id, grado_id, seccion_id, estudiante_id, device_id, latitud, longitud, navegador, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [formulario_id, qr_id || null, grado_id, seccion_id, estudiante_id, device_id || null, latitud || null, longitud || null, navegador, registrado_por || null]
    );

    const [asistencia] = await pool.query(
      `SELECT a.*, f.nombre as formulario_nombre, g.nombre as grado_nombre, s.nombre as seccion_nombre, e.nombre_completo as estudiante_nombre
       FROM asistencias a
       JOIN formularios f ON a.formulario_id = f.id
       JOIN grados g ON a.grado_id = g.id
       JOIN secciones s ON a.seccion_id = s.id
       JOIN estudiantes e ON a.estudiante_id = e.id
       WHERE a.id = ?`,
      [resultado.insertId]
    );

    res.status(201).json({
      mensaje: 'Registro realizado correctamente',
      asistencia: asistencia[0]
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const listar = async (req, res) => {
  try {
    const { formulario_id, grado_id, seccion_id, estudiante_id, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT a.*, f.nombre as formulario_nombre, f.evento, g.nombre as grado_nombre, s.nombre as seccion_nombre, e.nombre_completo as estudiante_nombre, e.codigo as estudiante_codigo
      FROM asistencias a
      JOIN formularios f ON a.formulario_id = f.id
      JOIN grados g ON a.grado_id = g.id
      JOIN secciones s ON a.seccion_id = s.id
      JOIN estudiantes e ON a.estudiante_id = e.id
    `;
    const params = [];
    const condiciones = [];

    if (formulario_id) {
      condiciones.push('a.formulario_id = ?');
      params.push(formulario_id);
    }
    if (grado_id) {
      condiciones.push('a.grado_id = ?');
      params.push(grado_id);
    }
    if (seccion_id) {
      condiciones.push('a.seccion_id = ?');
      params.push(seccion_id);
    }
    if (estudiante_id) {
      condiciones.push('a.estudiante_id = ?');
      params.push(estudiante_id);
    }
    if (fecha_desde) {
      condiciones.push('a.fecha_registro >= ?');
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      condiciones.push('a.fecha_registro <= ?');
      params.push(fecha_hasta + ' 23:59:59');
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }

    query += ' ORDER BY a.fecha_registro DESC';

    const [asistencias] = await pool.query(query, params);
    res.json(asistencias);
  } catch (error) {
    console.error('Error al listar asistencias:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const verificarDispositivo = async (req, res) => {
  try {
    const { formulario_id, device_id } = req.params;

    const [config] = await pool.query("SELECT valor FROM configuracion WHERE clave = 'permitir_un_solo_envio'");
    const permitirUnSoloEnvio = config.length > 0 && config[0].valor === 'true';

    if (!permitirUnSoloEnvio) {
      return res.json({ puedeRegistrar: true, motivo: 'multiple_envio_permitido' });
    }

    const [existente] = await pool.query(
      'SELECT id FROM asistencias WHERE formulario_id = ? AND device_id = ?',
      [formulario_id, device_id]
    );

    if (existente.length > 0) {
      return res.json({ puedeRegistrar: false, motivo: 'dispositivo_ya_registro' });
    }

    res.json({ puedeRegistrar: true, motivo: 'dispositivo_nuevo' });
  } catch (error) {
    console.error('Error al verificar dispositivo:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const obtenerEstadisticas = async (req, res) => {
  try {
    const { formulario_id } = req.query;

    let queryBase = 'FROM asistencias a JOIN formularios f ON a.formulario_id = f.id';
    let whereClause = '';
    const params = [];

    if (formulario_id) {
      whereClause = ' WHERE a.formulario_id = ?';
      params.push(formulario_id);
    }

    const [totalAsistencias] = await pool.query('SELECT COUNT(*) as total ' + queryBase + whereClause, params);

    const [asistenciasPorGrado] = await pool.query(
      `SELECT g.nombre, COUNT(*) as total ${queryBase} JOIN grados g ON a.grado_id = g.id${whereClause} GROUP BY g.id, g.nombre ORDER BY total DESC`,
      params
    );

    const [asistenciasPorSeccion] = await pool.query(
      `SELECT s.nombre, COUNT(*) as total ${queryBase} JOIN secciones s ON a.seccion_id = s.id${whereClause} GROUP BY s.id, s.nombre ORDER BY total DESC`,
      params
    );

    const [asistenciasPorFormulario] = await pool.query(
      `SELECT f.nombre, COUNT(*) as total ${queryBase}${whereClause ? ' WHERE a.formulario_id = ?' : ''} GROUP BY f.id, f.nombre ORDER BY total DESC`,
      formulario_id ? [formulario_id] : []
    );

    const [asistenciasPorFecha] = await pool.query(
      `SELECT DATE(a.fecha_registro) as fecha, COUNT(*) as total ${queryBase}${whereClause} GROUP BY DATE(a.fecha_registro) ORDER BY fecha ASC`,
      params
    );

    const [totalEstudiantes] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');

    const porcentajeParticipacion = totalEstudiantes[0].total > 0
      ? Math.round((totalAsistencias[0].total / totalEstudiantes[0].total) * 10000) / 100
      : 0;

    res.json({
      totalAsistencias: totalAsistencias[0].total,
      totalEstudiantes: totalEstudiantes[0].total,
      porcentajeParticipacion,
      porGrado: asistenciasPorGrado,
      porSeccion: asistenciasPorSeccion,
      porFormulario: asistenciasPorFormulario,
      porFecha: asistenciasPorFecha
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { registrar, listar, verificarDispositivo, obtenerEstadisticas };
