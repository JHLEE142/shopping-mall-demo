const STORAGE_KEY = 'authSession';
const DEVICE_STORAGE_KEY = 'trustedDevice';
const SESSION_DURATION = 60 * 60 * 1000; // 60분 (밀리초)

export function saveSession({ token, user, expiresAt, lastActivityTime, deviceId, rememberToken, deviceExpiresAt }) {
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

  // 자동 로그인 정보 저장
  if (deviceId && rememberToken) {
    const deviceData = {
      deviceId,
      rememberToken,
      expiresAt: deviceExpiresAt || null,
    };
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(deviceData));
  }
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
  localStorage.removeItem(DEVICE_STORAGE_KEY);
}

export function getTrustedDevice() {
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.deviceId || !parsed?.rememberToken) {
      return null;
    }
    // 만료 확인
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem(DEVICE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    localStorage.removeItem(DEVICE_STORAGE_KEY);
    return null;
  }
}

export function clearTrustedDevice() {
  localStorage.removeItem(DEVICE_STORAGE_KEY);
}

export function getAuthToken() {
  const session = loadSession();
  return session?.token || null;
}


