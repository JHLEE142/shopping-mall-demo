const Product = require('../models/product');
const Category = require('../models/category');
const { convertToPhoneme, convertEnglishToPhoneme, isKorean, calculateStringSimilarity } = require('../utils/phonemeConverter');
const { getEmbedding, cosineSimilarity } = require('../utils/embeddingService');
const { get: cacheGet, set: cacheSet, getSearchCacheKey, getEmbeddingCacheKey, getPhonemeCacheKey } = require('../utils/cacheService');
const { atlasSearch, atlasMultiFieldSearch } = require('../utils/atlasSearch');

/**
 * 카테고리 검색 (최우선)
 */
async function categorySearch(query, limit = 20) {
  try {
    const trimmedQuery = query.trim();
    
    // 1. 정확한 카테고리 이름 매칭 시도
    let category = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedQuery}$`, 'i') },
      isActive: true
    }).lean();
    
    // 2. 정확한 매칭이 없으면 부분 매칭 시도
    if (!category) {
      category = await Category.findOne({
        name: { $regex: new RegExp(trimmedQuery, 'i') },
        isActive: true
      }).lean();
    }
    
    if (!category) {
      return [];
    }
    
    console.log('카테고리 검색 매칭:', { query: trimmedQuery, categoryName: category.name });
    
    // 해당 카테고리의 모든 상품 조회 (limit 제한 없이 모든 상품 반환)
    const products = await Product.find({
      category: category.name
    })
    .sort({ createdAt: -1 })
    .lean();
    
    console.log('카테고리 검색 결과:', { 
      categoryName: category.name, 
      count: products.length,
      productNames: products.map(p => p.name).slice(0, 5)
    });
    
    return products.map(product => ({
      product,
      score: 1.0, // 카테고리 매칭은 최고 점수
      type: 'category',
    }));
  } catch (error) {
    console.error('Category search error:', error);
    return [];
  }
}

/**
 * 정확한 텍스트 매칭 검색
 */
async function exactTextSearch(query, limit = 20) {
  try {
    const trimmedQuery = query.trim();
    const searchRegex = new RegExp(trimmedQuery, 'i');
    
    console.log('정확한 텍스트 검색:', { query: trimmedQuery, regex: searchRegex });
    
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
      ]
    }).lean();
    
    console.log('정확한 텍스트 검색 결과:', { 
      query: trimmedQuery, 
      count: products.length,
      productNames: products.map(p => p.name).slice(0, 5)
    });
    
    return products.map(product => ({
      product,
      score: 1.0, // 정확한 매칭은 최고 점수
      type: 'exact',
    }));
  } catch (error) {
    console.error('Exact text search error:', error);
    return [];
  }
}

/**
 * Hybrid 검색: Atlas Search (최우선) + Exact Text + Phoneme + Embedding
 * @param {string} searchQuery - 검색 쿼리
 * @param {number} limit - 반환할 결과 수
 * @param {number} phonemeWeight - Phoneme 검색 가중치 (0-1)
 * @param {number} embeddingWeight - Embedding 검색 가중치 (0-1)
 * @returns {Promise<Array>} - 검색 결과 배열
 */
async function hybridSearch(searchQuery, limit = 20, phonemeWeight = 0.3, embeddingWeight = 0.3) {
  if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
    return [];
  }

  const query = searchQuery.trim();
  
  // 0. MongoDB Atlas Search (최우선, 가장 빠르고 정확)
  let atlasResults = [];
  try {
    atlasResults = await atlasMultiFieldSearch(query, limit);
    console.log('Atlas Search 결과:', { query, count: atlasResults.length });
    
    // Atlas Search 결과가 충분하면 그것만 반환
    if (atlasResults.length >= limit) {
      return atlasResults.slice(0, limit).map(r => ({ ...r, finalScore: r.score }));
    }
  } catch (atlasError) {
    console.warn('Atlas Search 실패, 기존 검색 방법 사용:', atlasError.message);
  }
  
  // 1. 카테고리 검색
  const categoryResults = await categorySearch(query, limit);
  
  // 카테고리 매칭이 있으면 Atlas 결과와 합치기
  if (categoryResults.length > 0) {
    console.log('카테고리 검색 결과:', { query, count: categoryResults.length });
    // Atlas 결과와 카테고리 결과 합치기
    const combined = [...atlasResults, ...categoryResults];
    const uniqueMap = new Map();
    combined.forEach(r => {
      const id = r.product._id.toString();
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, r);
      } else {
        const existing = uniqueMap.get(id);
        if (r.score > existing.score) {
          uniqueMap.set(id, r);
        }
      }
    });
    return Array.from(uniqueMap.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit)
      .map(r => ({ ...r, finalScore: r.score }));
  }
  
  // 2. 정확한 텍스트 매칭 검색
  const exactResults = await exactTextSearch(query, limit);
  
  // 정확한 매칭이 충분하면 Atlas 결과와 합치기
  if (exactResults.length >= limit) {
    const combined = [...atlasResults, ...exactResults];
    const uniqueMap = new Map();
    combined.forEach(r => {
      const id = r.product._id.toString();
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, r);
      } else {
        const existing = uniqueMap.get(id);
        if (r.score > existing.score) {
          uniqueMap.set(id, r);
        }
      }
    });
    return Array.from(uniqueMap.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit)
      .map(r => ({ ...r, finalScore: r.score }));
  }
  
  // 3. Phoneme 기반 검색
  const phonemeResults = await phonemeSearch(query, limit * 2);
  
  // 4. Embedding 기반 검색
  const embeddingResults = await embeddingSearch(query, limit * 2);
  
  // 5. 결과 통합 및 가중치 적용 (Atlas 결과 포함)
  const combinedResults = combineResults(
    [...atlasResults, ...exactResults], 
    phonemeResults, 
    embeddingResults, 
    phonemeWeight, 
    embeddingWeight
  );
  
  // 6. 상위 N개 반환
  return combinedResults.slice(0, limit);
}

/**
 * Phoneme 기반 검색
 */
async function phonemeSearch(query, limit = 20) {
  try {
    // 검색 쿼리를 phoneme으로 변환
    const queryPhonemeKey = getPhonemeCacheKey(query);
    let queryPhoneme = cacheGet(queryPhonemeKey);
    
    if (!queryPhoneme) {
      if (isKorean(query)) {
        queryPhoneme = convertToPhoneme(query);
      } else {
        queryPhoneme = convertEnglishToPhoneme(query);
      }
      cacheSet(queryPhonemeKey, queryPhoneme, 3600);
    }
    
    // 모든 상품 조회 (phoneme_name이 있는 것만)
    const products = await Product.find({
      phoneme_name: { $exists: true, $ne: '' }
    }).lean();
    
    // 유사도 계산 (임계값 제거 - 모든 결과 포함)
    const results = products
      .map(product => {
        const similarity = calculateStringSimilarity(queryPhoneme, product.phoneme_name);
        return {
          product,
          score: similarity,
          type: 'phoneme',
        };
      })
      .filter(result => result.score > 0); // 0보다 큰 것만 포함
    
    // 유사도 순으로 정렬
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('Phoneme search error:', error);
    return [];
  }
}

/**
 * Embedding 기반 검색
 */
async function embeddingSearch(query, limit = 20) {
  try {
    // Embedding 기능이 사용 가능한지 확인
    try {
      // 검색 쿼리의 embedding 생성
      const queryEmbeddingKey = getEmbeddingCacheKey(query);
      let queryEmbedding = cacheGet(queryEmbeddingKey);
      
      if (!queryEmbedding) {
        queryEmbedding = await getEmbedding(query);
        cacheSet(queryEmbeddingKey, queryEmbedding, 3600);
      }
      
      // 모든 상품 조회 (embedding이 있는 것만)
      const products = await Product.find({
        embedding: { $exists: true, $ne: null }
      }).lean();
      
      // Cosine similarity 계산 (임계값 제거 - 모든 결과 포함)
      const results = products
        .map(product => {
          if (!product.embedding || product.embedding.length === 0) {
            return null;
          }
          
          const similarity = cosineSimilarity(queryEmbedding, product.embedding);
          const normalizedScore = (similarity + 1) / 2; // -1~1을 0~1로 변환
          return {
            product,
            score: normalizedScore,
            type: 'embedding',
          };
        })
        .filter(result => result !== null && result.score > 0); // 0보다 큰 것만 포함
      
      // 유사도 순으로 정렬
      results.sort((a, b) => b.score - a.score);
      
      return results.slice(0, limit);
    } catch (embeddingError) {
      // Embedding 기능이 사용 불가능하면 빈 배열 반환
      console.warn('Embedding search is not available:', embeddingError.message);
      return [];
    }
  } catch (error) {
    console.error('Embedding search error:', error);
    return [];
  }
}

/**
 * 검색 결과 통합 (Exact + Phoneme + Embedding)
 */
function combineResults(exactResults, phonemeResults, embeddingResults, phonemeWeight, embeddingWeight) {
  const productMap = new Map();
  
  // Exact 결과 추가 (최우선, 점수 1.0)
  exactResults.forEach(result => {
    const productId = result.product._id.toString();
    productMap.set(productId, {
      product: result.product,
      exactScore: result.score, // 1.0
      phonemeScore: 0,
      embeddingScore: 0,
    });
  });
  
  // Phoneme 결과 추가
  phonemeResults.forEach(result => {
    const productId = result.product._id.toString();
    if (!productMap.has(productId)) {
      productMap.set(productId, {
        product: result.product,
        exactScore: 0,
        phonemeScore: 0,
        embeddingScore: 0,
      });
    }
    // Exact 매칭이 없을 때만 phoneme 점수 적용
    if (productMap.get(productId).exactScore === 0) {
      productMap.get(productId).phonemeScore = result.score;
    }
  });
  
  // Embedding 결과 추가
  embeddingResults.forEach(result => {
    const productId = result.product._id.toString();
    if (!productMap.has(productId)) {
      productMap.set(productId, {
        product: result.product,
        exactScore: 0,
        phonemeScore: 0,
        embeddingScore: 0,
      });
    }
    // Exact 매칭이 없을 때만 embedding 점수 적용
    if (productMap.get(productId).exactScore === 0) {
      productMap.get(productId).embeddingScore = result.score;
    }
  });
  
  // 가중치 적용하여 최종 점수 계산
  // Exact 매칭은 최우선 (1.0), 없으면 phoneme + embedding 조합
  const combinedResults = Array.from(productMap.values())
    .map(item => {
      let finalScore;
      if (item.exactScore > 0) {
        // Exact 매칭이 있으면 최고 점수
        finalScore = 1.0;
      } else {
        // Exact 매칭이 없으면 phoneme + embedding 조합
        finalScore = (item.phonemeScore * phonemeWeight) + (item.embeddingScore * embeddingWeight);
      }
      return {
        product: item.product,
        finalScore,
        exactScore: item.exactScore,
        phonemeScore: item.phonemeScore,
        embeddingScore: item.embeddingScore,
      };
    })
    .filter(item => item.finalScore > 0); // 0보다 큰 것만 포함
  
  // 최종 점수 순으로 정렬
  combinedResults.sort((a, b) => b.finalScore - a.finalScore);
  
  return combinedResults;
}

/**
 * 검색 API 핸들러
 */
async function searchProducts(req, res, next) {
  try {
    const { q: query, limit = 20, phonemeWeight = 0.4, embeddingWeight = 0.6 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        message: 'Search query is required',
      });
    }
    
    const trimmedQuery = query.trim();
    console.log('검색 요청:', { query: trimmedQuery, limit, phonemeWeight, embeddingWeight });
    
    // 캐시 확인 (개발 중에는 캐시 비활성화 가능)
    const useCache = req.query.cache !== 'false'; // cache=false 파라미터로 캐시 비활성화 가능
    const cacheKey = getSearchCacheKey(trimmedQuery);
    const cachedResult = useCache ? cacheGet(cacheKey) : null;
    if (cachedResult) {
      console.log('캐시에서 검색 결과 반환:', { query: trimmedQuery, count: cachedResult.length });
      return res.json({
        query: trimmedQuery,
        results: cachedResult.slice(0, parseInt(limit)),
        total: cachedResult.length,
        cached: true,
      });
    }
    
    // Hybrid 검색 수행
    console.log('새로운 검색 수행:', trimmedQuery);
    const results = await hybridSearch(
      trimmedQuery,
      parseInt(limit),
      parseFloat(phonemeWeight),
      parseFloat(embeddingWeight)
    );
    
    console.log('검색 결과:', { 
      query: trimmedQuery, 
      resultCount: results.length,
      productNames: results.map(r => r.product?.name || r.product?._id).slice(0, 5)
    });
    
    // 결과를 상품 객체 배열로 변환
    const products = results.map(result => result.product);
    
    // 캐시에 저장
    cacheSet(cacheKey, products, 1800); // 30분
    
    res.json({
      query: trimmedQuery,
      results: products,
      total: products.length,
      cached: false,
    });
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
}

module.exports = {
  searchProducts,
  hybridSearch,
};

