import User from '../models/User.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 사용자 프로필 조회
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 본인 또는 관리자만 조회 가능
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return errorResponse(res, '사용자를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { user }, '사용자 정보 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 사용자 프로필 수정
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 본인만 수정 가능
    if (req.user._id.toString() !== id) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    const { name, phone, address } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, '사용자를 찾을 수 없습니다.', 404);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    successResponse(res, { user }, '프로필이 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 사용자 주소 목록 조회
export const getUserAddresses = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, '사용자를 찾을 수 없습니다.', 404);
    }

    // 주소는 User 모델에 직접 저장되어 있으므로 반환
    successResponse(res, { address: user.address }, '주소 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 사용자 주소 추가/수정
export const updateUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user._id.toString() !== id) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    const { address } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, '사용자를 찾을 수 없습니다.', 404);
    }

    user.address = address;
    await user.save();

    successResponse(res, { address: user.address }, '주소가 업데이트되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 사용자 주문 내역 조회
export const getUserOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    const query = { userId: id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.productId', 'name slug')
      .populate('items.sellerId', 'businessName');

    const total = await Order.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { orders }, pagination, '주문 내역 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

