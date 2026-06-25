const pool = require('../config/database');

const selectBase = `SELECT f.*, e.nombre as evento_nombre, e.logo as evento_logo
  FROM formularios f LEFT JOIN eventos e ON f.evento_id = e.id`;

const listar = async (req, res) => {
  try {
    const [formularios] = await pool.query(selectBase + ' ORDER BY f.created_at DESC');
    const result = [];
    for (const f of formularios) {
      const [grados] = await pool.query(
        `SELECT g.id, g.nombre FROM formulario_grados fg JOIN grados g ON fg.grado_id = g.id WHERE fg.formulario_id = ?`,
        [f.id]
      );
      result.push({ ...f, grados });
    }
    res.json(result);
  } catch (error) {
    console.error('Error al listar talleres:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const [formularios] = await pool.query(selectBase + ' WHERE f.id = ?', [id]);
    if (formularios.length === 0) return res.status(404).json({ mensaje: 'Taller no encontrado.' });
    const [grados] = await pool.query(
      `SELECT g.id, g.nombre FROM formulario_grados fg JOIN grados g ON fg.grado_id = g.id WHERE fg.formulario_id = ?`,
      [id]
    );
    res.json({ ...formularios[0], grados });
  } catch (error) {
    console.error('Error al obtener taller:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, evento, estado, evento_id, grado_ids } = req.body;
    const [resultado] = await pool.query(
      'INSERT INTO formularios (nombre, descripcion, evento, estado, evento_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion || null, evento || null, estado || 'activo', evento_id || null]
    );

    if (grado_ids && grado_ids.length > 0) {
      const values = grado_ids.map(g => [resultado.insertId, g]);
      await pool.query('INSERT INTO formulario_grados (formulario_id, grado_id) VALUES ?', [values]);
    }

    const [nuevo] = await pool.query(selectBase + ' WHERE f.id = ?', [resultado.insertId]);
    const [grados] = await pool.query(
      `SELECT g.id, g.nombre FROM formulario_grados fg JOIN grados g ON fg.grado_id = g.id WHERE fg.formulario_id = ?`,
      [resultado.insertId]
    );
    res.status(201).json({ ...nuevo[0], grados });
  } catch (error) {
    console.error('Error al crear taller:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, evento, estado, evento_id, grado_ids } = req.body;

    const [existente] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (existente.length === 0) return res.status(404).json({ mensaje: 'Taller no encontrado.' });

    await pool.query(
      'UPDATE formularios SET nombre = ?, descripcion = ?, evento = ?, estado = ?, evento_id = ? WHERE id = ?',
      [nombre, descripcion || null, evento || null, estado || existente[0].estado, evento_id !== undefined ? evento_id : existente[0].evento_id, id]
    );

    if (grado_ids !== undefined) {
      await pool.query('DELETE FROM formulario_grados WHERE formulario_id = ?', [id]);
      if (grado_ids.length > 0) {
        const values = grado_ids.map(g => [id, g]);
        await pool.query('INSERT INTO formulario_grados (formulario_id, grado_id) VALUES ?', [values]);
      }
    }

    const [actualizado] = await pool.query(selectBase + ' WHERE f.id = ?', [id]);
    const [grados] = await pool.query(
      `SELECT g.id, g.nombre FROM formulario_grados fg JOIN grados g ON fg.grado_id = g.id WHERE fg.formulario_id = ?`,
      [id]
    );
    res.json({ ...actualizado[0], grados });
  } catch (error) {
    console.error('Error al actualizar taller:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [existente] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (existente.length === 0) return res.status(404).json({ mensaje: 'Taller no encontrado.' });
    await pool.query('DELETE FROM formularios WHERE id = ?', [id]);
    res.json({ mensaje: 'Taller eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar taller:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const [formularios] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    if (formularios.length === 0) return res.status(404).json({ mensaje: 'Taller no encontrado.' });
    const nuevoEstado = formularios[0].estado === 'activo' ? 'inactivo' : 'activo';
    await pool.query('UPDATE formularios SET estado = ? WHERE id = ?', [nuevoEstado, id]);
    const [actualizado] = await pool.query('SELECT * FROM formularios WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al cambiar estado del taller:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, toggleEstado };
