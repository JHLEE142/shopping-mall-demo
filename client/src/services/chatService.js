import localChatModel from '../utils/localChatModel';
import { fetchProducts } from './productService';

/**
 * 로컬 로직을 사용한 채팅 메시지 처리
 * @param {Array} messages - 대화 메시지 배열
 * @param {boolean} isLoggedIn - 로그인 여부
 * @param {string} currentView - 현재 페이지 (login, signup, home 등)
 * @param {string} apiKey - 사용하지 않음 (로컬 로직 사용)
 * @param {number} page - 검색 결과 페이지 번호 (기본값: 1)
 * @param {number} searchLimit - 검색 결과 페이지당 항목 수 (기본값: 40)
 * @returns {Promise<Object>} 응답 객체
 */
export async function sendChatMessage(messages, isLoggedIn = false, currentView = 'home', apiKey = null, page = 1, searchLimit = 40) {
  try {
    // 마지막 사용자 메시지 가져오기
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.sender !== 'user') {
      throw new Error('사용자 메시지가 필요합니다.');
    }

    const userMessage = lastMessage.text || lastMessage.content || '';

    // 로컬 모델로 메시지 처리
    const result = await localChatModel.processMessage(userMessage, {
      isLoggedIn,
      currentView,
    });

    // 액션에 따라 추가 처리
    let productCards = null;
    let pagination = null;

    if (result.action === 'search' && result.params?.query) {
      try {
        // 상품 검색 실행
        const searchResult = await fetchProducts(page, searchLimit, null, result.params.query);
        if (searchResult.items && searchResult.items.length > 0) {
          productCards = searchResult.items.map(item => ({
            id: item._id || item.id,
            name: item.name,
            price: item.priceSale || item.price,
            image: item.image || item.gallery?.[0] || '/placeholder.png',
            description: item.description || '',
          }));
          pagination = {
            page: searchResult.page || page,
            limit: searchResult.limit || searchLimit,
            total: searchResult.total || 0,
            totalPages: searchResult.totalPages || 1,
          };
        } else {
          // 검색 결과가 없으면 메시지 수정
          result.answer = `${result.params.query}에 대한 검색 결과가 없습니다. 다른 키워드로 검색해보세요.`;
        }
      } catch (searchError) {
        console.error('상품 검색 실패:', searchError);
        result.answer = '상품 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
    }

    return {
      message: result.answer,
      response: result.answer,
      productCards,
      pagination,
      action: result.action,
      params: result.params,
    };
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}

// API 키는 서버에서 관리하므로 클라이언트 함수는 제거됨

