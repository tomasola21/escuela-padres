const pool = require('../config/database');

const listar = async (req, res) => {
  try {
    const [formularios] = await pool.query('SELECT * FROM formularios ORDER BY created_at DESC');
    res.json(formularios);
  } catch (error) {
    console.error('Error al listar formularios:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const [formularios] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (formularios.length === 0) {
      return res.status(404).json({ mensaje: 'Formulario no encontrado.' });
    }
    res.json(formularios[0]);
  } catch (error) {
    console.error('Error al obtener formulario:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, evento, fecha_inicio, fecha_cierre, estado } = req.body;
    const [resultado] = await pool.query(
      'INSERT INTO formularios (nombre, descripcion, evento, fecha_inicio, fecha_cierre, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, descripcion || null, evento || null, fecha_inicio, fecha_cierre, estado || 'activo']
    );

    const codigo = require('crypto').randomBytes(16).toString('hex');
    await pool.query('INSERT INTO qrs (formulario_id, codigo) VALUES (?, ?)', [resultado.insertId, codigo]);

    const [nuevo] = await pool.query('SELECT * FROM formularios WHERE id = ?', [resultado.insertId]);
    res.status(201).json(nuevo[0]);
  } catch (error) {
    console.error('Error al crear formulario:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, evento, fecha_inicio, fecha_cierre, estado } = req.body;

    const [existente] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Formulario no encontrado.' });
    }

    await pool.query(
      'UPDATE formularios SET nombre = ?, descripcion = ?, evento = ?, fecha_inicio = ?, fecha_cierre = ?, estado = ? WHERE id = ?',
      [nombre, descripcion || null, evento || null, fecha_inicio, fecha_cierre, estado, id]
    );

    const [actualizado] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al actualizar formulario:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [existente] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Formulario no encontrado.' });
    }
    await pool.query('DELETE FROM formularios WHERE id = ?', [id]);
    res.json({ mensaje: 'Formulario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar formulario:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const [formularios] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (formularios.length === 0) {
      return res.status(404).json({ mensaje: 'Formulario no encontrado.' });
    }

    const nuevoEstado = formularios[0].estado === 'activo' ? 'inactivo' : 'activo';
    await pool.query('UPDATE formularios SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    const [actualizado] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, toggleEstado };
