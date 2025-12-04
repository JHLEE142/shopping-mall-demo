// ShopBuddy Backend Package - Main Entry Point
export { default as connectDB } from './config/database.js';
export * from './models/index.js';
export { default as routes } from './routes/index.js';
export { authenticate, authorize, optionalAuth } from './middleware/auth.js';
export * from './utils/response.js';
export * from './utils/helpers.js';

