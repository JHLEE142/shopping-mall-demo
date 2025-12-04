const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

export async function createUser(userPayload) {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userPayload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '회원가입에 실패했어요. 잠시 후 다시 시도해주세요.';
    throw new Error(message);
  }

  return response.json();
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '로그인에 실패했어요. 입력한 정보를 확인해주세요.';
    throw new Error(message);
  }

  return response.json();
}

export async function getUsers({ page = 1, limit = 10, user_type } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (user_type) {
    params.set('user_type', user_type);
  }

  const response = await fetch(`${API_BASE_URL}/api/users?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '사용자 목록을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

