import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function addItemToCart(productId, quantity = 1, selectedOptions = {}) {
  const response = await fetch(`${API_BASE_URL}/api/carts/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ productId, quantity, selectedOptions }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '장바구니에 상품을 담지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
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

export async function updateCartItemQuantity(productId, quantity, selectedOptions) {
  const payload = { quantity };
  if (selectedOptions) {
    payload.selectedOptions = selectedOptions;
  }

  const response = await fetch(`${API_BASE_URL}/api/carts/items/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '장바구니 수량을 변경하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

export async function removeCartItem(productId) {
  const response = await fetch(`${API_BASE_URL}/api/carts/items/${productId}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '장바구니에서 상품을 삭제하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

