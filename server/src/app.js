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

  const corsOptions = createCorsOptions();
  app.use(cors(corsOptions));
  app.use(express.json());

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
    const message = err.message || 'Internal Server Error';
    if (process.env.NODE_ENV !== 'production') {
      console.error(err);
    }
    res.status(status).json({ message });
  });

  return app;
}

module.exports = createApp;

