const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/reporteController');

router.get('/dashboard', controller.dashboard);

router.use(authenticate);
router.get('/', authorize('administrador', 'supervisor'), controller.generarReporte);

module.exports = router;
