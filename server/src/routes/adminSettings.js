const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getOrderPause, updateOrderPause } = require('../controllers/adminSettingsController');

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/order-pause', getOrderPause);
router.put('/order-pause', updateOrderPause);

module.exports = router;
