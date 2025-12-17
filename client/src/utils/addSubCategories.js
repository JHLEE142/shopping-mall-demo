// 관리자 페이지에서 실행할 수 있는 스크립트
// 브라우저 콘솔에서 실행하거나 관리자 페이지에 버튼 추가 가능

export async function addSubCategoriesToDatabase() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    console.error('로그인이 필요합니다.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/categories/add-default-subcategories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 중분류/소분류 추가 완료:', result.data.summary);
      console.log('생성된 카테고리:', result.data.details.created.length, '개');
      return result;
    } else {
      console.error('❌ 중분류/소분류 추가 실패:', result.message);
      return result;
    }
  } catch (error) {
    console.error('❌ API 호출 실패:', error);
    throw error;
  }
}

// 브라우저 콘솔에서 직접 실행 가능하도록
if (typeof window !== 'undefined') {
  window.addSubCategoriesToDatabase = addSubCategoriesToDatabase;
}

