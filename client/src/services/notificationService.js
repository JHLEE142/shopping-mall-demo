import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 신상품 알림 구독
 */
export async function subscribeToNewProducts() {
  const response = await fetch(`${API_BASE_URL}/api/notifications/subscribe/new-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '알림 구독에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * 신상품 알림 구독 해제
 */
export async function unsubscribeFromNewProducts() {
  const response = await fetch(`${API_BASE_URL}/api/notifications/unsubscribe/new-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '알림 구독 해제에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * 구독 상태 확인
 */
export async function getSubscriptionStatus() {
  const response = await fetch(`${API_BASE_URL}/api/notifications/subscription/status`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '구독 상태 확인에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * 사용자 알림 목록 조회
 */
export async function getUserNotifications(page = 1, limit = 20, unreadOnly = false) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  
  if (unreadOnly) {
    params.append('unreadOnly', 'true');
  }

  const response = await fetch(`${API_BASE_URL}/api/notifications?${params.toString()}`, {
    headers: {
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '알림 목록을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId) {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '알림 읽음 처리에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead() {
  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || '알림 읽음 처리에 실패했습니다.';
    throw new Error(message);
  }

  return response.json();
}

