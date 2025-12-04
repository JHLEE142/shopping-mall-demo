import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import sellerApplicationRoutes from './seller-applications.js';
import sellerRoutes from './sellers.js';
import categoryRoutes from './categories.js';
import productRoutes from './products.js';
import cartRoutes from './carts.js';
import orderRoutes from './orders.js';
import paymentRoutes from './payments.js';
import refundRoutes from './refunds.js';
import shipmentRoutes from './shipments.js';
import payoutRoutes from './payouts.js';
import reviewRoutes from './reviews.js';
import aiRoutes from './ai.js';
import supplierRoutes from './suppliers.js';
import adminRoutes from './admin.js';
import couponRoutes from './coupons.js';
import statisticsRoutes from './statistics.js';
import trafficRoutes from './traffic.js';

const router = express.Router();

// 기본 API 라우트
router.get('/', (req, res) => {
  res.json({ 
    message: 'ShopBuddy API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      sellers: '/api/sellers',
      products: '/api/products',
      orders: '/api/orders',
      ai: '/api/ai'
    }
  });
});

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 라우트 연결
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/seller-applications', sellerApplicationRoutes);
router.use('/sellers', sellerRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/payouts', payoutRoutes);
router.use('/reviews', reviewRoutes);
router.use('/ai', aiRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/admin', adminRoutes);
router.use('/coupons', couponRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/traffic', trafficRoutes);

export default router;

