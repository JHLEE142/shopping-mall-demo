import Coupon from '../models/Coupon.js';
import UserCoupon from '../models/UserCoupon.js';
import { successResponse, errorResponse } from '../utils/response.js';

// 전체 쿠폰 목록 조회 (관리자용 또는 공개 쿠폰)
export const getCoupons = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isActive,
      issueType,
      search 
    } = req.query;

    const query = {};

    // 활성화 여부 필터
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // 발급 방식 필터
    if (issueType) {
      query.issueType = issueType;
    }

    // 검색 (이름, 코드)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // 현재 날짜 기준으로 유효한 쿠폰만 조회
    const now = new Date();
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('applicableCategories', 'name code')
        .populate('applicableProducts', 'name slug'),
      Coupon.countDocuments(query)
    ]);

    successResponse(res, {
      coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, '쿠폰 목록 조회 성공');
  } catch (error) {
    console.error('❌ Get coupons error:', error);
    errorResponse(res, error.message, 500);
  }
};

// 쿠폰 상세 조회
export const getCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate('applicableCategories', 'name code')
      .populate('applicableProducts', 'name slug');

    if (!coupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    successResponse(res, { coupon }, '쿠폰 조회 성공');
  } catch (error) {
    console.error('❌ Get coupon error:', error);
    errorResponse(res, error.message, 500);
  }
};

// 내 쿠폰 목록 조회
export const getMyCoupons = async (req, res) => {
  try {
    // 인증된 사용자 확인 (authenticate 미들웨어를 통과했어도 방어 코드)
    if (!req.user || !req.user._id) {
      return errorResponse(res, '로그인이 필요합니다.', 401);
    }

    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { userId };

    // 상태 필터
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [userCoupons, total] = await Promise.all([
      UserCoupon.find(query)
        .populate({
          path: 'couponId',
          select: 'name description code discountType discount minPurchase maxDiscount validFrom validUntil'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserCoupon.countDocuments(query)
    ]);

    // 만료된 쿠폰 자동 업데이트
    const now = new Date();
    await UserCoupon.updateMany(
      {
        userId,
        status: 'available',
        expiresAt: { $lt: now }
      },
      {
        $set: { status: 'expired' }
      }
    ).catch(err => {
      // 업데이트 실패해도 계속 진행
      console.warn('쿠폰 만료 상태 업데이트 실패:', err);
    });

    successResponse(res, {
      coupons: userCoupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, '내 쿠폰 목록 조회 성공');
  } catch (error) {
    console.error('❌ Get my coupons error:', error);
    
    // MongoDB 연결 에러 확인
    if (error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
      return errorResponse(res, '데이터베이스 연결 오류가 발생했습니다.', 500);
    }
    
    errorResponse(res, error.message || '쿠폰 목록을 불러오는데 실패했습니다.', 500);
  }
};

// 쿠폰 받기 (발급)
export const claimCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponId, code } = req.body;

    let coupon;

    // 쿠폰 ID 또는 코드로 쿠폰 찾기
    if (couponId) {
      coupon = await Coupon.findById(couponId);
    } else if (code) {
      coupon = await Coupon.findOne({ code: code.toUpperCase() });
    } else {
      return errorResponse(res, '쿠폰 ID 또는 코드를 입력해주세요.', 400);
    }

    if (!coupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    // 쿠폰 활성화 확인
    if (!coupon.isActive) {
      return errorResponse(res, '비활성화된 쿠폰입니다.', 400);
    }

    // 유효기간 확인
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return errorResponse(res, '유효기간이 지난 쿠폰입니다.', 400);
    }

    // 발급 수량 확인
    if (coupon.maxIssues && coupon.issuedCount >= coupon.maxIssues) {
      return errorResponse(res, '쿠폰 발급 한도에 도달했습니다.', 400);
    }

    // 사용자당 발급 수량 확인
    const userCouponCount = await UserCoupon.countDocuments({
      userId,
      couponId: coupon._id,
      status: { $in: ['available', 'used'] }
    });

    if (userCouponCount >= coupon.maxIssuesPerUser) {
      return errorResponse(res, '이미 최대 발급 수량에 도달했습니다.', 400);
    }

    // 중복 발급 확인 (available 상태인 쿠폰이 있는지)
    const existingCoupon = await UserCoupon.findOne({
      userId,
      couponId: coupon._id,
      status: 'available'
    });

    if (existingCoupon) {
      return errorResponse(res, '이미 보유한 쿠폰입니다.', 400);
    }

    // 쿠폰 발급
    const userCoupon = await UserCoupon.create({
      userId,
      couponId: coupon._id,
      status: 'available',
      expiresAt: coupon.validUntil
    });

    // 발급 수량 증가
    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { issuedCount: 1 }
    });

    const populatedCoupon = await UserCoupon.findById(userCoupon._id)
      .populate('couponId', 'name description code discountType discount minPurchase maxDiscount validFrom validUntil');

    successResponse(res, { coupon: populatedCoupon }, '쿠폰이 발급되었습니다.', 201);
  } catch (error) {
    console.error('❌ Claim coupon error:', error);
    
    // 중복 키 에러 처리
    if (error.code === 11000) {
      return errorResponse(res, '이미 보유한 쿠폰입니다.', 400);
    }
    
    errorResponse(res, error.message, 500);
  }
};

