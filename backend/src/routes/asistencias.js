const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/asistenciaController');

router.post('/', [
  body('formulario_id').isInt().withMessage('El formulario es requerido'),
  body('grado_id').isInt().withMessage('El grado es requerido'),
  body('seccion_id').isInt().withMessage('La sección es requerida'),
  body('estudiante_id').isInt().withMessage('El estudiante es requerido'),
  validate
], controller.registrar);

router.get('/verificar-dispositivo/:formulario_id/:device_id', controller.verificarDispositivo);

router.use(authenticate);

router.get('/', controller.listar);
router.get('/estadisticas', controller.obtenerEstadisticas);

module.exports = router;
