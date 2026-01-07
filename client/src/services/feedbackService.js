import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getFeedbacks({ page = 1, limit = 20, status, type } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (status) {
    params.set('status', status);
  }
  if (type) {
    params.set('type', type);
  }

  const response = await fetch(`${API_BASE_URL}/api/feedbacks?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '개선 의견 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getFeedbackById(id) {
  const response = await fetch(`${API_BASE_URL}/api/feedbacks/${id}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '개선 의견 정보를 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function createFeedback(payload) {
  const response = await fetch(`${API_BASE_URL}/api/feedbacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '개선 의견을 생성하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function updateFeedback(id, payload) {
  const response = await fetch(`${API_BASE_URL}/api/feedbacks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '개선 의견을 수정하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function deleteFeedback(id) {
  const response = await fetch(`${API_BASE_URL}/api/feedbacks/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '개선 의견을 삭제하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

