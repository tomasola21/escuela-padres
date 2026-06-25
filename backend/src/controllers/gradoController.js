const pool = require('../config/database');

const gradosPorDefecto = [
  '1° Primaria', '2° Primaria', '3° Primaria', '4° Primaria', '5° Primaria', '6° Primaria',
  '1° Secundaria', '2° Secundaria', '3° Secundaria', '4° Secundaria', '5° Secundaria'
];

const sembrarGrados = async () => {
  try {
    const [existentes] = await pool.query('SELECT COUNT(*) as total FROM grados');
    if (existentes[0].total === 0) {
      for (const nombre of gradosPorDefecto) {
        await pool.query('INSERT INTO grados (nombre) VALUES (?)', [nombre]);
      }
      console.log('Grados por defecto insertados:', gradosPorDefecto.length);
    }
  } catch (error) {
    console.error('Error al sembrar grados:', error);
  }
};

const listar = async (req, res) => {
  try {
    await sembrarGrados();
    const [grados] = await pool.query('SELECT * FROM grados ORDER BY nombre ASC');
    res.json(grados);
  } catch (error) {
    console.error('Error al listar grados:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre } = req.body;
    const [resultado] = await pool.query('INSERT INTO grados (nombre) VALUES (?)', [nombre]);
    const [nuevo] = await pool.query('SELECT * FROM grados WHERE id = ?', [resultado.insertId]);
    res.status(201).json(nuevo[0]);
  } catch (error) {
    console.error('Error al crear grado:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const [existente] = await pool.query('SELECT * FROM grados WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Grado no encontrado.' });
    }
    await pool.query('UPDATE grados SET nombre = ? WHERE id = ?', [nombre, id]);
    const [actualizado] = await pool.query('SELECT * FROM grados WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al actualizar grado:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [existente] = await pool.query('SELECT * FROM grados WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Grado no encontrado.' });
    }
    await pool.query('DELETE FROM grados WHERE id = ?', [id]);
    res.json({ mensaje: 'Grado eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar grado:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { listar, crear, actualizar, eliminar };
