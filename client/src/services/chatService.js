const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

/**
 * OpenAI API를 통해 채팅 메시지 전송
 * @param {Array} messages - 대화 메시지 배열
 * @param {boolean} isLoggedIn - 로그인 여부
 * @param {string} currentView - 현재 페이지 (login, signup, home 등)
 * @param {string} apiKey - OpenAI API 키
 * @returns {Promise<string>} AI 응답 텍스트
 */
export async function sendChatMessage(messages, isLoggedIn = false, currentView = 'home', apiKey = null) {
  try {
    // API key는 서버의 .env에서 사용하므로 클라이언트에서는 전달하지 않음
    // 서버가 자동으로 process.env.OPENAI_API_KEY를 사용함
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
        isLoggedIn,
        currentView, // 현재 페이지 정보 추가
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '서버 오류가 발생했습니다.' }));
      throw new Error(errorData.message || '채팅 메시지 전송에 실패했습니다.');
    }

    const data = await response.json();
    // productCards도 함께 반환
    return {
      message: data.message || data.response || '응답을 받을 수 없습니다.',
      response: data.message || data.response || '응답을 받을 수 없습니다.',
      productCards: data.productCards || null,
    };
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

// API 키는 서버에서 관리하므로 클라이언트 함수는 제거됨

