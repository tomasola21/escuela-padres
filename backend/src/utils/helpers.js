const crypto = require('crypto');

const generarCodigoQR = () => {
  return crypto.randomBytes(16).toString('hex');
};

const detectarNavegador = (userAgent) => {
  if (!userAgent) return 'Desconocido';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Otro';
};

module.exports = { generarCodigoQR, detectarNavegador };
