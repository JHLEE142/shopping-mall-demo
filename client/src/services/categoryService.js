const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

/**
 * 모든 카테고리 목록 조회
 * @param {Object} options - 옵션
 * @param {string} options.parentId - 부모 카테고리 ID (선택사항)
 * @param {boolean} options.includeProductCount - 상품 수 포함 여부
 * @returns {Promise<Array>} 카테고리 목록
 */
export async function fetchCategories(options = {}) {
  const { parentId = null, includeProductCount = false } = options;
  
  const params = new URLSearchParams();
  if (parentId) params.append('parentId', parentId);
  if (includeProductCount) params.append('includeProductCount', 'true');
  
  const url = `${API_BASE_URL}/api/categories${params.toString() ? `?${params.toString()}` : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `카테고리 조회 실패 (${response.status})` 
      }));
      const errorMessage = errorData.message || errorData.error || `카테고리 조회에 실패했습니다. (${response.status})`;
      console.error('카테고리 API 에러:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '카테고리 조회에 실패했습니다.');
    }
    
    return data.data?.categories || [];
  } catch (error) {
    console.error('카테고리 fetchCategories 에러:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * 카테고리 상세 조회 (ID 또는 code로 조회)
 * @param {string} id - 카테고리 ID 또는 code
 * @returns {Promise<Object>} 카테고리 정보
 */
export async function fetchCategory(id) {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카테고리 조회 실패' }));
    throw new Error(error.message || '카테고리를 찾을 수 없습니다.');
  }

  const data = await response.json();
  return data.data?.category || null;
}

/**
 * 카테고리별 상품 조회
 * @param {string} categoryId - 카테고리 ID 또는 code
 * @param {number} page - 페이지 번호
 * @param {number} limit - 페이지당 항목 수
 * @returns {Promise<Object>} 상품 목록 및 페이지네이션 정보
 */
export async function fetchProductsByCategory(categoryId, page = 1, limit = 12) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    category: categoryId,
  });

  const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '상품 조회 실패' }));
    throw new Error(error.message || '상품을 불러올 수 없습니다.');
  }

  const data = await response.json();
  return data.data || {};
}

