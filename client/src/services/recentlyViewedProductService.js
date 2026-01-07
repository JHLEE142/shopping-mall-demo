import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getRecentlyViewedProducts({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  const response = await fetch(`${API_BASE_URL}/api/recently-viewed-products?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '최근 본 상품 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function addRecentlyViewedProduct(productId) {
  const response = await fetch(`${API_BASE_URL}/api/recently-viewed-products/${productId}`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 로그인하지 않은 경우는 에러로 처리하지 않음
    if (response.status === 401) {
      return null;
    }
    const message = data?.message || '조회 기록을 추가하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function deleteRecentlyViewedProduct(id) {
  const response = await fetch(`${API_BASE_URL}/api/recently-viewed-products/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '조회 기록을 삭제하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function deleteAllRecentlyViewedProducts() {
  const response = await fetch(`${API_BASE_URL}/api/recently-viewed-products`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '모든 조회 기록을 삭제하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

