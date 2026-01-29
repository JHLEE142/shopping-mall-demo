const axios = require('axios');
const { getSystemPrompt } = require('../prompts/assistantPrompt');
const { hybridSearch } = require('./searchController');
const { atlasMultiFieldSearch } = require('../utils/atlasSearch');
const Product = require('../models/product');
const Conversation = require('../models/conversation');
const ChatConfig = require('../config/chatConfig');
const ChatLogger = require('../utils/chatLogger');
const { randomUUID } = require('crypto');
const { generateSearchQueries, expandSynonyms } = require('../utils/searchExpander');
const localChatModel = require('../utils/localChatModel');
const Cart = require('../models/cart');


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
 * 대화 컨텍스트 조회 또는 생성
 */
async function getOrCreateConversation(userId, conversationId) {
  try {
    if (!conversationId) {
      conversationId = randomUUID();
    }

    let conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      conversation = new Conversation({
        userId: userId || null,
        conversationId,
        messages: [],
        metadata: {},
      });
      await conversation.save();
      ChatLogger.debug('새 대화 생성', { conversationId, userId });
    }

    return conversation;
  } catch (error) {
    ChatLogger.error('대화 조회/생성 오류', error, { userId, conversationId });
    return null;
  }
}

/**
 * 대화 히스토리에서 컨텍스트 메시지 추출
 */
function buildConversationContext(conversation, maxMessages = ChatConfig.CONVERSATION.CONTEXT_WINDOW_SIZE) {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return [];
  }

  const recentMessages = conversation.messages.slice(-maxMessages);
  return recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * OpenAI API를 통해 채팅 메시지 처리
 * 리뷰 문서의 개선 사항 반영:
 * - 대화 컨텍스트 관리
 * - 설정 파일 사용
 * - 구조화된 로깅
 * - 개선된 에러 처리
 */
