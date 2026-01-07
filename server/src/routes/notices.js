const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { authorize } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', getNotices);
router.get('/:id', getNoticeById);
router.post('/', authenticate, authorize('admin'), createNotice);
router.put('/:id', authenticate, authorize('admin'), updateNotice);
router.delete('/:id', authenticate, authorize('admin'), deleteNotice);

module.exports = router;

