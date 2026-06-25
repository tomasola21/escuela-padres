const pool = require('../config/database');

const listar = async (req, res) => {
  try {
    const [eventos] = await pool.query('SELECT * FROM eventos ORDER BY created_at DESC');
    res.json(eventos);
  } catch (error) {
    console.error('Error al listar eventos:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const [eventos] = await pool.query('SELECT * FROM eventos WHERE id = ?', [id]);
    if (eventos.length === 0) return res.status(404).json({ mensaje: 'Evento no encontrado.' });
    res.json(eventos[0]);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, logo } = req.body;
    const [resultado] = await pool.query('INSERT INTO eventos (nombre, logo) VALUES (?, ?)', [nombre, logo || null]);
    const [nuevo] = await pool.query('SELECT * FROM eventos WHERE id = ?', [resultado.insertId]);
    res.status(201).json(nuevo[0]);
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, logo } = req.body;
    const [existente] = await pool.query('SELECT * FROM eventos WHERE id = ?', [id]);
    if (existente.length === 0) return res.status(404).json({ mensaje: 'Evento no encontrado.' });
    await pool.query('UPDATE eventos SET nombre = ?, logo = ? WHERE id = ?', [nombre, logo !== undefined ? logo : existente[0].logo, id]);
    const [actualizado] = await pool.query('SELECT * FROM eventos WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM eventos WHERE id = ?', [id]);
    res.json({ mensaje: 'Evento eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
