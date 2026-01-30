const { Router } = require('express');
const userRouter = require('./users');
const productRouter = require('./products');
const authenticate = require('../middleware/authMiddleware');
const cartRouter = require('./carts');
const orderRouter = require('./orders');
const categoryRouter = require('./categories');
const adminLookbookRouter = require('./adminLookbook');
const adminInventoryRouter = require('./adminInventory');
const adminSettingsRouter = require('./adminSettings');
const exchangeReturnRouter = require('./exchangeReturns');
const statisticsRouter = require('./statistics');
const searchRouter = require('./search');
const couponRouter = require('./coupons');
const reviewRouter = require('./reviews');
const productInquiryRouter = require('./productInquiries');
const wishlistRouter = require('./wishlists');
const trustedDeviceRouter = require('./trustedDevices');
const pointRouter = require('./points');
const chatRouter = require('./chat');
const notificationRouter = require('./notifications');
const inquiryRouter = require('./inquiries');
const feedbackRouter = require('./feedbacks');
const noticeRouter = require('./notices');
const recentlyViewedProductRouter = require('./recentlyViewedProducts');
const passwordResetRouter = require('./passwordResets');
const newsletterRouter = require('./newsletters');
const tossPaymentsRouter = require('./tossPayments');
const { getCurrentUser, logoutUser } = require('../controllers/userController');

const router = Router();

router.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      products: '/api/products',
      categories: '/api/categories',
      carts: '/api/carts',
      orders: '/api/orders'
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

router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/carts', cartRouter);
router.use('/orders', orderRouter);
router.use('/admin/lookbook', adminLookbookRouter);
router.use('/admin/inventory', adminInventoryRouter);
router.use('/admin/settings', adminSettingsRouter);
router.use('/statistics', statisticsRouter);
router.use('/search', searchRouter);
router.use('/coupons', couponRouter);
router.use('/reviews', reviewRouter);
router.use('/product-inquiries', productInquiryRouter);
router.use('/wishlists', wishlistRouter);
router.use('/trusted-devices', trustedDeviceRouter);
router.use('/points', pointRouter);
router.use('/exchange-returns', exchangeReturnRouter);
router.use('/chat', chatRouter);
router.use('/notifications', notificationRouter);
router.use('/inquiries', inquiryRouter);
router.use('/feedbacks', feedbackRouter);
router.use('/notices', noticeRouter);
router.use('/recently-viewed-products', recentlyViewedProductRouter);
router.use('/auth/password-reset', passwordResetRouter);
router.use('/newsletters', newsletterRouter);
router.use('/toss-payments', tossPaymentsRouter);
const aiRouter = require('./ai');
router.use('/ai', aiRouter);
router.get('/auth/session', authenticate, getCurrentUser);
router.post('/auth/logout', authenticate, logoutUser);

module.exports = router;

