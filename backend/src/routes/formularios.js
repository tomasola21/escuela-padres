const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/formularioController');

router.use(authenticate);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);

router.post('/', authorize('administrador'), [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('fecha_inicio').notEmpty().withMessage('La fecha de inicio es requerida'),
  body('fecha_cierre').notEmpty().withMessage('La fecha de cierre es requerida'),
  validate
], controller.crear);

router.put('/:id', authorize('administrador'), [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('fecha_inicio').notEmpty().withMessage('La fecha de inicio es requerida'),
  body('fecha_cierre').notEmpty().withMessage('La fecha de cierre es requerida'),
  validate
], controller.actualizar);

router.delete('/:id', authorize('administrador'), controller.eliminar);
router.patch('/:id/toggle-estado', authorize('administrador'), controller.toggleEstado);

module.exports = router;
