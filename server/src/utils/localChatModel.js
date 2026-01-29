const qaDatabase = require('../data/qaDatabase.json');

/**
 * 키워드 기반 질문 매칭 및 답변 생성
 */
class LocalChatModel {
  constructor() {
    this.qaData = qaDatabase;
    this.categories = this.qaData.categories;
  }

  /**
   * 사용자 메시지에서 키워드 추출
   */
  extractKeywords(message) {
    if (!message || typeof message !== 'string') {
      return [];
    }

    const lowerMessage = message.toLowerCase().trim();
    const words = lowerMessage.split(/\s+/);
    
    // 불필요한 단어 제거
    const stopWords = [
      '해줘', '해주세요', '해봐', '해봐줘', '주세요', '줘', '봐', '봐줘',
      '있어', '있나', '있을까', '있을까요', '있어요', '있나요',
      '어떤', '어떤거', '어떤것', '어떤게',
      'please', 'can you', 'could you',
    ];

    const keywords = words
      .filter(word => word.length >= 2)
      .filter(word => !stopWords.some(stop => word.includes(stop)))
      .slice(0, 10); // 최대 10개

    return keywords;
  }

  /**
   * 질문과 카테고리/질문의 유사도 계산
   */
  calculateSimilarity(userMessage, questionData) {
    const userLower = userMessage.toLowerCase();
    const questionLower = questionData.question.toLowerCase();
    
    let score = 0;

    // 정확한 일치
    if (userLower === questionLower) {
      score += 100;
    }

    // 질문에 포함된 키워드 매칭
    const questionWords = questionLower.split(/\s+/);
    const userWords = userLower.split(/\s+/);
    
    questionWords.forEach(qWord => {
      if (userWords.some(uWord => uWord.includes(qWord) || qWord.includes(uWord))) {
        score += 10;
      }
    });

    // 변형 질문 매칭
    if (questionData.variations) {
      questionData.variations.forEach(variation => {
        const varLower = variation.toLowerCase();
        if (userLower.includes(varLower) || varLower.includes(userLower)) {
          score += 20;
        }
        
        // 단어별 매칭
        const varWords = varLower.split(/\s+/);
        varWords.forEach(vWord => {
          if (userWords.some(uWord => uWord.includes(vWord) || vWord.includes(uWord))) {
            score += 5;
          }
        });
      });
    }

    // 카테고리 키워드 매칭
    const category = this.categories.find(cat => 
      cat.questions.some(q => q.question === questionData.question)
    );
    if (category) {
      category.keywords.forEach(keyword => {
        if (userLower.includes(keyword.toLowerCase())) {
          score += 15;
        }
      });
    }

    return score;
  }

  /**
   * 사용자 메시지에 가장 적합한 답변 찾기
   */
  findBestMatch(userMessage) {
    let bestMatch = null;
    let bestScore = 0;
    let matchedCategory = null;

    // 각 카테고리의 질문들을 검사
    for (const category of this.categories) {
      // 카테고리 키워드로 먼저 필터링
      const hasCategoryKeyword = category.keywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasCategoryKeyword && category.keywords.length > 0) {
        continue; // 카테고리 키워드가 없으면 스킵
      }

      for (const question of category.questions) {
        const score = this.calculateSimilarity(userMessage, question);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = question;
          matchedCategory = category;
        }
      }
    }

    // 최소 점수 이상이어야 매칭
    if (bestScore < 10) {
      return null;
    }

    return {
      question: bestMatch,
      category: matchedCategory,
      score: bestScore,
    };
  }

  /**
   * 상품명 추출 (검색용)
   */
  extractProductName(userMessage) {
    const searchKeywords = [
      '검색', '찾아', '찾아줘', '찾아봐', '찾기', '보여줘', '보여', '알려줘', '알려',
      '추천', '추천해줘', 'search', 'find', 'show', 'recommend'
    ];

    let productName = userMessage;

    // 검색 키워드 제거
    searchKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      productName = productName.replace(regex, '').trim();
    });

    // 불필요한 단어 제거
    const stopWords = [
      '해줘', '해주세요', '해봐', '해봐줘', '주세요', '줘', '봐', '봐줘',
      '있어', '있나', '있을까', '있을까요', '있어요', '있나요',
    ];

    stopWords.forEach(stop => {
      const regex = new RegExp(`\\b${stop}\\b`, 'gi');
      productName = productName.replace(regex, '').trim();
    });

    // 조사 제거
    const particles = ['은', '는', '이', '가', '을', '를', '의', '에', '에서', '와', '과', '도', '로', '으로'];
    particles.forEach(particle => {
      if (productName.endsWith(particle)) {
        productName = productName.slice(0, -particle.length).trim();
      }
    });

    return productName.trim();
  }

  /**
   * 메시지 처리 및 응답 생성
   */
  async processMessage(userMessage, context = {}) {
    const lowerMessage = userMessage.toLowerCase().trim();

    // 1. 로그인/회원가입 요청 처리
    if (lowerMessage.includes('로그인') || lowerMessage.includes('login')) {
      return {
        answer: '로그인 페이지로 이동해드리겠습니다.',
        action: 'navigate',
        params: { page: 'login' },
        confidence: 0.95,
      };
    }

    if (lowerMessage.includes('회원가입') || lowerMessage.includes('가입') || lowerMessage.includes('signup')) {
      return {
        answer: '회원가입 페이지로 이동해드리겠습니다.',
        action: 'navigate',
        params: { page: 'signup' },
        confidence: 0.95,
      };
    }

    // 2. 장바구니 담기 요청 처리
    const addToCartPatterns = [
      /(.+?)\s*(?:장바구니|장바구니에|담아|담아줘|담기|추가|추가해줘)/i,
      /(?:장바구니|장바구니에|담아|담아줘|담기|추가|추가해줘)\s*(.+?)/i,
    ];

    for (const pattern of addToCartPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const productName = match[1].trim();
        return {
          answer: `${productName}을(를) 장바구니에 추가해드리겠습니다.`,
          action: 'addToCart',
          params: { productName },
          confidence: 0.9,
        };
      }
    }

    // 3. 검색 의도 확인
    const searchKeywords = ['검색', '찾아', '찾아줘', '찾아봐', '찾기', '보여줘', '보여', '알려줘', '알려', '추천', '추천해줘', 'search', 'find', 'show', 'recommend'];
    const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));

    if (hasSearchIntent) {
      const productName = this.extractProductName(userMessage);
      if (productName && productName.length >= 2) {
        return {
          answer: `${productName}을(를) 검색해드리겠습니다.`,
          action: 'search',
          params: { query: productName },
          confidence: 0.9,
        };
      }
    }

    // 4. QA 데이터베이스에서 매칭
    const match = this.findBestMatch(userMessage);
    
    if (match && match.question) {
      return {
        answer: match.question.answer,
        action: match.question.action,
        params: match.question.params || {},
        confidence: Math.min(match.score / 100, 0.95),
      };
    }

    // 5. 기본 응답
    return {
      answer: '무엇을 도와드릴까요? 상품 검색, 주문 조회, 배송 추적 등 무엇이든 물어보세요.',
      action: 'answer',
      params: {},
      confidence: 0.5,
    };
  }
}

module.exports = new LocalChatModel();

