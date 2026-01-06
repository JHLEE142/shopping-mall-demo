/**
 * 채팅 시스템 설정
 * 리뷰 문서의 개선 사항을 반영한 설정 관리
 */

const ChatConfig = {
  // 검색 관련 설정
  SEARCH: {
    MAX_RESULTS: 10, // 최대 검색 결과 수
    ATLAS_SEARCH_LIMIT: 10,
    DIRECT_SEARCH_LIMIT: 10,
    HYBRID_SEARCH_LIMIT: 10,
  },

  // 대화 컨텍스트 설정
  CONVERSATION: {
    MAX_HISTORY_MESSAGES: 10, // LLM 컨텍스트에 포함할 최대 메시지 수
    MAX_RECENT_CONVERSATIONS: 5, // 최근 대화 조회 개수
    CONTEXT_WINDOW_SIZE: 5, // 컨텍스트 윈도우 크기
  },

  // AI 모델 설정
  AI: {
    MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 2000,
    TIMEOUT: 30000, // 30초
  },

  // 검색 키워드 추출 설정
  KEYWORD_EXTRACTION: {
    MIN_KEYWORD_LENGTH: 2, // 최소 키워드 길이
    MAX_KEYWORDS: 5, // 최대 키워드 개수
  },

  // 에러 처리 설정
  ERROR: {
    RETRY_ATTEMPTS: 2, // 재시도 횟수
    RETRY_DELAY: 1000, // 재시도 지연 (ms)
  },

  // 로깅 설정
  LOGGING: {
    ENABLE_DETAILED_LOGS: process.env.NODE_ENV !== 'production',
    LOG_SEARCH_QUERIES: true,
    LOG_AI_RESPONSES: false, // 개인정보 보호를 위해 기본값 false
  },
};

module.exports = ChatConfig;

