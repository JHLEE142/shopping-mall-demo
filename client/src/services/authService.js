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

export async function refreshToken() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('토큰이 없습니다.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const message = data?.message || '토큰 갱신에 실패했습니다.';
      throw new Error(message);
    }

    const data = await response.json();
    const newToken = data.token;

    // 세션 업데이트
    const session = loadSession();
    if (session) {
      const expiresAt = Date.now() + 60 * 60 * 1000; // 60분
      saveSession({
        token: newToken,
        user: session.user,
        expiresAt,
        lastActivityTime: Date.now(),
      });
    }

    return newToken;
  } catch (error) {
    console.error('[refreshToken] Token refresh failed:', error);
    throw error;
  }
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


