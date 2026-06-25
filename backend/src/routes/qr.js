const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/qrController');

router.get('/verificar/:codigo', controller.verificarQR);
router.get('/imagen/:codigo', controller.generarQRImage);
router.get('/presets', controller.obtenerPresets);

router.use(authenticate);

router.get('/', controller.listar);
router.get('/formulario/:formulario_id', controller.obtenerPorFormulario);
router.post('/:formulario_id/regenerar', authorize('administrador'), controller.regenerar);
router.patch('/:id/toggle-activo', authorize('administrador'), controller.toggleActivo);
router.put('/:id/config', authorize('administrador'), controller.actualizarConfig);

module.exports = router;
