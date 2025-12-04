import SellerApplication from '../models/SellerApplication.js';
import Seller from '../models/Seller.js';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 판매자 신청
export const createApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    // 이미 판매자인지 확인
    const existingSeller = await Seller.findOne({ userId });
    if (existingSeller) {
      return errorResponse(res, '이미 판매자로 등록되어 있습니다.', 400);
    }

    // 이미 신청서가 있는지 확인
    const existingApplication = await SellerApplication.findOne({
      userId,
      status: 'pending'
    });
    if (existingApplication) {
      return errorResponse(res, '이미 신청 중인 판매자 신청서가 있습니다.', 400);
    }

    const application = await SellerApplication.create({
      userId,
      ...req.body
    });

    successResponse(res, { application }, '판매자 신청이 완료되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 내 판매자 신청서 조회
export const getMyApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const application = await SellerApplication.findOne({ userId })
      .sort({ createdAt: -1 });

    successResponse(res, { application }, '신청서 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 판매자 신청서 수정
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const application = await SellerApplication.findById(id);
    if (!application) {
      return errorResponse(res, '신청서를 찾을 수 없습니다.', 404);
    }

    if (application.userId.toString() !== userId) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    if (application.status !== 'pending') {
      return errorResponse(res, '수정할 수 없는 상태입니다.', 400);
    }

    Object.assign(application, req.body);
    await application.save();

    successResponse(res, { application }, '신청서가 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 판매자 신청서 목록 조회
export const getApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const applications = await SellerApplication.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SellerApplication.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { applications }, pagination, '신청서 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 판매자 신청서 상세 조회
export const getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await SellerApplication.findById(id)
      .populate('userId', 'name email phone');

    if (!application) {
      return errorResponse(res, '신청서를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { application }, '신청서 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 판매자 신청 승인
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const application = await SellerApplication.findById(id);
    if (!application) {
      return errorResponse(res, '신청서를 찾을 수 없습니다.', 404);
    }

    if (application.status !== 'pending') {
      return errorResponse(res, '이미 처리된 신청서입니다.', 400);
    }

    // Seller 생성
    const seller = await Seller.create({
      userId: application.userId,
      businessName: application.businessName,
      businessNumber: application.businessNumber,
      businessType: application.businessType,
      contactPhone: application.contactPhone,
      contactEmail: application.contactEmail,
      address: application.address,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminId
    });

    // User 역할 변경
    await User.findByIdAndUpdate(application.userId, { role: 'seller' });

    // 신청서 상태 업데이트
    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;
    await application.save();

    successResponse(res, { seller, application }, '판매자 신청이 승인되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 판매자 신청 반려
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const application = await SellerApplication.findById(id);
    if (!application) {
      return errorResponse(res, '신청서를 찾을 수 없습니다.', 404);
    }

    if (application.status !== 'pending') {
      return errorResponse(res, '이미 처리된 신청서입니다.', 400);
    }

    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;
    await application.save();

    successResponse(res, { application }, '판매자 신청이 반려되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

