import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import ProductImage from '../models/ProductImage.js';
import Order from '../models/Order.js';
import SellerApplication from '../models/SellerApplication.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 대시보드 통계
export const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingApplications
    ] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      SellerApplication.countDocuments({ status: 'pending' })
    ]);

    // 총 매출 계산
    const orders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 총 커미션 계산
    const totalCommission = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.commissionAmount, 0);
    }, 0);

    // 최근 주문
    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    successResponse(res, {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCommission,
      recentOrders,
      pendingApplications
    }, '대시보드 통계 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 사용자 관리
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { users }, pagination, '사용자 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 판매자 관리
export const getSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sellers = await Seller.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Seller.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { sellers }, pagination, '판매자 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 판매자 상태 변경
export const updateSellerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const seller = await Seller.findById(id);
    if (!seller) {
      return errorResponse(res, '판매자를 찾을 수 없습니다.', 404);
    }

    seller.status = status;
    if (reason) seller.notes = reason;
    await seller.save();

    successResponse(res, { seller }, '판매자 상태가 변경되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 판매자 커미션율 변경
export const updateSellerCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body;

    if (commissionRate < 0 || commissionRate > 100) {
      return errorResponse(res, '커미션율은 0-100 사이여야 합니다.', 400);
    }

    const seller = await Seller.findById(id);
    if (!seller) {
      return errorResponse(res, '판매자를 찾을 수 없습니다.', 404);
    }

    seller.commissionRate = commissionRate;
    await seller.save();

    successResponse(res, { seller }, '커미션율이 변경되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 주문 관리
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sellerId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (sellerId) query['items.sellerId'] = sellerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { orders }, pagination, '주문 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 주문 상태 변경
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    order.status = status;
    await order.save();

    successResponse(res, { order }, '주문 상태가 변경되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 관리
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sellerId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .populate('sellerId', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 각 상품의 이미지 조회
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        // Primary 이미지 또는 첫 번째 이미지 조회
        const primaryImage = await ProductImage.findOne({ 
          productId: product._id, 
          isPrimary: true 
        }).sort({ order: 1 });
        
        if (!primaryImage) {
          // Primary 이미지가 없으면 첫 번째 이미지 조회
          const firstImage = await ProductImage.findOne({ 
            productId: product._id 
          }).sort({ order: 1 });
          productObj.imageUrl = firstImage?.url || null;
          productObj.images = firstImage ? [firstImage] : [];
        } else {
          productObj.imageUrl = primaryImage.url;
          productObj.images = [primaryImage];
        }
        
        return productObj;
      })
    );

    const total = await Product.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { products: productsWithImages }, pagination, '상품 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 상품 상태 변경
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    product.status = status;
    await product.save();

    successResponse(res, { product }, '상품 상태가 변경되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 커미션 정책 조회
export const getCommissionPolicy = async (req, res) => {
  try {
    // TODO: 실제로는 설정 테이블에서 조회
    successResponse(res, {
      defaultRate: 10,
      categoryRates: {},
      sellerRates: {}
    }, '커미션 정책 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 커미션 정책 수정
export const updateCommissionPolicy = async (req, res) => {
  try {
    const { defaultRate, categoryRates, sellerRates } = req.body;

    // TODO: 실제로는 설정 테이블에 저장
    successResponse(res, {
      defaultRate,
      categoryRates,
      sellerRates
    }, '커미션 정책이 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

