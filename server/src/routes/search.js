const { Router } = require('express');
const { searchProducts } = require('../controllers/searchController');

const router = Router();

/**
 * GET /api/search
 * 검색 API
 * 
 * Query Parameters:
 * - q: 검색 쿼리 (필수)
 * - limit: 반환할 결과 수 (기본값: 20)
 * - phonemeWeight: Phoneme 검색 가중치 (기본값: 0.4)
 * - embeddingWeight: Embedding 검색 가중치 (기본값: 0.6)
 * 
 * Example:
 * GET /api/search?q=크롬&limit=10
 */
router.get('/', searchProducts);

module.exports = router;

