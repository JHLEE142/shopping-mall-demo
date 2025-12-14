const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getPoints,
  getPointHistory,
  earnPoints,
  usePoints,
} = require('../controllers/pointController');

const router = Router();

router.get('/', authenticate, getPoints);
router.get('/history', authenticate, getPointHistory);
router.post('/earn', authenticate, earnPoints);
router.post('/use', authenticate, usePoints);

module.exports = router;

