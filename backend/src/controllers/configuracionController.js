const pool = require('../config/database');

const obtener = async (req, res) => {
  try {
    const [configuraciones] = await pool.query('SELECT * FROM configuracion');
    const config = {};
    configuraciones.forEach(item => {
      config[item.clave] = item.valor;
    });
    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { clave, valor } = req.body;
    await pool.query(
      'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      [clave, valor, valor]
    );
    res.json({ mensaje: 'Configuración actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { obtener, actualizar };
