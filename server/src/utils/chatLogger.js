/**
 * 채팅 시스템 로깅 유틸리티
 * 구조화된 로깅을 제공하여 디버깅 및 모니터링 개선
 */

const ChatConfig = require('../config/chatConfig');

class ChatLogger {
  static log(level, message, data = {}) {
    if (!ChatConfig.LOGGING.ENABLE_DETAILED_LOGS && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] [ERROR] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[${timestamp}] [WARN] ${message}`, data);
        break;
      case 'info':
        console.log(`[${timestamp}] [INFO] ${message}`, data);
        break;
      case 'debug':
        console.log(`[${timestamp}] [DEBUG] ${message}`, data);
        break;
      default:
        console.log(`[${timestamp}] [LOG] ${message}`, data);
    }
  }

  static error(message, error, context = {}) {
    this.log('error', message, {
      ...context,
      error: {
        message: error.message,
        stack: error.stack,
        ...(error.response && { response: error.response.data }),
      },
    });
  }

  static warn(message, context = {}) {
    this.log('warn', message, context);
  }

  static info(message, context = {}) {
    this.log('info', message, context);
  }

  static debug(message, context = {}) {
    this.log('debug', message, context);
  }

  static searchQuery(query, keywords, resultsCount) {
    if (ChatConfig.LOGGING.LOG_SEARCH_QUERIES) {
      this.debug('검색 쿼리 실행', {
        query,
        keywords,
        resultsCount,
      });
    }
  }

  static aiResponse(message, responseTime, tokenCount = null) {
    if (ChatConfig.LOGGING.LOG_AI_RESPONSES) {
      this.debug('AI 응답 생성', {
        messageLength: message.length,
        responseTime: `${responseTime}ms`,
        tokenCount,
      });
    }
  }
}

module.exports = ChatLogger;

