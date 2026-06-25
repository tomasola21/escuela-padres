const pool = require('../config/database');

const listar = async (req, res) => {
  try {
    const [secciones] = await pool.query('SELECT * FROM secciones ORDER BY nombre ASC');
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
