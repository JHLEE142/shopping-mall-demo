const axios = require('axios');
const { getSystemPrompt } = require('../prompts/assistantPrompt');
const { hybridSearch } = require('./searchController');

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
    // 환경 변수에서 API 키 가져오기 (우선순위: .env 파일)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        message: 'OpenAI API 키가 서버에 설정되지 않았습니다. 서버 관리자에게 문의하세요.',
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: '메시지가 필요합니다.',
      });
    }

    // 상황별 시스템 프롬프트 생성
    const systemPrompt = getSystemPrompt(isLoggedIn, currentView);

    // 사용자 메시지에서 검색 의도 파악
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const searchKeywords = extractSearchKeywords(lastUserMessage);
    
    // 검색 의도가 있으면 내부 검색 API 호출
    let searchResults = [];
    if (searchKeywords && searchKeywords.length > 0) {
      try {
        const searchQuery = searchKeywords.join(' ');
        console.log('[Chat] 내부 검색 실행:', searchQuery);
        const searchResultsData = await hybridSearch(searchQuery, 10);
        searchResults = searchResultsData.map(result => ({
          id: result.product._id.toString(),
          name: result.product.name,
          price: result.product.priceSale || result.product.price,
          image: result.product.image || result.product.gallery?.[0] || '',
          description: result.product.description || '',
          score: result.score,
        }));
        console.log('[Chat] 검색 결과:', searchResults.length, '개');
      } catch (searchError) {
        console.error('[Chat] 검색 오류:', searchError);
      }
    }

    // 검색 결과를 시스템 프롬프트에 추가
    let enhancedSystemPrompt = systemPrompt;
    if (searchResults.length > 0) {
      enhancedSystemPrompt += `\n\n## 현재 검색 결과 (내부 검색 API에서 가져온 상품들):\n${JSON.stringify(searchResults, null, 2)}\n\n**중요**: 검색 결과가 이미 제공되었으므로 "잠시만 기다려 주세요", "검색 중입니다", "찾는 중입니다" 같은 대기 메시지를 절대 사용하지 마세요. 바로 검색 결과를 바탕으로 추천 설명과 함께 **PRODUCT_CARDS** 형식으로 응답하세요.`;
    } else if (searchKeywords && searchKeywords.length > 0) {
      // 검색 의도가 있지만 결과가 없는 경우
      enhancedSystemPrompt += `\n\n**중요**: 검색을 수행했지만 결과가 없습니다. "잠시만 기다려 주세요" 같은 메시지 없이 바로 결과가 없다는 것을 알려주고, 다른 검색어를 제안하세요.`;
    }

    // OpenAI API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000, // 상품 카드 정보를 포함하기 위해 증가
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

    // PRODUCT_CARDS 파싱
    let productCards = null;
    const productCardsMatch = aiMessage.match(/\*\*PRODUCT_CARDS\*\*:\s*(\[.*?\])/s);
    if (productCardsMatch) {
      try {
        productCards = JSON.parse(productCardsMatch[1]);
        // PRODUCT_CARDS 부분을 응답에서 제거 (텍스트만 남김)
        aiMessage = aiMessage.replace(/\*\*PRODUCT_CARDS\*\*:\s*\[.*?\]/s, '').trim();
      } catch (parseError) {
        console.error('[Chat] PRODUCT_CARDS 파싱 오류:', parseError);
      }
    } else if (searchResults.length > 0) {
      // AI가 PRODUCT_CARDS 형식으로 응답하지 않았지만 검색 결과가 있으면 직접 사용
      productCards = searchResults;
    }

    // 응답에서 역할/함수 설명 제거
    aiMessage = cleanAIResponse(aiMessage);

    res.json({
      message: aiMessage,
      response: aiMessage, // 호환성을 위해 두 필드 모두 제공
      productCards: productCards, // 상품 카드 데이터
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

/**
 * 사용자 메시지에서 검색 키워드 추출
 */
function extractSearchKeywords(message) {
  if (!message || typeof message !== 'string') {
    return [];
  }

  const lowerMessage = message.toLowerCase();
  
  // 검색 의도 키워드
  const searchKeywords = [
    '검색', '찾아', '추천', '보여줘', '보여', '알려줘', '알려',
    'search', 'find', 'recommend', 'show', 'tell',
  ];

  // 검색 의도가 있는지 확인
  const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!hasSearchIntent) {
    return [];
  }

  // 상품명 추출 (한글, 영문, 숫자 조합)
  const productNamePatterns = [
    /(?:검색|찾아|추천|보여줘|보여|알려줘|알려|search|find|recommend|show|tell)[\s:]*([가-힣a-zA-Z0-9\s]+)/i,
    /([가-힣a-zA-Z0-9\s]{2,})/,
  ];

  for (const pattern of productNamePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const keywords = match[1].trim().split(/\s+/).filter(k => k.length > 0);
      if (keywords.length > 0) {
        return keywords;
      }
    }
  }

  return [];
}

module.exports = {
  sendChatMessage,
};

