const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  autoLogin,
  getTrustedDevices,
  revokeDevice,
  revokeAllDevices,
} = require('../controllers/trustedDeviceController');

const router = Router();

router.post('/auto-login', autoLogin);
router.get('/', authenticate, getTrustedDevices);
router.delete('/:deviceId', authenticate, revokeDevice);
router.delete('/', authenticate, revokeAllDevices);

module.exports = router;

