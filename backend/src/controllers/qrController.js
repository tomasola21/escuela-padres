const pool = require('../config/database');
const QRCode = require('qrcode');
const crypto = require('crypto');
require('dotenv').config();

const listar = async (req, res) => {
  try {
    const [qrs] = await pool.query(
      `SELECT q.*, f.nombre as formulario_nombre 
       FROM qrs q 
       JOIN formularios f ON q.formulario_id = f.id 
       ORDER BY q.created_at DESC`
    );
    res.json(qrs);
  } catch (error) {
    console.error('Error al listar QRs:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const obtenerPorFormulario = async (req, res) => {
  try {
    const { formulario_id } = req.params;
    const [qrs] = await pool.query(
      `SELECT q.*, f.nombre as formulario_nombre 
       FROM qrs q 
       JOIN formularios f ON q.formulario_id = f.id 
       WHERE q.formulario_id = ?`,
      [formulario_id]
    );
    if (qrs.length === 0) {
      return res.status(404).json({ mensaje: 'QR no encontrado para este formulario.' });
    }
    res.json(qrs[0]);
  } catch (error) {
    console.error('Error al obtener QR:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const regenerar = async (req, res) => {
  try {
    const { formulario_id } = req.params;
    const nuevoCodigo = crypto.randomBytes(16).toString('hex');

    await pool.query('UPDATE qrs SET codigo = ? WHERE formulario_id = ?', [nuevoCodigo, formulario_id]);

    const [qr] = await pool.query('SELECT * FROM qrs WHERE formulario_id = ?', [formulario_id]);
    res.json(qr[0]);
  } catch (error) {
    console.error('Error al regenerar QR:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const [qrs] = await pool.query('SELECT * FROM qrs WHERE id = ?', [id]);
    if (qrs.length === 0) {
      return res.status(404).json({ mensaje: 'QR no encontrado.' });
    }

    const nuevoEstado = qrs[0].activo ? 0 : 1;
    await pool.query('UPDATE qrs SET activo = ? WHERE id = ?', [nuevoEstado, id]);

    const [actualizado] = await pool.query('SELECT * FROM qrs WHERE id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error('Error al cambiar estado QR:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const generarQRImage = async (req, res) => {
  try {
    const { codigo } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const url = `${frontendUrl}/a/${codigo}`;

    const qrBuffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a365d',
        light: '#ffffff'
      }
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (error) {
    console.error('Error al generar imagen QR:', error);
    res.status(500).json({ mensaje: 'Error al generar QR.' });
  }
};

const verificarQR = async (req, res) => {
  try {
    const { codigo } = req.params;

    const [qrs] = await pool.query(
      `SELECT q.*, f.nombre as formulario_nombre, f.descripcion, f.evento, f.fecha_inicio, f.fecha_cierre, f.estado as formulario_estado
       FROM qrs q 
       JOIN formularios f ON q.formulario_id = f.id 
       WHERE q.codigo = ?`,
      [codigo]
    );

    if (qrs.length === 0) {
      return res.status(404).json({ mensaje: 'QR no encontrado.' });
    }

    const qr = qrs[0];

    if (!qr.activo) {
      return res.status(400).json({ mensaje: 'Este formulario no se encuentra disponible.', disponible: false });
    }

    if (qr.formulario_estado === 'inactivo') {
      return res.status(400).json({ mensaje: 'Este formulario no se encuentra disponible.', disponible: false });
    }

    const hoy = new Date();
    const inicio = new Date(qr.fecha_inicio);
    const cierre = new Date(qr.fecha_cierre);
    cierre.setHours(23, 59, 59, 999);

    if (hoy < inicio || hoy > cierre) {
      return res.status(400).json({ mensaje: 'Este formulario no se encuentra disponible.', disponible: false });
    }

    res.json({
      disponible: true,
      formulario: {
        id: qr.formulario_id,
        nombre: qr.formulario_nombre,
        descripcion: qr.descripcion,
        evento: qr.evento
      }
    });
  } catch (error) {
    console.error('Error al verificar QR:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { listar, obtenerPorFormulario, regenerar, toggleActivo, generarQRImage, verificarQR };
