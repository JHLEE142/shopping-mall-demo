import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createOrder(payload) {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '주문을 생성하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchOrders({ page = 1, limit = 20, status, userId } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (status) {
    params.set('status', status);
  }

  if (userId) {
    params.set('userId', userId);
  }

  const response = await fetch(`${API_BASE_URL}/api/orders?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '주문 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchOrderById(orderId) {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (response.status === 404) {
    const error = new Error('주문을 찾을 수 없습니다.');
    error.status = 404;
    // 전역 에러 핸들러가 처리하도록 이벤트 발생
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('404error', { detail: { url: `${API_BASE_URL}/api/orders/${orderId}`, type: 'order' } }));
    }, 0);
    throw error;
  }

  if (!response.ok) {
    const message = data?.message || '주문 정보를 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function updateOrder(orderId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '주문을 수정하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}


