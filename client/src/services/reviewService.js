import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 상품별 리뷰 목록 조회
 */
export async function getReviewsByProduct(productId, { page = 1, limit = 20, rating, gender, purpose, size } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (rating) params.append('rating', rating);
  if (gender) params.append('gender', gender);
  if (purpose) params.append('purpose', purpose);
  if (size) params.append('size', size);

  const response = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '리뷰 목록을 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 상품별 리뷰 통계 조회
 */
export async function getReviewStats(productId) {
  const response = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '리뷰 통계를 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 리뷰 작성
 */
export async function createReview(productId, reviewData) {
  const response = await fetch(`${API_BASE_URL}/api/reviews/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ productId, ...reviewData }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '리뷰 작성에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 리뷰 미작성 상품 목록 조회
 */
export async function getUnreviewedProducts() {
  const response = await fetch(`${API_BASE_URL}/api/reviews/unreviewed`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '리뷰 미작성 상품 목록을 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

