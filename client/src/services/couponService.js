import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 사용자의 쿠폰함 조회
 */
export async function getUserCoupons() {
  const response = await fetch(`${API_BASE_URL}/api/coupons/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰함을 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 받을 수 있는 쿠폰 목록 조회
 */
export async function getAvailableCoupons() {
  const response = await fetch(`${API_BASE_URL}/api/coupons/available`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰 목록을 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 쿠폰 받기
 */
export async function receiveCoupon(couponId) {
  const response = await fetch(`${API_BASE_URL}/api/coupons/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ couponId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰을 받는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 관리자: 모든 쿠폰 목록 조회
 */
export async function getAllCoupons({ page = 1, limit = 20, status = 'all' } = {}) {
  const params = new URLSearchParams({ page, limit, status });
  const response = await fetch(`${API_BASE_URL}/api/coupons/admin/all?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰 목록을 불러오는데 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 관리자: 쿠폰 생성
 */
export async function createCoupon(couponData) {
  const response = await fetch(`${API_BASE_URL}/api/coupons/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰 생성에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 관리자: 쿠폰 수정
 */
export async function updateCoupon(couponId, couponData) {
  const response = await fetch(`${API_BASE_URL}/api/coupons/admin/${couponId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰 수정에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 관리자: 쿠폰 삭제
 */
export async function deleteCoupon(couponId) {
  const response = await fetch(`${API_BASE_URL}/api/coupons/admin/${couponId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '쿠폰 삭제에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * 관리자: 사용자별 쿠폰 조회
 */
export async function getUserCouponsByAdmin({ userId, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (userId) params.append('userId', userId);
  
  const response = await fetch(`${API_BASE_URL}/api/coupons/admin/user-coupons?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '사용자 쿠폰 조회에 실패했습니다.';
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

