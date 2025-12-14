const { Router } = require('express');
const {
  getInquiriesByProduct,
  createInquiry,
  answerInquiry,
  updateInquiry,
  deleteInquiry,
} = require('../controllers/productInquiryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = Router();

// 상품별 문의 목록 조회
router.get('/product/:productId', getInquiriesByProduct);

// 문의 작성 (인증 필요)
router.post('/product/:productId', authenticate, createInquiry);

// 문의 답변 작성 (관리자만)
router.post('/:inquiryId/answer', authenticate, authorize('admin'), answerInquiry);

// 문의 수정 (인증 필요)
router.put('/:inquiryId', authenticate, updateInquiry);

// 문의 삭제 (인증 필요)
router.delete('/:inquiryId', authenticate, deleteInquiry);

module.exports = router;

