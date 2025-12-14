import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWishlist() {
  const response = await fetch(`${API_BASE_URL}/api/wishlists`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '찜하기 목록을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

export async function addWishlistItem(productId) {
  const response = await fetch(`${API_BASE_URL}/api/wishlists/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '찜하기에 추가하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

export async function removeWishlistItem(productId) {
  const response = await fetch(`${API_BASE_URL}/api/wishlists/items/${productId}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '찜하기에서 제거하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

export async function removeWishlistItems(productIds) {
  const response = await fetch(`${API_BASE_URL}/api/wishlists/items`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ productIds }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '찜하기에서 제거하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

export async function checkWishlistItem(productId) {
  const response = await fetch(`${API_BASE_URL}/api/wishlists/check/${productId}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '찜하기 상태를 확인하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

export async function checkWishlistItems(productIds) {
  const ids = Array.isArray(productIds) ? productIds.join(',') : productIds;
  const response = await fetch(`${API_BASE_URL}/api/wishlists/check?productIds=${ids}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '찜하기 상태를 확인하지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

