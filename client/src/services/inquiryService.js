import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getInquiries({ page = 1, limit = 20, status, type } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (status) {
    params.set('status', status);
  }
  if (type) {
    params.set('type', type);
  }

  const response = await fetch(`${API_BASE_URL}/api/inquiries?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '1:1 문의 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getInquiryById(id) {
  const response = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (response.status === 404) {
    const error = new Error('1:1 문의를 찾을 수 없습니다.');
    error.status = 404;
    // 전역 에러 핸들러가 처리하도록 이벤트 발생
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('404error', { detail: { url: `${API_BASE_URL}/api/inquiries/${id}`, type: 'inquiry' } }));
    }, 0);
    throw error;
  }

  if (!response.ok) {
    const message = data?.message || '1:1 문의 정보를 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function createInquiry(payload) {
  const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '1:1 문의를 생성하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function updateInquiry(id, payload) {
  const response = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '1:1 문의를 수정하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function deleteInquiry(id) {
  const response = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '1:1 문의를 삭제하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * 관리자용 모든 1:1 문의 목록 조회
 */
export async function getAllInquiries({ page = 1, limit = 20, status, type, search } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (status) {
    params.set('status', status);
  }
  if (type) {
    params.set('type', type);
  }
  if (search) {
    params.set('search', search);
  }

  const response = await fetch(`${API_BASE_URL}/api/inquiries/admin/all?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '1:1 문의 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * 1:1 문의 답변 작성 (관리자용)
 */
export async function answerInquiry(id, content) {
  const response = await fetch(`${API_BASE_URL}/api/inquiries/${id}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '답변을 작성하지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

