import { getAuthToken, getRemainingTime } from '../utils/sessionStorage';
import { refreshToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 토큰 유효성 검증 및 필요시 갱신
async function ensureValidToken() {
  const remainingTime = getRemainingTime();
  // 5분 이하 남았으면 갱신
  if (remainingTime < 5 * 60 * 1000) {
    console.log('[Token] Token expires soon, refreshing...');
    try {
      await refreshToken();
      console.log('[Token] Token refreshed successfully');
    } catch (error) {
      console.error('[Token] Token refresh failed:', error);
      throw new Error('토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
    }
  }
}

// 401 에러 시 토큰 갱신 후 재시도하는 래퍼 함수
async function fetchWithRetry(url, options, maxRetries = 1) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // 401 에러인 경우 토큰 갱신 후 재시도
      if (response.status === 401 && attempt < maxRetries) {
        console.log(`[Retry] 401 error detected, attempt ${attempt + 1}/${maxRetries + 1}, refreshing token...`);
        try {
          await refreshToken();
          // 토큰 갱신 후 새로운 옵션 객체 생성 (FormData를 보존하기 위해)
          const newToken = getAuthToken();
          if (newToken) {
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            options = newOptions;
            console.log('[Retry] Token refreshed, retrying request...');
            continue; // 재시도
          }
        } catch (refreshError) {
          console.error('[Retry] Token refresh failed:', refreshError);
          throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        }
      }
      
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && !error.message?.includes('로그인 세션이 만료')) {
        console.log(`[Retry] Request failed, attempt ${attempt + 1}/${maxRetries + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // 재시도 전 짧은 딜레이
      } else {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

export async function createProduct(productPayload) {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(productPayload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '상품 등록에 실패했어요. 잠시 후 다시 시도해주세요.';
    throw new Error(message);
  }

  return response.json();
}

export async function fetchProducts(page = 1, limit = 12, category = null, search = null) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  // 카테고리 필터 추가
  if (category) {
    params.append('category', category);
  }

  // 검색 쿼리 추가
  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '상품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    throw new Error(message);
  }

  return response.json();
}

export async function updateProduct(productId, productPayload) {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(productPayload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '상품 정보를 수정하지 못했습니다. 잠시 후 다시 시도해주세요.';
    throw new Error(message);
  }

  return response.json();
}

export async function deleteProduct(productId) {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '상품을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.';
    throw new Error(message);
  }
}

export async function fetchProductById(productId) {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);

  if (response.status === 404) {
    throw new Error('상품을 찾을 수 없습니다.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '상품 정보를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * 유사한 상품 추천 (같은 카테고리 + 상품 이름 유사도 고려)
 * @param {string} productId - 현재 상품 ID
 * @param {number} limit - 가져올 상품 개수 (기본값: 4)
 * @returns {Promise<Array>} 추천 상품 목록
 */
export async function fetchSimilarProducts(productId, limit = 4) {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
    });

    const response = await fetch(`${API_BASE_URL}/api/products/${productId}/similar?${params.toString()}`, {
      headers: {
        ...buildAuthHeaders(),
      },
    });

    if (!response.ok) {
      console.error('추천 상품 조회 실패:', response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('추천 상품 조회 중 오류:', error);
    return [];
  }
}

/**
 * 엑셀 파일 업로드 및 미리보기
 * @param {File} file - 업로드할 엑셀 파일
 * @returns {Promise<Object>} - 미리보기 데이터
 */
export async function importExcel(file) {
  console.log('[importExcel] Starting API call:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    url: `${API_BASE_URL}/api/products/import/excel`
  });

  // 토큰 유효성 검증 및 필요시 갱신
  await ensureValidToken();

  const requestStartTime = Date.now();
  
  // 401 에러 시 재시도를 위한 래퍼
  const makeRequest = async (retryCount = 0) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/products/import/excel`, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(),
      },
      body: formData,
    });

    // 401 에러인 경우 토큰 갱신 후 재시도
    if (response.status === 401 && retryCount < 1) {
      console.log(`[importExcel] 401 error detected, attempt ${retryCount + 1}/2, refreshing token...`);
      try {
        await refreshToken();
        console.log('[importExcel] Token refreshed, retrying request...');
        return makeRequest(retryCount + 1); // 재시도
      } catch (refreshError) {
        console.error('[importExcel] Token refresh failed:', refreshError);
        throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    return response;
  };
  
  try {
    console.log('[importExcel] Sending fetch request...');
    const response = await makeRequest();

    const requestDuration = Date.now() - requestStartTime;
    console.log('[importExcel] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: requestDuration + 'ms'
    });

    if (!response.ok) {
      const data = await response.json().catch((err) => {
        console.error('[importExcel] Failed to parse error response:', err);
        return null;
      });
      console.error('[importExcel] Error response data:', data);
      const message = data?.message || 'Excel file upload failed. Please try again.';
      throw new Error(message);
    }

    const result = await response.json();
    console.log('[importExcel] Success response:', {
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      previewLength: result.preview?.length || 0
    });
    
    return result;
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.error('[importExcel] Request failed after', requestDuration + 'ms:', error);
    console.error('[importExcel] Error type:', error.constructor.name);
    console.error('[importExcel] Error message:', error.message);
    throw error;
  }
}

/**
 * 상품 등록 커밋 (테스트 버전: 상위 5개만)
 * @param {Array} preview - 미리보기 데이터 배열
 * @returns {Promise<Object>} - 커밋 결과 리포트
 */
export async function commitImport(preview) {
  // 토큰 유효성 검증 및 필요시 갱신
  await ensureValidToken();

  const response = await fetchWithRetry(`${API_BASE_URL}/api/products/import/commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ preview }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || 'Failed to commit products. Please try again.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * Hybrid 검색 API 호출
 * @param {string} query - 검색 쿼리
 * @param {number} limit - 반환할 결과 수
 * @param {number} phonemeWeight - Phoneme 검색 가중치
 * @param {number} embeddingWeight - Embedding 검색 가중치
 * @returns {Promise<Object>} - 검색 결과
 */
export async function searchProducts(query, limit = 20, phonemeWeight = 0.4, embeddingWeight = 0.6) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    phonemeWeight: String(phonemeWeight),
    embeddingWeight: String(embeddingWeight),
  });

  const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '검색에 실패했습니다. 잠시 후 다시 시도해주세요.';
    throw new Error(message);
  }

  return response.json();
}