async function sendChatMessage(req, res) {
  const startTime = Date.now();
  let conversation = null;
  
  try {
    const { messages, isLoggedIn, currentView, conversationId, userId } = req.body;
    
    // 입력 검증
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      ChatLogger.warn('메시지 검증 실패', { messages });
      return res.status(400).json({
        message: '메시지가 필요합니다.',
      });
    }

    // 로컬 모델 사용 (OpenAI API 대신)
    // API 키 검증은 더 이상 필요 없음

    // 대화 컨텍스트 관리
    conversation = await getOrCreateConversation(userId, conversationId);
    const conversationHistory = conversation 
      ? buildConversationContext(conversation, ChatConfig.CONVERSATION.MAX_HISTORY_MESSAGES)
      : [];

    // 마지막 사용자 메시지 저장
    const lastUserMessage = messages[messages.length - 1];
    if (conversation && lastUserMessage) {
      await conversation.addMessage('user', lastUserMessage.content || lastUserMessage.text, {
        timestamp: new Date(),
      });
    }

    // 상황별 시스템 프롬프트 생성
    const systemPrompt = getSystemPrompt(isLoggedIn, currentView);

    // 사용자 메시지에서 검색 키워드 추출 (검색 의도가 있거나 상품명이 추출되면 검색 실행)

    const lastUserMessageText = lastUserMessage?.content || lastUserMessage?.text || '';
    const searchKeywords = extractSearchKeywords(lastUserMessageText);
    
    ChatLogger.searchQuery(lastUserMessageText, searchKeywords, 0);

    // 검색 키워드가 있으면 직접 데이터베이스 검색 + hybridSearch 병행
    let searchResults = [];
    let totalSearchResults = 0;
    let searchPage = 1;
    let searchLimit = 40;
    let totalSearchPages = 1;
    
    if (searchKeywords && searchKeywords.length > 0) {
      try {
        const searchQuery = searchKeywords.join(' ');
        
        // 페이지네이션 파라미터 파싱
        searchPage = parseInt(req.body.page) || 1;
        searchLimit = parseInt(req.body.searchLimit) || 40;
        searchPage = Math.max(1, searchPage);
        searchLimit = Math.min(searchLimit, 1000); // 최대 1000개

        ChatLogger.debug('검색 실행 시작', { searchQuery, keywords: searchKeywords, page: searchPage, limit: searchLimit });
        
        // 전체 상품 개수 조회 (최대 검색 결과 수 결정)
        const totalProductsCount = await Product.countDocuments();
        const maxResults = Math.min(ChatConfig.SEARCH.MAX_RESULTS || 100, totalProductsCount);
        
        // 방법 1: MongoDB Atlas Search (최우선, 가장 빠르고 정확)
        let atlasSearchResults = [];
        try {
          const atlasResultsData = await atlasMultiFieldSearch(searchQuery, maxResults);
          atlasSearchResults = atlasResultsData.map(result => ({
            id: result.product._id.toString(),
            name: result.product.name,
            price: result.product.priceSale || result.product.price,
            image: result.product.image || result.product.gallery?.[0] || '',
            description: result.product.description || '',
            score: result.score || 0,
          }));
          ChatLogger.debug('Atlas Search 완료', { count: atlasSearchResults.length });
        } catch (atlasError) {
          ChatLogger.warn('Atlas Search 실패', { error: atlasError.message });
        }
        
        // 방법 2: 직접 MongoDB 검색 (간단하고 확실한 방법)
        const directSearchResults = await directProductSearch(
          searchQuery, 
          Math.min(ChatConfig.SEARCH.DIRECT_SEARCH_LIMIT || 50, maxResults)
        );
        ChatLogger.debug('직접 DB 검색 완료', { count: directSearchResults.length });
        
        // 방법 3: Hybrid 검색 (더 정교한 검색)
        let hybridSearchResults = [];
        try {
          const searchResultsData = await hybridSearch(
            searchQuery, 
            Math.min(ChatConfig.SEARCH.HYBRID_SEARCH_LIMIT || 50, maxResults)
          );
          hybridSearchResults = searchResultsData.map(result => ({
            id: result.product._id.toString(),
            name: result.product.name,
            price: result.product.priceSale || result.product.price,
            image: result.product.image || result.product.gallery?.[0] || '',
            description: result.product.description || '',
            score: result.score || result.finalScore || 0,
          }));
          ChatLogger.debug('Hybrid 검색 완료', { count: hybridSearchResults.length });
        } catch (hybridError) {
          ChatLogger.error('Hybrid 검색 오류', hybridError);
        }
        
        // 세 검색 결과를 합치고 중복 제거 (Atlas Search 우선)
        const allResults = [...atlasSearchResults, ...directSearchResults, ...hybridSearchResults];
        const uniqueResults = new Map();
        
        allResults.forEach(result => {
          const id = result.id;
          if (!uniqueResults.has(id)) {
            uniqueResults.set(id, result);
          } else {
            // 이미 있는 경우 더 높은 점수로 업데이트
            const existing = uniqueResults.get(id);
            if (result.score > existing.score) {
              uniqueResults.set(id, result);
            }
          }
        });
        
        // 전체 검색 결과
        const sortedResults = Array.from(uniqueResults.values())
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        
        totalSearchResults = sortedResults.length;
        totalSearchPages = Math.ceil(totalSearchResults / searchLimit);
        
        // 페이지네이션 적용
        const startIndex = (searchPage - 1) * searchLimit;
        const endIndex = startIndex + searchLimit;
        searchResults = sortedResults.slice(startIndex, endIndex);
        
        ChatLogger.searchQuery(searchQuery, searchKeywords, totalSearchResults);
      } catch (searchError) {
        ChatLogger.error('검색 오류', searchError, { searchQuery });
      }
    }

    // 검색 결과가 있으면 바로 상품 카드로 반환 (AI 응답 없이)
    // "찾아보겠습니다" 같은 메시지 없이 바로 결과 표시
    if (searchResults.length > 0) {
      const searchQuery = searchKeywords.join(' ');
      const responseMessage = totalSearchResults > searchLimit 
        ? `검색 결과 총 ${totalSearchResults}개 중 ${(searchPage - 1) * searchLimit + 1}-${Math.min(searchPage * searchLimit, totalSearchResults)}번째를 표시합니다. 어떤 제품이 마음에 드세요?`
        : `검색 결과 ${totalSearchResults}개를 찾았습니다. 어떤 제품이 마음에 드세요?`;
      
      ChatLogger.info('검색 결과 즉시 반환', { 
        resultsCount: searchResults.length,
        searchQuery,
        conversationId: conversation?.conversationId 
      });
      
      // 대화 히스토리에 저장
      if (conversation) {
        await conversation.addMessage('assistant', responseMessage, {
          productCards: searchResults.length,
          searchQuery,
        });
      }
      
      return res.json({
        message: responseMessage,
        response: responseMessage,
        productCards: searchResults,
        conversationId: conversation?.conversationId,
        pagination: {
          page: searchPage,
          limit: searchLimit,
          total: totalSearchResults,
          totalPages: totalSearchPages,
          hasMore: searchPage < totalSearchPages,
        },
      });
    }

    // 로컬 모델을 사용하여 응답 생성
    const localModelResponse = await localChatModel.processMessage(lastUserMessageText, {
      isLoggedIn,
      currentView,
      userId,
    });

    let aiMessage = localModelResponse.answer;
    const action = localModelResponse.action;
    const actionParams = localModelResponse.params || {};

    // 액션 처리
    if (action === 'navigate') {
      // 로그인/회원가입 페이지 이동
      if (actionParams.page === 'login') {
        return res.json({
          message: '로그인 페이지로 이동해드리겠습니다.',
          response: '로그인 페이지로 이동해드리겠습니다.',
          action: 'navigate',
          actionParams: { page: 'login' },
          conversationId: conversation?.conversationId,
        });
      } else if (actionParams.page === 'signup') {
        return res.json({
          message: '회원가입 페이지로 이동해드리겠습니다.',
          response: '회원가입 페이지로 이동해드리겠습니다.',
          action: 'navigate',
          actionParams: { page: 'signup' },
          conversationId: conversation?.conversationId,
        });
      }
    } else if (action === 'addToCart') {
      // 장바구니 담기
      if (!isLoggedIn || !req.user) {
        return res.json({
          message: '장바구니 기능은 로그인 후 이용 가능합니다. 로그인 페이지로 이동하시겠어요?',
          response: '장바구니 기능은 로그인 후 이용 가능합니다. 로그인 페이지로 이동하시겠어요?',
          action: 'navigate',
          actionParams: { page: 'login' },
          conversationId: conversation?.conversationId,
        });
      }

      // 상품명으로 상품 찾기
      let product = null;
      if (actionParams.productName) {
        product = await Product.findOne({
          name: { $regex: actionParams.productName, $options: 'i' }
        });
      } else if (actionParams.productId) {
        product = await Product.findById(actionParams.productId);
      }

      if (!product) {
        return res.json({
          message: '상품을 찾을 수 없습니다. 상품명을 정확히 알려주세요.',
          response: '상품을 찾을 수 없습니다. 상품명을 정확히 알려주세요.',
          conversationId: conversation?.conversationId,
        });
      }

      // 장바구니에 추가
      try {
        let cart = await Cart.findOne({ user: req.user._id, status: 'active' });
        if (!cart) {
          cart = new Cart({
            user: req.user._id,
            items: [],
            status: 'active',
          });
        }

        const existingItem = cart.items.find(
          item => item.product.toString() === product._id.toString()
        );

        if (existingItem) {
          existingItem.quantity += (actionParams.quantity || 1);
        } else {
          cart.items.push({
            product: product._id,
            quantity: actionParams.quantity || 1,
            priceSnapshot: product.priceSale || product.price,
            selectedOptions: actionParams.selectedOptions || {},
          });
        }

        cart.summary.subtotal = cart.items.reduce(
          (sum, item) => sum + item.quantity * item.priceSnapshot,
          0
        );

        await cart.save();

        aiMessage = `${product.name}을(를) 장바구니에 추가했습니다.`;
      } catch (error) {
        ChatLogger.error('장바구니 추가 오류', error);
        aiMessage = '장바구니 추가 중 오류가 발생했습니다.';
      }
    }

    // 검색 결과가 있으면 상품 카드로 표시
    let productCards = null;
    if (searchResults.length > 0) {
      productCards = searchResults;
    } else if (action === 'search' && actionParams.query) {
      // 검색 액션이 있지만 결과가 없는 경우, 다시 검색 시도
      const searchQuery = actionParams.query;
      try {
        const searchResultsData = await atlasMultiFieldSearch(searchQuery, 40);
        productCards = searchResultsData.map(result => ({
          id: result.product._id.toString(),
          name: result.product.name,
          price: result.product.priceSale || result.product.price,
          image: result.product.image || result.product.gallery?.[0] || '',
          description: result.product.description || '',
          score: result.score || 0,
        }));
      } catch (error) {
        ChatLogger.error('검색 오류', error);
      }
    }

    // 대화 히스토리에 저장
    if (conversation) {
      await conversation.addMessage('assistant', aiMessage, {
        productCards: productCards ? productCards.length : 0,
        hasProductCards: !!productCards,
      });
    }

    const responseTime = Date.now() - startTime;
    ChatLogger.info('채팅 응답 완료', { 
      responseTime: `${responseTime}ms`,
      conversationId: conversation?.conversationId,
      hasProductCards: !!productCards 
    });

    res.json({
      message: aiMessage,
      response: aiMessage, // 호환성을 위해 두 필드 모두 제공
      productCards: productCards, // 상품 카드 데이터
      conversationId: conversation?.conversationId,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    ChatLogger.error('채팅 메시지 처리 오류', error, {
      responseTime: `${responseTime}ms`,
      conversationId: conversation?.conversationId,
    });

    // 에러 처리
    res.status(500).json({
      message: error.message || '채팅 메시지 처리 중 오류가 발생했습니다.',
      conversationId: conversation?.conversationId,
    });
  }
}

/**
 * 직접 MongoDB에서 상품 검색 (간단하고 확실한 방법)
 * 유사어, 오타, 동의어 등 모든 케이스 처리
 */
async function directProductSearch(query, limit = 10) {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length === 0) {
      return [];
    }

    const allResults = new Map();
    const mongoose = require('mongoose');

    // 검색 쿼리 확장 (유사어, 오타 변형 포함)
    const searchQueries = generateSearchQueries(trimmedQuery);
    console.log('[Chat] 확장된 검색 쿼리:', searchQueries.map(q => q.query).join(', '));

    // 방법 1: 원본 및 확장된 검색어로 검색 (가중치 적용)
    for (const searchQuery of searchQueries) {
      try {
        const searchRegex = new RegExp(searchQuery.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        
        const excludeIds = Array.from(allResults.keys()).map(id => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch (e) {
            return null;
          }
        }).filter(id => id !== null);

        const products = await Product.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
          ],
          ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
        })
        .limit(limit * 2)
        .lean();

        products.forEach(product => {
          const id = product._id.toString();
          if (!allResults.has(id)) {
            allResults.set(id, {
              id: id,
              name: product.name,
              price: product.priceSale || product.price,
              image: product.image || product.gallery?.[0] || '',
              description: product.description || '',
              score: searchQuery.weight, // 확장 쿼리 가중치 적용
            });
          } else {
            // 이미 있는 경우 더 높은 점수로 업데이트
            const existing = allResults.get(id);
            if (searchQuery.weight > existing.score) {
              existing.score = searchQuery.weight;
            }
          }
        });
        
        if (searchQuery.type === 'original') {
          console.log('[Chat] 전체 검색어 매칭:', products.length, '개');
        } else if (searchQuery.type === 'synonym') {
          console.log(`[Chat] 유사어 검색 (${searchQuery.query}):`, products.length, '개');
        } else if (searchQuery.type === 'typo') {
          console.log(`[Chat] 오타 변형 검색 (${searchQuery.query}):`, products.length, '개');
        }
      } catch (error1) {
        console.error(`[Chat] 검색 오류 (${searchQuery.query}):`, error1);
      }
      
      // 충분한 결과가 있으면 중단
      if (allResults.size >= limit * 2) {
        break;
      }
    }

    // 방법 2: 단어별 검색 (확장된 단어 사용)
    if (allResults.size < limit) {
      const words = trimmedQuery.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 1) {
        try {
          // 각 단어의 유사어 확장
          const expandedWordQueries = words.map(word => {
            const synonyms = expandSynonyms(word);
            return synonyms.map(syn => ({
              $or: [
                { name: { $regex: syn, $options: 'i' } },
                { description: { $regex: syn, $options: 'i' } },
              ]
            }));
          });

          // 각 단어별로 OR 조건 생성
          const wordQueries = expandedWordQueries.map(wordOrs => ({
            $or: wordOrs
          }));

          const excludeIds = Array.from(allResults.keys()).map(id => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch (e) {
              return null;
            }
          }).filter(id => id !== null);

          const products2 = await Product.find({
            $and: wordQueries, // 모든 단어가 포함된 상품
            ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
          })
          .limit(limit * 2)
          .lean();

          products2.forEach(product => {
            const id = product._id.toString();
            if (!allResults.has(id)) {
              allResults.set(id, {
                id: id,
                name: product.name,
                price: product.priceSale || product.price,
                image: product.image || product.gallery?.[0] || '',
                description: product.description || '',
                score: 0.85, // 확장된 단어별 매칭은 높은 점수
              });
            } else {
              const existing = allResults.get(id);
              if (0.85 > existing.score) {
                existing.score = 0.85;
              }
            }
          });
          console.log('[Chat] 확장된 단어별 검색 매칭:', products2.length, '개');
        } catch (error2) {
          console.error('[Chat] 확장된 단어별 검색 오류:', error2);
        }
      }
    }

    // 방법 3: 부분 매칭 (검색어의 일부만 포함되어도 찾기)
    if (allResults.size < limit && trimmedQuery.length >= 2) {
      try {
        // 검색어의 첫 2글자 이상으로 검색
        const partialQuery = trimmedQuery.substring(0, Math.max(2, trimmedQuery.length - 1));
        const partialRegex = new RegExp(partialQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        
        const excludeIds = Array.from(allResults.keys()).map(id => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch (e) {
            return null;
          }
        }).filter(id => id !== null);
        
        const products3 = await Product.find({
          $or: [
            { name: partialRegex },
            { description: partialRegex },
          ],
          ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
        })
        .limit(limit - allResults.size)
        .lean();

        products3.forEach(product => {
          const id = product._id.toString();
          if (!allResults.has(id)) {
            allResults.set(id, {
              id: id,
              name: product.name,
              price: product.priceSale || product.price,
              image: product.image || product.gallery?.[0] || '',
              description: product.description || '',
              score: 0.7, // 부분 매칭은 중간 점수
            });
          }
        });
        console.log('[Chat] 부분 매칭 검색:', products3.length, '개');
      } catch (error3) {
        console.error('[Chat] 부분 매칭 검색 오류:', error3);
      }
    }

    // 점수 순으로 정렬하고 limit만큼 반환
    const results = Array.from(allResults.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    console.log('[Chat] 직접 DB 검색 최종 결과:', results.length, '개');
    return results;
  } catch (error) {
    console.error('[Chat] 직접 DB 검색 오류:', error);
    return [];
  }
}

