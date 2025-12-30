const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

/**
 * OpenAI API를 통해 채팅 메시지 전송
 * @param {Array} messages - 대화 메시지 배열
 * @param {boolean} isLoggedIn - 로그인 여부
 * @param {string} apiKey - OpenAI API 키
 * @returns {Promise<string>} AI 응답 텍스트
 */
export async function sendChatMessage(messages, isLoggedIn = false, apiKey = null) {
  try {
    const storedApiKey = apiKey || getOpenAIApiKey();
    
    if (!storedApiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenAI-API-Key': storedApiKey,
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
        isLoggedIn,
        apiKey: storedApiKey, // body에도 포함 (호환성)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '서버 오류가 발생했습니다.' }));
      throw new Error(errorData.message || '채팅 메시지 전송에 실패했습니다.');
    }

    const data = await response.json();
    return data.message || data.response || '응답을 받을 수 없습니다.';
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

/**
 * OpenAI API 키 설정
 * @param {string} apiKey - OpenAI API 키
 */
export function setOpenAIApiKey(apiKey) {
  localStorage.setItem('openai_api_key', apiKey);
}

/**
 * 저장된 OpenAI API 키 가져오기
 * @returns {string|null} API 키 또는 null
 */
export function getOpenAIApiKey() {
  return localStorage.getItem('openai_api_key');
}

/**
 * 저장된 OpenAI API 키 삭제
 */
export function clearOpenAIApiKey() {
  localStorage.removeItem('openai_api_key');
}

