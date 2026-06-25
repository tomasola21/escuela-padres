const router = require('express').Router();
const multer = require('multer');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/estudianteController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', authorize('administrador'), [
  body('codigo').notEmpty().withMessage('El código es requerido'),
  body('nombre_completo').notEmpty().withMessage('El nombre completo es requerido'),
  body('grado_id').isInt().withMessage('El grado es requerido'),
  body('seccion_id').isInt().withMessage('La sección es requerida'),
  validate
], controller.crear);
router.put('/:id', authorize('administrador'), [
  body('codigo').notEmpty().withMessage('El código es requerido'),
  body('nombre_completo').notEmpty().withMessage('El nombre completo es requerido'),
  body('grado_id').isInt().withMessage('El grado es requerido'),
  body('seccion_id').isInt().withMessage('La sección es requerida'),
  validate
], controller.actualizar);
router.delete('/:id', authorize('administrador'), controller.eliminar);
router.post('/importar-excel', authorize('administrador'), upload.single('archivo'), controller.importarExcel);

module.exports = router;
