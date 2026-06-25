const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/formularios', require('../src/routes/formularios'));
app.use('/api/qr', require('../src/routes/qr'));
app.use('/api/grados', require('../src/routes/grados'));
app.use('/api/secciones', require('../src/routes/secciones'));
app.use('/api/estudiantes', require('../src/routes/estudiantes'));
app.use('/api/asistencias', require('../src/routes/asistencias'));
app.use('/api/configuracion', require('../src/routes/configuracion'));
app.use('/api/reportes', require('../src/routes/reportes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

module.exports = app;
