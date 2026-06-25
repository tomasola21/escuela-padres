const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/configuracionController');

router.get('/', controller.obtener);

router.use(authenticate);
router.put('/', authorize('administrador'), controller.actualizar);

module.exports = router;
