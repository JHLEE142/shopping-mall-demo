import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

  if (response.status === 404) {
    const error = new Error('카테고리를 찾을 수 없습니다.');
    error.status = 404;
    // 전역 에러 핸들러가 처리하도록 이벤트 발생
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('404error', { detail: { url: `${API_BASE_URL}/api/categories/${id}`, type: 'category' } }));
    }, 0);
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카테고리 조회 실패' }));
    const err = new Error(error.message || '카테고리를 찾을 수 없습니다.');
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.data?.category || null;
}

/**
 * 계층 구조 카테고리 조회 (대분류 > 중분류 > 소분류)
 * @param {boolean} includeProductCount - 상품 수 포함 여부
 * @returns {Promise<Array>} 계층 구조 카테고리 목록
 */
export async function fetchCategoryHierarchy(includeProductCount = false) {
  const params = new URLSearchParams();
  if (includeProductCount) params.append('includeProductCount', 'true');
  
  const url = `${API_BASE_URL}/api/categories/hierarchy${params.toString() ? `?${params.toString()}` : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 500 에러인 경우 빈 배열 반환 (서버 에러는 조용히 처리)
      if (response.status === 500) {
        console.warn('카테고리 계층 구조 API 서버 에러:', response.status);
        return [];
      }
      
      const errorData = await response.json().catch(() => ({ 
        message: `카테고리 조회 실패 (${response.status})` 
      }));
      const errorMessage = errorData.message || errorData.error || `카테고리 조회에 실패했습니다. (${response.status})`;
      console.error('카테고리 계층 구조 API 에러:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.success) {
      // 실패해도 빈 배열 반환 (에러를 throw하지 않음)
      console.warn('카테고리 계층 구조 조회 실패:', data.message);
      return [];
    }
    
    return data.data?.hierarchy || [];
  } catch (error) {
    // 네트워크 에러나 기타 에러도 빈 배열 반환
    console.error('카테고리 fetchCategoryHierarchy 에러:', {
      url,
      error: error.message,
    });
    // 에러를 throw하지 않고 빈 배열 반환하여 UI가 깨지지 않도록 함
    return [];
  }
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

/**
 * 카테고리 생성 (관리자)
 * @param {Object} categoryData - 카테고리 데이터
 * @returns {Promise<Object>} 생성된 카테고리 정보
 */
export async function createCategory(categoryData) {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카테고리 생성 실패' }));
    const errorMessage = error.message || error.error || '카테고리 생성에 실패했습니다.';
    
    // 401 에러 처리
    if (response.status === 401) {
      throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data?.category || null;
}

/**
 * 카테고리 수정 (관리자)
 * @param {string} id - 카테고리 ID
 * @param {Object} categoryData - 수정할 카테고리 데이터
 * @returns {Promise<Object>} 수정된 카테고리 정보
 */
export async function updateCategory(id, categoryData) {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카테고리 수정 실패' }));
    const errorMessage = error.message || error.error || '카테고리 수정에 실패했습니다.';
    
    // 401 에러 처리
    if (response.status === 401) {
      throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data?.category || null;
}

/**
 * 카테고리 삭제 (관리자)
 * @param {string} id - 카테고리 ID
 * @returns {Promise<void>}
 */
export async function deleteCategory(id) {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카테고리 삭제 실패' }));
    const errorMessage = error.message || error.error || '카테고리 삭제에 실패했습니다.';
    
    // 401 에러 처리
    if (response.status === 401) {
      throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    
    throw new Error(errorMessage);
  }

  return;
}

