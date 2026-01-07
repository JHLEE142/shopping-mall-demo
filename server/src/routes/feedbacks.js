const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  respondToFeedback,
} = require('../controllers/feedbackController');
const { authorize } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', authenticate, getFeedbacks);
router.get('/:id', authenticate, getFeedbackById);
router.post('/', authenticate, createFeedback);
router.put('/:id', authenticate, updateFeedback);
router.delete('/:id', authenticate, deleteFeedback);
router.post('/:id/respond', authenticate, authorize('admin'), respondToFeedback);

module.exports = router;

