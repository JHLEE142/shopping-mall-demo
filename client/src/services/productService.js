import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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


