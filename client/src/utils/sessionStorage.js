const STORAGE_KEY = 'authSession';
const SESSION_DURATION = 60 * 60 * 1000; // 60분 (밀리초)

export function saveSession({ token, user, expiresAt, lastActivityTime }) {
  if (!token || !expiresAt) {
    return;
  }

  const data = {
    token,
    user: user || null,
    expiresAt,
    lastActivityTime: lastActivityTime || Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 활동 시간 업데이트 (새로운 동작 시마다 호출)
export function updateActivityTime() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) {
      return;
    }

    const now = Date.now();
    const newExpiresAt = now + SESSION_DURATION;
    
    parsed.lastActivityTime = now;
    parsed.expiresAt = newExpiresAt;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Failed to update activity time:', error);
  }
}

// 남은 시간 계산 (밀리초)
export function getRemainingTime() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return 0;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt) {
      return 0;
    }

    const remaining = parsed.expiresAt - Date.now();
    return Math.max(0, remaining);
  } catch (error) {
    return 0;
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) {
      clearSession();
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      clearSession();
      return null;
    }

    return parsed;
  } catch (error) {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthToken() {
  const session = loadSession();
  return session?.token || null;
}


