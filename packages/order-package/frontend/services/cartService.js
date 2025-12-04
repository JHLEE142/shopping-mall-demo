// 이 파일은 OrderPage에서 fetchCart를 사용하기 위해 필요합니다.
// 프로젝트의 cartService를 import하거나 동일한 함수를 구현해야 합니다.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = localStorage.getItem('authSession') 
    ? JSON.parse(localStorage.getItem('authSession'))?.token 
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCart() {
  const response = await fetch(`${API_BASE_URL}/api/carts`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '장바구니 정보를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