/**
 * 한국어 조사 및 동사 어미 제거 (명사만 추출)
 * @param {string} text - 처리할 텍스트
 * @returns {string} - 조사와 어미가 제거된 텍스트
 */
function removeKoreanParticlesAndEndings(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let cleaned = text.trim();

  // 동사 어미 패턴 제거 (찾고, 찾아, 찾아줘 등)
  const verbEndingPatterns = [
    /\s*(?:찾고|찾아|찾아줘|찾아봐|찾아주세요|찾아봐줘|찾아서)\s*/g,
    /\s*(?:보고|보아|보아줘|보아봐|보아주세요)\s*/g,
    /\s*(?:알고|알아|알아줘|알아봐|알아주세요)\s*/g,
    /\s*(?:하고|하여|해줘|해봐|해주세요|해서)\s*/g,
  ];

  verbEndingPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });

  // 단어별로 처리 (조사는 단어 끝에만 붙음)
  const words = cleaned.split(/\s+/);
  const cleanedWords = words.map(word => {
    if (!word || word.length < 2) {
      return word;
    }

    // 한국어 조사 (단어 끝에 붙는 조사만 제거)
    // 받침이 있는 경우: 은, 을, 의, 에서, 와, 과, 로
    // 받침이 없는 경우: 는, 를, 에, 에서, 와, 과, 도, 로
    const koreanParticles = [
      /은$/, /는$/, /이$/, /가$/, /을$/, /를$/, /의$/, 
      /에$/, /에서$/, /와$/, /과$/, /도$/, /로$/, /으로$/,
    ];

    let cleanedWord = word;
    koreanParticles.forEach(particle => {
      cleanedWord = cleanedWord.replace(particle, '');
    });

    return cleanedWord;
  }).filter(word => word && word.length > 0);

  // 공백 정리
  cleaned = cleanedWords.join(' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * 사용자 메시지에서 검색 키워드 추출
 * 검색 의도가 있거나 상품명이 추출되면 검색 실행
 * 조사와 동사 어미를 제거하고 명사만 추출
 */
function extractSearchKeywords(message) {
  if (!message || typeof message !== 'string') {
    return [];
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return [];
  }

  const lowerMessage = trimmedMessage.toLowerCase();
  
  // 검색 의도 키워드 (제거할 키워드)
  const searchIntentKeywords = [
    '검색', '찾아', '찾아줘', '찾아주세요', '찾아봐', '찾아봐줘',
    '추천', '추천해줘', '추천해주세요',
    '보여줘', '보여주세요', '보여', '보여봐', '보여봐줘',
    '알려줘', '알려주세요', '알려', '알려봐', '알려봐줘',
    '있어', '있나', '있을까', '있을까요', '있어요', '있나요',
    'search', 'find', 'recommend', 'show', 'tell', 'have', 'got',
  ];

  // 제거할 불필요한 단어들
  const stopWords = [
    '해줘', '해주세요', '해봐', '해봐줘', '주세요', '줘', '봐', '봐줘',
    '있어', '있나', '있을까', '있을까요', '있어요', '있나요',
    '어떤', '어떤거', '어떤것', '어떤게', '어떤게', '어떤거야',
    '찾고', '찾아', '찾아줘', '찾아봐', '찾아주세요',
    '보고', '보아', '보아줘', '보아봐',
    '알고', '알아', '알아줘', '알아봐',
    'please', 'please', 'can you', 'could you',
  ];

  // 1. 검색 의도가 있는지 확인
  const hasSearchIntent = searchIntentKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // 2. 상품명 추출 시도
  let extractedKeywords = [];

  // 방법 1: 검색 의도 키워드 앞/뒤의 텍스트 추출
  if (hasSearchIntent) {
    // 패턴 1: [상품명] + [검색의도키워드] (예: "프라이팬 찾아줘")
    const beforePattern = /([가-힣a-zA-Z0-9\s]{2,})\s*(?:검색|찾아|찾아줘|찾아주세요|찾아봐|찾아봐줘|추천|추천해줘|추천해주세요|보여줘|보여주세요|보여|보여봐|보여봐줘|알려줘|알려주세요|알려|알려봐|알려봐줘)/i;
    const beforeMatch = trimmedMessage.match(beforePattern);
    if (beforeMatch && beforeMatch[1]) {
      let productName = beforeMatch[1].trim();
      // 조사와 동사 어미 제거
      productName = removeKoreanParticlesAndEndings(productName);
      // 불필요한 단어 제거
      stopWords.forEach(stopWord => {
        const regex = new RegExp(`\\b${stopWord}\\b`, 'gi');
        productName = productName.replace(regex, '').trim();
      });
      if (productName.length >= 2) {
        extractedKeywords = productName.split(/\s+/).filter(k => k.length >= 2);
        if (extractedKeywords.length > 0) {
          console.log('[Chat] 방법1-앞 패턴 매칭:', extractedKeywords);
        }
      }
    }

    // 패턴 2: [검색의도키워드] + [상품명] (예: "찾아줘 프라이팬")
    if (extractedKeywords.length === 0) {
      const afterPattern = /(?:검색|찾아|찾아줘|찾아주세요|찾아봐|찾아봐줘|추천|추천해줘|추천해주세요|보여줘|보여주세요|보여|보여봐|보여봐줘|알려줘|알려주세요|알려|알려봐|알려봐줘|있어|있나|있을까|있을까요|있어요|있나요)[\s:]*([가-힣a-zA-Z0-9\s]{2,})/i;
      const afterMatch = trimmedMessage.match(afterPattern);
      if (afterMatch && afterMatch[1]) {
        let productName = afterMatch[1].trim();
        // 조사와 동사 어미 제거
        productName = removeKoreanParticlesAndEndings(productName);
        // 불필요한 단어 제거
        stopWords.forEach(stopWord => {
          const regex = new RegExp(`\\b${stopWord}\\b`, 'gi');
          productName = productName.replace(regex, '').trim();
        });
        if (productName.length >= 2) {
          extractedKeywords = productName.split(/\s+/).filter(k => k.length >= 2);
          if (extractedKeywords.length > 0) {
            console.log('[Chat] 방법1-뒤 패턴 매칭:', extractedKeywords);
          }
        }
      }
    }

    // 패턴 3: 영어 검색 의도 키워드
    if (extractedKeywords.length === 0) {
      const englishPattern = /(?:search|find|recommend|show|tell|have|got)[\s:]*([가-힣a-zA-Z0-9\s]{2,})/i;
      const englishMatch = trimmedMessage.match(englishPattern);
      if (englishMatch && englishMatch[1]) {
        let productName = englishMatch[1].trim();
        productName = removeKoreanParticlesAndEndings(productName);
        stopWords.forEach(stopWord => {
          const regex = new RegExp(`\\b${stopWord}\\b`, 'gi');
          productName = productName.replace(regex, '').trim();
        });
        if (productName.length >= 2) {
          extractedKeywords = productName.split(/\s+/).filter(k => k.length >= 2);
          if (extractedKeywords.length > 0) {
            console.log('[Chat] 방법1-영어 패턴 매칭:', extractedKeywords);
          }
        }
      }
    }
  }

  // 방법 2: 검색 의도가 없어도 상품명으로 보이는 텍스트 추출 (2글자 이상)
  if (extractedKeywords.length === 0) {
    // 한글, 영문, 숫자 조합으로 2글자 이상인 단어 추출
    const productNamePattern = /([가-힣a-zA-Z0-9]{2,})/g;
    const matches = trimmedMessage.match(productNamePattern);
    if (matches && matches.length > 0) {
      // 불필요한 단어 필터링 및 조사 제거
      extractedKeywords = matches
        .map(word => removeKoreanParticlesAndEndings(word))
        .filter(word => {
          const lowerWord = word.toLowerCase();
          return word.length >= 2 && 
                 !stopWords.some(stopWord => lowerWord.includes(stopWord)) &&
                 !searchIntentKeywords.some(intent => lowerWord.includes(intent));
        })
        .slice(0, 5); // 최대 5개 단어만
    }
  }

  // 방법 3: 질문 형태에서 상품명 추출 ("프라이팬 있을까?" -> "프라이팬", "냄비는?" -> "냄비")
  if (extractedKeywords.length === 0) {
    const questionPattern = /([가-힣a-zA-Z0-9]{2,})\s*(?:있어|있나|있을까|있을까요|있어요|있나요|\?|있니|있어요|은|는|이|가|을|를)/i;
    const match = trimmedMessage.match(questionPattern);
    if (match && match[1]) {
      let keyword = match[1].trim();
      // 조사와 동사 어미 제거
      keyword = removeKoreanParticlesAndEndings(keyword);
      if (keyword.length >= 2) {
        extractedKeywords = [keyword];
      }
    }
  }

  // 최종 키워드 정리 (조사와 어미 제거, 불필요한 단어 필터링)
  if (extractedKeywords.length > 0) {
    extractedKeywords = extractedKeywords
      .map(k => {
        // 조사와 동사 어미 제거
        let cleaned = removeKoreanParticlesAndEndings(k.trim());
        // 불필요한 단어 제거
        stopWords.forEach(stopWord => {
          const regex = new RegExp(`\\b${stopWord}\\b`, 'gi');
          cleaned = cleaned.replace(regex, '').trim();
        });
        return cleaned;
      })
      .filter(k => {
        const lowerK = k.toLowerCase();
        return k.length >= 2 && 
               !stopWords.some(sw => lowerK.includes(sw)) &&
               !searchIntentKeywords.some(si => lowerK === si || lowerK.includes(si));
      });
  }

  console.log('[Chat] 추출된 키워드:', extractedKeywords);
  return extractedKeywords;
}

module.exports = {
  sendChatMessage,
};

