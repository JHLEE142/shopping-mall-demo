/**
 * 404 에러 발생 시 메인페이지로 리다이렉트하는 fetch 래퍼
 * 모든 API 호출에서 사용하여 일관된 404 처리를 제공합니다.
 */

// 404 에러 발생 시 호출할 콜백 함수
let on404Callback = null;

/**
 * 404 에러 핸들러 설정
 * @param {Function} callback - 404 발생 시 호출할 함수
 */
export function set404Handler(callback) {
  on404Callback = callback;
}

/**
 * fetch 래퍼 함수
 * 404 응답을 감지하고 콜백을 호출합니다.
 * @param {string} url - 요청 URL
 * @param {RequestInit} options - fetch 옵션
 * @returns {Promise<Response>}
 */
export async function fetchWith404Handler(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    // 404 응답 감지
    if (response.status === 404) {
      console.warn(`404 error detected for URL: ${url}`);
      
      // 콜백이 설정되어 있으면 호출
      if (on404Callback) {
        on404Callback(url, response);
      } else {
        // 콜백이 없으면 기본 동작: 메인페이지로 리다이렉트
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '') {
          window.location.href = '/';
        }
      }
    }
    
    return response;
  } catch (error) {
    // 네트워크 에러나 기타 에러도 처리
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn(`Network error detected for URL: ${url}`);
      
      if (on404Callback) {
        on404Callback(url, null);
      } else {
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '') {
          window.location.href = '/';
        }
      }
    }
    
    throw error;
  }
}

