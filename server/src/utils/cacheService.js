const NodeCache = require('node-cache');

// 캐시 인스턴스 생성 (TTL: 1시간, 체크 주기: 10분)
const cache = new NodeCache({
  stdTTL: 3600, // 1시간
  checkperiod: 600, // 10분마다 만료된 항목 체크
  useClones: false, // 성능 최적화
});

/**
 * 캐시에서 값 가져오기
 * @param {string} key - 캐시 키
 * @returns {any|null} - 캐시된 값 또는 null
 */
function get(key) {
  return cache.get(key) || null;
}

/**
 * 캐시에 값 저장
 * @param {string} key - 캐시 키
 * @param {any} value - 저장할 값
 * @param {number} ttl - TTL (초), 기본값: 1시간
 */
function set(key, value, ttl = 3600) {
  cache.set(key, value, ttl);
}

/**
 * 캐시에서 값 삭제
 * @param {string} key - 캐시 키
 */
function del(key) {
  cache.del(key);
}

/**
 * 캐시 키 생성 (검색 쿼리용)
 * @param {string} query - 검색 쿼리
 * @returns {string} - 캐시 키
 */
function getSearchCacheKey(query) {
  return `search:${query.toLowerCase().trim()}`;
}

/**
 * 캐시 키 생성 (embedding용)
 * @param {string} text - 텍스트
 * @returns {string} - 캐시 키
 */
function getEmbeddingCacheKey(text) {
  return `embedding:${text.toLowerCase().trim()}`;
}

/**
 * 캐시 키 생성 (phoneme용)
 * @param {string} text - 텍스트
 * @returns {string} - 캐시 키
 */
function getPhonemeCacheKey(text) {
  return `phoneme:${text.toLowerCase().trim()}`;
}

/**
 * 캐시 통계
 */
function getStats() {
  return cache.getStats();
}

/**
 * 캐시 전체 삭제
 */
function flush() {
  cache.flushAll();
}

module.exports = {
  get,
  set,
  del,
  getSearchCacheKey,
  getEmbeddingCacheKey,
  getPhonemeCacheKey,
  getStats,
  flush,
};

