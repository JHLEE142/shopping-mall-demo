import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import AIIntent from '../models/AIIntent.js';
import AIActionLog from '../models/AIActionLog.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { generateSessionId, calculatePagination } from '../utils/helpers.js';

// 대화 세션 생성
export const createConversation = async (req, res) => {
  try {
    const sessionId = req.body.sessionId || generateSessionId();
    const userId = req.user?._id || null;

    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        sessionId,
        status: 'active',
        context: {}
      });
    }

    successResponse(res, {
      sessionId: conversation.sessionId,
      conversation
    }, '대화 세션이 생성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// AI 채팅 (메시지 전송)
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user?._id || null,
        sessionId,
        status: 'active'
      });
    }

    // 사용자 메시지 저장
    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: 'user',
      content: message,
      type: 'text'
    });

    // TODO: 실제 AI API 연동 (OpenAI, Claude 등)
    // 여기서는 예시 응답
    const aiResponse = `"${message}"에 대한 AI 응답입니다. 실제로는 AI API를 호출하여 생성합니다.`;
    const intent = 'search_product'; // AI가 파싱한 의도
    const confidence = 0.95;

    // AI 의도 저장
    const aiIntent = await AIIntent.create({
      conversationId: conversation._id,
      messageId: userMessage._id,
      intent,
      confidence,
      entities: {},
      originalText: message
    });

    // AI 응답 메시지 저장
    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: aiResponse,
      type: 'text',
      aiResponse: {
        intent,
        confidence,
        entities: {},
        suggestedActions: ['search', 'recommend']
      }
    });

    // 액션 로그 저장
    await AIActionLog.create({
      conversationId: conversation._id,
      intentId: aiIntent._id,
      action: 'respond',
      actionType: 'query',
      result: {
        success: true
      },
      performance: {
        responseTime: 500,
        tokensUsed: 100,
        model: 'gpt-4'
      }
    });

    // 대화 세션 업데이트
    conversation.lastActivityAt = new Date();
    await conversation.save();

    successResponse(res, {
      response: aiResponse,
      intent,
      actions: ['search', 'recommend'],
      products: [],
      metadata: {
        messageId: assistantMessage._id,
        confidence
      }
    }, 'AI 응답 생성 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 검색 (AI 기반)
export const searchProducts = async (req, res) => {
  try {
    const { query, filters, preferences } = req.body;

    // TODO: 자연어 쿼리 파싱 및 필터링
    const searchQuery = {
      status: 'active',
      $text: { $search: query }
    };

    // 필터 적용
    if (filters?.categoryId) searchQuery.categoryId = filters.categoryId;
    if (filters?.minPrice) searchQuery.basePrice = { $gte: filters.minPrice };
    if (filters?.maxPrice) {
      searchQuery.basePrice = { ...searchQuery.basePrice, $lte: filters.maxPrice };
    }

    const products = await Product.find(searchQuery)
      .populate('categoryId', 'name')
      .populate('sellerId', 'businessName')
      .sort({ aiRecommendationScore: -1, createdAt: -1 })
      .limit(20);

    successResponse(res, {
      products,
      total: products.length,
      suggestions: []
    }, '상품 검색 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 비교
export const compareProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    const products = await Product.find({ _id: { $in: productIds } })
      .populate('categoryId', 'name')
      .populate('sellerId', 'businessName');

    if (products.length < 2) {
      return errorResponse(res, '비교할 상품이 2개 이상 필요합니다.', 400);
    }

    // 비교 정보 생성
    const differences = [];
    const comparison = {
      products,
      differences,
      recommendation: '가성비를 고려하면 첫 번째 상품을 추천합니다.'
    };

    successResponse(res, { comparison }, '상품 비교 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 추천
export const recommendProducts = async (req, res) => {
  try {
    const { productId, context, preferences } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 유사 상품 추천 (간단화)
    const recommendations = await Product.find({
      categoryId: product.categoryId,
      _id: { $ne: productId },
      status: 'active'
    })
      .populate('categoryId', 'name')
      .sort({ aiRecommendationScore: -1 })
      .limit(5);

    successResponse(res, {
      recommendations,
      reason: '같은 카테고리의 인기 상품입니다.'
    }, '상품 추천 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 요약 (AI 생성)
export const generateProductSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // TODO: 실제 AI를 사용하여 요약 생성
    const summary = `${product.name}에 대한 AI 생성 요약입니다.`;
    const highlights = ['주요 특징 1', '주요 특징 2', '주요 특징 3'];
    const pros = ['장점 1', '장점 2'];
    const cons = ['단점 1'];

    successResponse(res, {
      summary,
      highlights,
      pros,
      cons
    }, '상품 요약 생성 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 대화 히스토리 조회
export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return errorResponse(res, '대화 세션을 찾을 수 없습니다.', 404);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversationId: conversation._id });
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { messages }, pagination, '대화 히스토리 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 대화 세션 종료
export const endConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return errorResponse(res, '대화 세션을 찾을 수 없습니다.', 404);
    }

    conversation.status = 'completed';
    conversation.endedAt = new Date();
    await conversation.save();

    successResponse(res, { conversation }, '대화 세션이 종료되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

