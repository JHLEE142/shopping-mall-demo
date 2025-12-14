import { getAuthToken as getSessionToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function getAuthToken() {
  return getSessionToken();
}

// 적립금 조회 (총 적립금, 사용가능 적립금, 사용된 적립금)
export async function getPoints() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/points`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '적립금을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

// 적립금 내역 조회
export async function getPointHistory({ page = 1, limit = 20, type } = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (type && (type === 'earn' || type === 'use')) {
    params.set('type', type);
  }

  const response = await fetch(`${API_BASE_URL}/api/points/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '적립금 내역을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

// 적립금 적립
export async function earnPoints({ amount, description, relatedOrder, relatedProduct }) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/points/earn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      description,
      relatedOrder,
      relatedProduct,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '적립금 적립에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

// 적립금 사용
export async function usePoints({ amount, description, relatedOrder }) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/points/use`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      description,
      relatedOrder,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '적립금 사용에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

