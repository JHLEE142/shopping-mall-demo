import { getAuthToken, saveSession, clearSession, loadSession } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

export async function fetchCurrentSession() {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearSession();
    return null;
  }

  if (!response.ok) {
    throw new Error('세션 정보를 불러오지 못했습니다.');
  }

  const data = await response.json();
  const session = loadSession();
  if (session) {
    saveSession({ 
      token: session.token, 
      user: data.user, 
      expiresAt: session.expiresAt || Date.now() + 60 * 60 * 1000,
      lastActivityTime: session.lastActivityTime || Date.now()
    });
  }
  return data.user;
}

export async function logout() {
  const token = getAuthToken();
  if (!token) {
    clearSession();
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => null);

  if (response && !response.ok && response.status !== 401) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '로그아웃에 실패했습니다.';
    throw new Error(message);
  }

  clearSession();
}


