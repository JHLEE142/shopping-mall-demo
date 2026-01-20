const { Router } = require('express');
const {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
} = require('../controllers/passwordResetController');

const router = Router();

router.post('/request', requestPasswordReset);
router.post('/verify', verifyPasswordResetToken);
router.post('/reset', resetPassword);

module.exports = router;
