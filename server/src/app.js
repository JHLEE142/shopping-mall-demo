const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');

function normalizeOrigin(value) {
  if (!value) {
    return '';
  }

  try {
    return new URL(value).origin;
  } catch (error) {
    return value.trim().replace(/\/+$/, '');
  }
}

function createCorsOptions() {
  const allowListEnv = process.env.CORS_ALLOWED_ORIGINS;
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:6500',
    'http://127.0.0.1:6500',
  ];

  const allowList = (allowListEnv ? allowListEnv.split(',') : defaultOrigins)
    .map(normalizeOrigin)
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);
      const isAllowed = allowList.includes(normalized);

      if (isAllowed) {
        callback(null, true);
        return;
      }

      console.warn(`[CORS] Blocked origin: ${origin}. Allowed origins: ${allowList.join(', ')}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  };
}

function createApp() {
  const app = express();

  // IP 주소를 제대로 추출하기 위해 trust proxy 설정
  app.set('trust proxy', true);

  const corsOptions = createCorsOptions();
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '50mb' })); // 1000개 상품 데이터 처리용 제한 증가

  app.use('/api', apiRouter);
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    let message = err.message || 'Internal Server Error';
    
    // 기술적인 에러 메시지를 사용자 친화적인 메시지로 변환
    if (message.includes('E11000') || message.includes('duplicate key')) {
      if (message.includes('email')) {
        message = '이미 사용 중인 이메일입니다.';
      } else if (message.includes('code')) {
        message = '쿠폰 코드가 이미 사용 중입니다. 다른 코드를 사용해주세요.';
      } else {
        message = '이미 사용 중인 정보입니다.';
      }
    } else if (message.includes('ValidationError') || message.includes('validation')) {
      message = '입력 정보를 확인해주세요.';
    } else if (status === 500) {
      // 프로덕션 환경에서는 일반적인 에러 메시지만 표시
      message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', err);
      console.error('Error message:', message);
    }
    
    res.status(status).json({ message });
  });

  return app;
}

module.exports = createApp;

