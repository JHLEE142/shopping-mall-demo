const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  createExchangeReturn,
  getExchangeReturns,
  getExchangeReturnById,
  updateExchangeReturnStatus,
  cancelExchangeReturn,
} = require('../controllers/exchangeReturnController');

const router = Router();

router.post('/', authenticate, createExchangeReturn);
router.get('/', authenticate, getExchangeReturns);
router.get('/:id', authenticate, getExchangeReturnById);
router.put('/:id/status', authenticate, updateExchangeReturnStatus);
router.delete('/:id', authenticate, cancelExchangeReturn);

module.exports = router;

