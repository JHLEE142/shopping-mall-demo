const Product = require('../models/product');

/**
 * MongoDB Atlas Search를 사용한 상품 검색
 * @param {string} query - 검색 쿼리
 * @param {number} limit - 반환할 결과 수
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Array>} - 검색 결과 배열
 */
async function atlasSearch(query, limit = 20, options = {}) {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length === 0) {
      return [];
    }

    // Atlas Search Index 이름 (Atlas 콘솔에서 생성한 인덱스 이름)
    const indexName = process.env.ATLAS_SEARCH_INDEX_NAME || 'product-search-index';
    
    // 기본 검색 설정
    const searchStage = {
      $search: {
        index: indexName,
        text: {
          query: trimmedQuery,
          path: {
            wildcard: '*' // 모든 필드에서 검색
          },
          fuzzy: {
            maxEdits: 2, // 오타 허용 (최대 2글자 차이)
            prefixLength: 2, // 최소 2글자부터 오타 허용
            maxExpansions: 50
          }
        }
      }
    };

    // 가중치가 있는 검색 (상품명에 더 높은 가중치)
    const weightedSearchStage = {
      $search: {
        index: indexName,
        compound: {
          should: [
            {
              text: {
                query: trimmedQuery,
                path: 'name',
                score: { boost: { value: 3 } } // 상품명에 3배 가중치
              }
            },
            {
              text: {
                query: trimmedQuery,
                path: 'description',
                score: { boost: { value: 1 } } // 설명에 1배 가중치
              }
            },
            {
              text: {
                query: trimmedQuery,
                path: 'category',
                score: { boost: { value: 2 } } // 카테고리에 2배 가중치
              }
            }
          ],
          minimumShouldMatch: 1 // 최소 1개 조건 만족
        }
      }
    };

    // 필터 옵션이 있으면 추가
    const matchStage = {};
    if (options.category) {
      matchStage.category = options.category;
    }
    if (options.minPrice !== undefined) {
      matchStage.price = { ...matchStage.price, $gte: options.minPrice };
    }
    if (options.maxPrice !== undefined) {
      matchStage.price = { ...matchStage.price, $lte: options.maxPrice };
    }

    // Aggregation pipeline 구성
    const pipeline = [
      // Atlas Search 단계
      weightedSearchStage,
      // 점수 필드 추가
      {
        $addFields: {
          searchScore: { $meta: 'searchScore' }
        }
      },
      // 필터 적용 (있는 경우)
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      // 결과 제한
      { $limit: limit },
      // 필요한 필드만 선택
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          priceSale: 1,
          originalPrice: 1,
          discountRate: 1,
          image: 1,
          gallery: 1,
          description: 1,
          category: 1,
          categoryMain: 1,
          categoryMid: 1,
          categorySub: 1,
          searchScore: 1
        }
      }
    ];

    console.log('[Atlas Search] 검색 실행:', { query: trimmedQuery, limit, indexName });
    
    // Aggregation 실행
    const results = await Product.aggregate(pipeline);
    
    console.log('[Atlas Search] 검색 결과:', results.length, '개');

    // 결과 포맷팅
    return results.map((product, index) => ({
      product: {
        _id: product._id,
        name: product.name,
        price: product.priceSale || product.price,
        originalPrice: product.originalPrice,
        discountRate: product.discountRate,
        image: product.image || product.gallery?.[0] || '',
        gallery: product.gallery || [],
        description: product.description || '',
        category: product.category,
        categoryMain: product.categoryMain,
        categoryMid: product.categoryMid,
        categorySub: product.categorySub,
      },
      score: product.searchScore || (1.0 - index * 0.01), // 검색 점수 또는 순위 기반 점수
      type: 'atlas-search',
    }));
  } catch (error) {
    // Atlas Search가 설정되지 않았거나 오류가 발생한 경우
    if (error.message && error.message.includes('index')) {
      console.warn('[Atlas Search] 인덱스가 설정되지 않았습니다. Atlas 콘솔에서 Search Index를 생성해주세요.');
      console.warn('[Atlas Search] 인덱스 이름:', process.env.ATLAS_SEARCH_INDEX_NAME || 'product-search-index');
      return [];
    }
    console.error('[Atlas Search] 검색 오류:', error.message);
    return [];
  }
}

/**
 * Atlas Search를 사용한 다중 필드 검색 (오타 허용, 부분 일치)
 * @param {string} query - 검색 쿼리
 * @param {number} limit - 반환할 결과 수
 * @returns {Promise<Array>} - 검색 결과 배열
 */
async function atlasMultiFieldSearch(query, limit = 20) {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length === 0) {
      return [];
    }

    const indexName = process.env.ATLAS_SEARCH_INDEX_NAME || 'product-search-index';

    // 다중 필드 검색 (autocomplete 스타일)
    const searchStage = {
      $search: {
        index: indexName,
        compound: {
          should: [
            {
              autocomplete: {
                query: trimmedQuery,
                path: 'name',
                score: { boost: { value: 5 } } // 상품명 자동완성에 높은 가중치
              }
            },
            {
              text: {
                query: trimmedQuery,
                path: 'name',
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 2
                },
                score: { boost: { value: 3 } }
              }
            },
            {
              text: {
                query: trimmedQuery,
                path: 'description',
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 2
                },
                score: { boost: { value: 1 } }
              }
            }
          ],
          minimumShouldMatch: 1
        }
      }
    };

    const pipeline = [
      searchStage,
      {
        $addFields: {
          searchScore: { $meta: 'searchScore' }
        }
      },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          priceSale: 1,
          originalPrice: 1,
          discountRate: 1,
          image: 1,
          gallery: 1,
          description: 1,
          category: 1,
          categoryMain: 1,
          categoryMid: 1,
          categorySub: 1,
          searchScore: 1
        }
      }
    ];

    console.log('[Atlas Search] 다중 필드 검색:', { query: trimmedQuery, limit });
    
    const results = await Product.aggregate(pipeline);
    
    console.log('[Atlas Search] 다중 필드 검색 결과:', results.length, '개');

    return results.map((product, index) => ({
      product: {
        _id: product._id,
        name: product.name,
        price: product.priceSale || product.price,
        originalPrice: product.originalPrice,
        discountRate: product.discountRate,
        image: product.image || product.gallery?.[0] || '',
        gallery: product.gallery || [],
        description: product.description || '',
        category: product.category,
        categoryMain: product.categoryMain,
        categoryMid: product.categoryMid,
        categorySub: product.categorySub,
      },
      score: product.searchScore || (1.0 - index * 0.01),
      type: 'atlas-multi-field',
    }));
  } catch (error) {
    if (error.message && error.message.includes('index')) {
      console.warn('[Atlas Search] 인덱스가 설정되지 않았습니다.');
      return [];
    }
    console.error('[Atlas Search] 다중 필드 검색 오류:', error.message);
    return [];
  }
}

module.exports = {
  atlasSearch,
  atlasMultiFieldSearch,
};

