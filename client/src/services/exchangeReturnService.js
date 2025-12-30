import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createExchangeReturn(payload) {
  const response = await fetch(`${API_BASE_URL}/api/exchange-returns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '교환/반품 신청을 생성하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getExchangeReturns({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (status) {
    params.set('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/api/exchange-returns?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '교환/반품 신청 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getExchangeReturnById(id) {
  const response = await fetch(`${API_BASE_URL}/api/exchange-returns/${id}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '교환/반품 신청 정보를 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function updateExchangeReturnStatus(id, { status, rejectedReason, notes }) {
  const response = await fetch(`${API_BASE_URL}/api/exchange-returns/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ status, rejectedReason, notes }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '교환/반품 신청 상태를 업데이트하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function cancelExchangeReturn(id) {
  const response = await fetch(`${API_BASE_URL}/api/exchange-returns/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '교환/반품 신청을 취소하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