// 쿠폰 사용
export const useCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userCouponId, orderId } = req.body;

    if (!userCouponId || !orderId) {
      return errorResponse(res, '쿠폰 ID와 주문 ID를 입력해주세요.', 400);
    }

    const userCoupon = await UserCoupon.findOne({
      _id: userCouponId,
      userId
    }).populate('couponId');

    if (!userCoupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    if (userCoupon.status !== 'available') {
      return errorResponse(res, '사용할 수 없는 쿠폰입니다.', 400);
    }

    // 만료 확인
    const now = new Date();
    if (userCoupon.expiresAt < now) {
      await UserCoupon.findByIdAndUpdate(userCouponId, {
        $set: { status: 'expired' }
      });
      return errorResponse(res, '만료된 쿠폰입니다.', 400);
    }

    // 쿠폰 사용 처리
    await UserCoupon.findByIdAndUpdate(userCouponId, {
      $set: {
        status: 'used',
        usedAt: now,
        orderId
      }
    });

    // 쿠폰 사용 수 증가
    await Coupon.findByIdAndUpdate(userCoupon.couponId._id, {
      $inc: { usedCount: 1 }
    });

    successResponse(res, null, '쿠폰이 사용되었습니다.');
  } catch (error) {
    console.error('❌ Use coupon error:', error);
    errorResponse(res, error.message, 500);
  }
};

// 쿠폰 생성 (관리자용)
export const createCoupon = async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      discountType,
      discount,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      maxIssues,
      maxIssuesPerUser,
      issueType,
      applicableCategories,
      applicableProducts,
      isActive
    } = req.body;

    // 필수 필드 검증
    if (!name || !code || !discountType || discount === undefined) {
      return errorResponse(res, '필수 입력 항목을 확인해주세요.', 400);
    }

    // 할인율 검증
    if (discountType === 'percent' && (discount < 0 || discount > 100)) {
      return errorResponse(res, '할인율은 0~100 사이여야 합니다.', 400);
    }

    // 유효기간 검증
    if (new Date(validFrom) >= new Date(validUntil)) {
      return errorResponse(res, '유효기간을 확인해주세요.', 400);
    }

    const coupon = await Coupon.create({
      name,
      description,
      code: code.toUpperCase(),
      discountType,
      discount,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      maxIssues: maxIssues || null,
      maxIssuesPerUser: maxIssuesPerUser || 1,
      issueType: issueType || 'manual',
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      isActive: isActive !== undefined ? isActive : true
    });

    successResponse(res, { coupon }, '쿠폰이 생성되었습니다.', 201);
  } catch (error) {
    console.error('❌ Create coupon error:', error);
    
    // 중복 키 에러 처리
    if (error.code === 11000) {
      return errorResponse(res, '이미 존재하는 쿠폰 코드입니다.', 400);
    }
    
    errorResponse(res, error.message, 500);
  }
};

// 쿠폰 수정 (관리자용)
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 코드가 있으면 대문자로 변환
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    // 날짜 필드 변환
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    successResponse(res, { coupon }, '쿠폰이 수정되었습니다.');
  } catch (error) {
    console.error('❌ Update coupon error:', error);
    errorResponse(res, error.message, 500);
  }
};

// 쿠폰 삭제 (관리자용)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    // 사용 중인 쿠폰이 있는지 확인
    const usedCount = await UserCoupon.countDocuments({
      couponId: id,
      status: { $in: ['available', 'used'] }
    });

    if (usedCount > 0) {
      // 사용 중인 쿠폰이 있으면 비활성화만 처리
      await Coupon.findByIdAndUpdate(id, { isActive: false });
      return successResponse(res, null, '사용 중인 쿠폰이 있어 비활성화 처리되었습니다.');
    }

    // 사용 중인 쿠폰이 없으면 삭제
    await Coupon.findByIdAndDelete(id);
    await UserCoupon.deleteMany({ couponId: id });

    successResponse(res, null, '쿠폰이 삭제되었습니다.');
  } catch (error) {
    console.error('❌ Delete coupon error:', error);
    errorResponse(res, error.message, 500);
  }
};

