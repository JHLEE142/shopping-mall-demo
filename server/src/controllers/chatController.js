const axios = require('axios');
const { getSystemPrompt } = require('../prompts/assistantPrompt');

/**
 * AI 응답에서 역할/함수 설명 제거
 */
function cleanAIResponse(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let cleaned = response;

  // 역할/함수 설명 패턴 제거
  const unwantedPatterns = [
    // 역할 관련
    /역할\s*[:：]\s*[^\n]+/gi,
    /핵심\s*역할\s*[:：]\s*[^\n]+/gi,
    /##\s*역할[^\n]*/gi,
    /###\s*역할[^\n]*/gi,
    /대행자\s*\([^)]*\)/gi,
    /안내자\s*아님[^\n]*/gi,
    /역할\s*[^\n]*대행자[^\n]*/gi,
    
    // 함수 관련 (실제 TOOL_CALL은 유지)
    /함수\s*[:：]\s*[^\n]+/gi,
    /##\s*함수[^\n]*/gi,
    /###\s*함수[^\n]*/gi,
    
    // 프롬프트/지침 관련
    /프롬프트[^\n]*/gi,
    /지침[^\n]*/gi,
    /규칙[^\n]*/gi,
    /##\s*[^\n]*역할[^\n]*/gi,
    /###\s*[^\n]*역할[^\n]*/gi,
    
    // 시스템 메시지 스타일 제거
    /당신은\s*[^\n]*비서입니다[^\n]*/gi,
    /이\s*전자상거래[^\n]*/gi,
    /사용자\s*대신\s*직접[^\n]*/gi,
    /설명하지\s*말고\s*실행하라[^\n]*/gi,
    
    // 마크다운 헤더 제거 (역할 관련)
    /^#{1,3}\s*역할[^\n]*$/gim,
    /^#{1,3}\s*함수[^\n]*$/gim,
  ];

  unwantedPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // "잠시만 기다려주세요" 이후의 역할 설명 제거
  // "잠시만 기다려주세요" 또는 "기다려 주세요" 이후에 나오는 역할/함수 설명 제거
  const waitPattern = /(잠시만\s*기다려\s*주세요|기다려\s*주세요|잠시만\s*기다려주세요)[^\n]*\n/gi;
  const waitMatch = cleaned.match(waitPattern);
  if (waitMatch) {
    // "잠시만 기다려주세요" 이후의 내용에서 역할/함수 설명 제거
    const parts = cleaned.split(waitPattern);
    if (parts.length > 1) {
      // 첫 번째 부분(잠시만 기다려주세요 포함)은 유지
      let afterWait = parts.slice(1).join('');
      
      // 역할/함수 설명 제거
      afterWait = afterWait.replace(/역할[^\n]*/gi, '');
      afterWait = afterWait.replace(/함수[^\n]*/gi, '');
      afterWait = afterWait.replace(/대행자[^\n]*/gi, '');
      afterWait = afterWait.replace(/안내자[^\n]*/gi, '');
      
      cleaned = parts[0] + waitMatch[0] + afterWait;
    }
  }

  // 연속된 빈 줄 정리
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 앞뒤 공백 제거
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * OpenAI API를 통해 채팅 메시지 처리
 */
async function sendChatMessage(req, res) {
  try {
    const { messages, isLoggedIn, currentView } = req.body;
    // 환경 변수에서 기본 API 키 가져오기, 없으면 요청에서 가져오기
    const apiKey = req.headers['x-openai-api-key'] || req.body.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        message: 'OpenAI API 키가 필요합니다. API 키를 설정해주세요.',
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: '메시지가 필요합니다.',
      });
    }

    // 상황별 시스템 프롬프트 생성
    const systemPrompt = getSystemPrompt(isLoggedIn, currentView);

    // OpenAI API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let aiMessage = response.data.choices[0]?.message?.content;

    if (!aiMessage) {
      return res.status(500).json({
        message: 'AI 응답을 받을 수 없습니다.',
      });
    }

    // 응답에서 역할/함수 설명 제거
    aiMessage = cleanAIResponse(aiMessage);

    res.json({
      message: aiMessage,
      response: aiMessage, // 호환성을 위해 두 필드 모두 제공
    });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);

    // OpenAI API 에러 처리
    if (error.response?.status === 401) {
      return res.status(401).json({
        message: 'OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.',
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      });
    } else if (error.response?.status === 500) {
      return res.status(500).json({
        message: 'OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    res.status(500).json({
      message: error.response?.data?.error?.message || '채팅 메시지 처리 중 오류가 발생했습니다.',
    });
  }
}

module.exports = {
  sendChatMessage,
};

