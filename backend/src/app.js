const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/formularios', require('./routes/formularios'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/grados', require('./routes/grados'));
app.use('/api/secciones', require('./routes/secciones'));
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/asistencias', require('./routes/asistencias'));
app.use('/api/eventos', require('./routes/eventos'));
app.use('/api/configuracion', require('./routes/configuracion'));
app.use('/api/reportes', require('./routes/reportes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
