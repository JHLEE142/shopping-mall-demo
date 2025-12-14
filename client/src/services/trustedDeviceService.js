const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

// 자동 로그인
export async function autoLogin(deviceId, rememberToken) {
  const response = await fetch(`${API_BASE_URL}/api/trusted-devices/auto-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId, rememberToken }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '자동 로그인에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

// 로그인된 기기 목록 조회
export async function getTrustedDevices() {
  const token = localStorage.getItem('authSession');
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const session = JSON.parse(token);
  const authToken = session?.token;

  const response = await fetch(`${API_BASE_URL}/api/trusted-devices`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '기기 목록을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

// 특정 기기 로그아웃
export async function revokeDevice(deviceId) {
  const token = localStorage.getItem('authSession');
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const session = JSON.parse(token);
  const authToken = session?.token;

  const response = await fetch(`${API_BASE_URL}/api/trusted-devices/${deviceId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '기기 로그아웃에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

// 모든 기기 로그아웃
export async function revokeAllDevices() {
  const token = localStorage.getItem('authSession');
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const session = JSON.parse(token);
  const authToken = session?.token;

  const response = await fetch(`${API_BASE_URL}/api/trusted-devices`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '모든 기기 로그아웃에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

