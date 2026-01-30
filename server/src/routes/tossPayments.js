const { Router } = require('express');
const { confirmPayment } = require('../controllers/tossPaymentController');

const router = Router();

// 결제 승인 API (인증 불필요 - 결제 위젯에서 직접 호출)
router.post('/confirm', confirmPayment);

module.exports = router;

