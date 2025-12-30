const { Router } = require('express');
const multer = require('multer');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  importExcel,
  commitImport,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = Router();

// Multer 설정 (메모리 스토리지 사용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // Excel 파일만 허용
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // 일부 시스템에서 Excel 파일을 이렇게 인식
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
});

router.route('/').get(getProducts).post(authenticate, createProduct);

// 엑셀 업로드 및 미리보기
router.post(
  '/import/excel',
  authenticate,
  authorize('admin'),
  (req, res, next) => {
    console.log('📥 [ROUTE] /import/excel - Before multer:', {
      hasFile: !!req.file,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    next();
  },
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('[Route] /import/excel - Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ message: err.message || 'File upload error' });
      }
      console.log('✅ [ROUTE] /import/excel - After multer:', {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        fileMimetype: req.file?.mimetype
      });
      if (!req.file) {
        console.log('❌ [ROUTE] /import/excel - No file received from multer');
        return res.status(400).json({ message: 'No file uploaded' });
      }
      next();
    });
  },
  importExcel
);

// 상품 등록 커밋
router.post(
  '/import/commit',
  authenticate,
  authorize('admin'),
  commitImport
);

router
  .route('/:id')
  .get(getProductById)
  .put(authenticate, updateProduct)
  .delete(authenticate, deleteProduct);

module.exports = router;
