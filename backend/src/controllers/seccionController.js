const pool = require('../config/database');

const seccionesPorDefecto = ['A', 'B', 'C'];

const sembrarSecciones = async () => {
  try {
    const [existentes] = await pool.query('SELECT COUNT(*) as total FROM secciones');
    if (existentes[0].total === 0) {
      for (const nombre of seccionesPorDefecto) {
        await pool.query('INSERT INTO secciones (nombre) VALUES (?)', [nombre]);
      }
      console.log('Secciones por defecto insertadas:', seccionesPorDefecto.length);
    }
  } catch (error) {
    console.error('Error al sembrar secciones:', error);
  }
};

const listar = async (req, res) => {
  try {
    await sembrarSecciones();
    const { grado_id } = req.query;
    let query = 'SELECT * FROM secciones';
    const params = [];
    if (grado_id) {
      query = 'SELECT * FROM secciones';
    }
    query += ' ORDER BY nombre ASC';
    const [secciones] = await pool.query(query, params);
    res.json(secciones);
  } catch (error) {
    console.error('Error al listar secciones:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre } = req.body;
    const [resultado] = await pool.query('INSERT INTO secciones (nombre) VALUES (?)', [nombre]);
    const [nuevo] = await pool.query('SELECT * FROM secciones WHERE id = ?', [resultado.insertId]);
    res.status(201).json(nuevo[0]);
  } catch (error) {
    console.error('Error al crear sección:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const [existente] = await pool.query('SELECT * FROM secciones WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Sección no encontrada.' });
    }
    await pool.query('UPDATE secciones SET nombre = ? WHERE id = ?', [nombre, id]);
    const [actualizado] = await pool.query('SELECT * FROM secciones WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al actualizar sección:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [existente] = await pool.query('SELECT * FROM secciones WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Sección no encontrada.' });
    }
    await pool.query('DELETE FROM secciones WHERE id = ?', [id]);
    res.json({ mensaje: 'Sección eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar sección:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { listar, crear, actualizar, eliminar };
