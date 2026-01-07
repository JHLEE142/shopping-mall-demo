const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getInquiries,
  getAllInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  answerInquiry,
} = require('../controllers/inquiryController');
const { authorize } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', authenticate, getInquiries);
router.get('/admin/all', authenticate, authorize('admin'), getAllInquiries);
router.get('/:id', authenticate, getInquiryById);
router.post('/', authenticate, createInquiry);
router.put('/:id', authenticate, updateInquiry);
router.delete('/:id', authenticate, deleteInquiry);
router.post('/:id/answer', authenticate, authorize('admin'), answerInquiry);

module.exports = router;

