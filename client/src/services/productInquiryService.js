import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 상품별 문의 목록 조회
 */
export async function getInquiriesByProduct(productId, { page = 1, limit = 20, search } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/api/product-inquiries/product/${productId}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '문의 목록을 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 문의 작성
 */
export async function createInquiry(productId, inquiryData) {
  const response = await fetch(`${API_BASE_URL}/api/product-inquiries/product/${productId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(inquiryData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '문의 작성에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 문의 답변 작성 (관리자만)
 */
export async function answerInquiry(inquiryId, answer) {
  const response = await fetch(`${API_BASE_URL}/api/product-inquiries/${inquiryId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ answer }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '답변 작성에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 문의 수정
 */
export async function updateInquiry(inquiryId, inquiryData) {
  const response = await fetch(`${API_BASE_URL}/api/product-inquiries/${inquiryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(inquiryData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '문의 수정에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result;
}

/**
 * 문의 삭제
 */
export async function deleteInquiry(inquiryId) {
  const response = await fetch(`${API_BASE_URL}/api/product-inquiries/${inquiryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '문의 삭제에 실패했습니다.';
    throw new Error(message);
  }

  return true;
}

