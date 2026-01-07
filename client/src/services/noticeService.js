import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getNotices({ page = 1, limit = 20, type, isImportant, search } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (type) {
    params.set('type', type);
  }
  if (isImportant) {
    params.set('isImportant', String(isImportant));
  }
  if (search) {
    params.set('search', search);
  }

  const response = await fetch(`${API_BASE_URL}/api/notices?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '공지사항 목록을 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getNoticeById(id) {
  const response = await fetch(`${API_BASE_URL}/api/notices/${id}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '공지사항 정보를 불러오지 못했습니다.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

