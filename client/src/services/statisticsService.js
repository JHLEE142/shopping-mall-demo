import { getAuthToken } from '../utils/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/dashboard`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '대시보드 통계를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getRevenueTrend() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/revenue-trend`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '매출 추이를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getCategorySales() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/category-sales`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '카테고리별 매출을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getOrderStatusDistribution() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/order-status`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '주문 상태 분포를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getTopProducts() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/top-products`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '인기 상품을 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getStatisticsData() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/statistics`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '통계 데이터를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getCategoryPerformance() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/category-performance`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '카테고리 성과를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

export async function getStatisticsHighlights() {
  const response = await fetch(`${API_BASE_URL}/api/statistics/highlights`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '통계 하이라이트를 불러오지 못했습니다.';
    throw new Error(message);
  }

  return data;
}

