const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);

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

