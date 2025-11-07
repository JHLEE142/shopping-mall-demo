const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

