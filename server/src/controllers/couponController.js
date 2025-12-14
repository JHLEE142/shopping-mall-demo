const { Coupon, UserCoupon } = require('../models/coupon');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 사용자의 쿠폰함 조회
 */
const getUserCoupons = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return errorResponse(res, '사용자 인증이 필요합니다.', 401);
    }

    // 사용자가 보유한 쿠폰 조회
    const userCoupons = await UserCoupon.find({ userId, isUsed: false })
      .populate('couponId')
      .sort({ receivedAt: -1 })
      .lean();

    // 유효한 쿠폰만 필터링 (유효기간 체크)
    const now = new Date();
    const validCoupons = userCoupons.filter((uc) => {
      const coupon = uc.couponId;
      if (!coupon || !coupon.isActive) return false;
      return new Date(coupon.validFrom) <= now && new Date(coupon.validUntil) >= now;
    });

    // 쿠폰 개수
    const couponCount = validCoupons.length;

    // 포인트는 임시로 0 (나중에 포인트 시스템 추가 시 수정)
    const points = 0;

    successResponse(res, {
      coupons: validCoupons.map((uc) => ({
        _id: uc._id,
        coupon: uc.couponId,
        receivedAt: uc.receivedAt,
        isUsed: uc.isUsed,
      })),
      couponCount,
      points,
    }, '쿠폰함 조회 성공');
  } catch (error) {
    console.error('쿠폰함 조회 오류:', error);
    errorResponse(res, error.message || '쿠폰함 조회에 실패했습니다.', 500);
  }
};

/**
 * 사용 가능한 쿠폰 목록 조회 (받을 수 있는 쿠폰)
 */
const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return errorResponse(res, '사용자 인증이 필요합니다.', 401);
    }

    const now = new Date();
    
    // 활성화되고 유효기간 내의 쿠폰 조회
    // usageLimit 체크는 나중에 지급된 개수로 확인
    const availableCoupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { targetType: 'all' },
        { targetType: 'specific', targetUsers: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // 사용자가 이미 받은 쿠폰 ID 목록
    const userCouponIds = await UserCoupon.find({ userId }).distinct('couponId');

    // 받을 수 있는 쿠폰만 필터링
    const couponsToReceive = await Promise.all(
      availableCoupons
        .filter((coupon) => {
          // 이미 받은 쿠폰 제외
          if (userCouponIds.some((id) => id.toString() === coupon._id.toString())) {
            return false;
          }
          // 특정 사용자 지정 쿠폰인 경우 해당 사용자인지 확인
          if (coupon.targetType === 'specific') {
            const targetUserIds = coupon.targetUsers?.map((u) => u.toString()) || [];
            return targetUserIds.includes(userId.toString());
          }
          // 전체 사용자 대상 쿠폰
          return true;
        })
        .map(async (coupon) => {
          // usageLimit이 있는 경우 지급된 개수 확인
          if (coupon.usageLimit) {
            const issuedCount = await UserCoupon.countDocuments({ couponId: coupon._id });
            if (issuedCount >= coupon.usageLimit) {
              return null; // 지급 한도 도달
            }
          }
          return {
            ...coupon,
            canReceive: true,
          };
        })
    );
    
    // null 값 제거
    const filteredCoupons = couponsToReceive.filter(coupon => coupon !== null);

    successResponse(res, {
      coupons: filteredCoupons,
    }, '받을 수 있는 쿠폰 조회 성공');
  } catch (error) {
    console.error('받을 수 있는 쿠폰 조회 오류:', error);
    errorResponse(res, error.message || '쿠폰 조회에 실패했습니다.', 500);
  }
};

/**
 * 쿠폰 받기
 */
const receiveCoupon = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { couponId } = req.body;

    if (!userId) {
      return errorResponse(res, '사용자 인증이 필요합니다.', 401);
    }

    if (!couponId) {
      return errorResponse(res, '쿠폰 ID가 필요합니다.', 400);
    }

    // 쿠폰 존재 및 유효성 확인
    const coupon = await Coupon.findById(couponId);
    if (!coupon || !coupon.isActive) {
      return errorResponse(res, '유효하지 않은 쿠폰입니다.', 400);
    }

    const now = new Date();
    if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
      return errorResponse(res, '유효기간이 지난 쿠폰입니다.', 400);
    }

    // 사용 제한 확인 (지급된 개수로 확인)
    if (coupon.usageLimit) {
      const issuedCount = await UserCoupon.countDocuments({ couponId });
      if (issuedCount >= coupon.usageLimit) {
        return errorResponse(res, '쿠폰 수령 한도에 도달했습니다.', 400);
      }
    }

    // 이미 받은 쿠폰인지 확인
    const existingUserCoupon = await UserCoupon.findOne({
      userId,
      couponId,
      isUsed: false,
    });

    if (existingUserCoupon) {
      return errorResponse(res, '이미 받은 쿠폰입니다.', 400);
    }

    // 쿠폰 받기
    const userCoupon = await UserCoupon.create({
      userId,
      couponId,
      receivedAt: now,
    });

    // usedCount는 실제 쿠폰 사용 시에만 증가하므로 여기서는 증가시키지 않음

    const populatedUserCoupon = await UserCoupon.findById(userCoupon._id)
      .populate('couponId')
      .lean();

    successResponse(res, {
      userCoupon: populatedUserCoupon,
    }, '쿠폰을 성공적으로 받았습니다.');
  } catch (error) {
    console.error('쿠폰 받기 오류:', error);
    errorResponse(res, error.message || '쿠폰 받기에 실패했습니다.', 500);
  }
};

/**
 * 관리자: 모든 쿠폰 목록 조회
 */
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    let query = {};
    
    // status 필터: 'active', 'expired', 'all'
    if (status === 'active') {
      query = {
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
      };
    } else if (status === 'expired') {
      query = {
        $or: [
          { isActive: false },
          { validUntil: { $lt: now } },
          { $and: [
            { usageLimit: { $ne: null } },
            { $expr: { $gte: ['$usedCount', '$usageLimit'] } }
          ]}
        ],
      };
    } else {
      // status가 'all'이거나 지정되지 않은 경우 모든 쿠폰 조회
      query = {};
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate('targetUsers', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Coupon.countDocuments(query),
    ]);

    // 각 쿠폰의 잔여량 계산
    // 잔여량 = usageLimit - 지급된 개수 (UserCoupon 개수)
    // 먼저 모든 쿠폰의 지급된 개수를 한 번에 조회
    const couponIds = coupons.map(c => c._id);
    const issuedCountsMap = {};
    
    if (couponIds.length > 0) {
      const issuedCounts = await UserCoupon.aggregate([
        { $match: { couponId: { $in: couponIds } } },
        { $group: { _id: '$couponId', count: { $sum: 1 } } }
      ]);
      
      issuedCounts.forEach(item => {
        issuedCountsMap[item._id.toString()] = item.count;
      });
    }
    
    const couponsWithRemaining = coupons.map((coupon) => {
      if (!coupon.usageLimit) {
        return { ...coupon, remaining: null };
      }
      
      const issuedCount = issuedCountsMap[coupon._id.toString()] || 0;
      const remaining = Math.max(0, coupon.usageLimit - issuedCount);
      
      return {
        ...coupon,
        remaining,
      };
    });

    successResponse(res, {
      coupons: couponsWithRemaining,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }, '쿠폰 목록 조회 성공');
  } catch (error) {
    console.error('쿠폰 목록 조회 오류:', error);
    errorResponse(res, error.message || '쿠폰 목록 조회에 실패했습니다.', 500);
  }
};

/**
 * 관리자: 쿠폰 생성
 */
const createCoupon = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      discountValue,
      minPurchaseAmount = 0,
      maxDiscountAmount = null,
      validFrom,
      validUntil,
      usageLimit = null,
      targetType = 'all',
      targetUsers = [],
    } = req.body;

    if (!title || !description || !type || discountValue === undefined || !validFrom || !validUntil) {
      return errorResponse(res, '필수 필드가 누락되었습니다.', 400);
    }

    if (!['freeShipping', 'fixedAmount', 'percentage'].includes(type)) {
      return errorResponse(res, '유효하지 않은 쿠폰 타입입니다.', 400);
    }

    const coupon = await Coupon.create({
      title,
      description,
      type,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit,
      isActive: true,
      usedCount: 0,
      targetType: targetType || 'all',
      targetUsers: Array.isArray(targetUsers) ? targetUsers : [],
    });

    // 특정 사용자에게 지정된 경우 자동으로 쿠폰 지급
    if (targetType === 'specific' && Array.isArray(targetUsers) && targetUsers.length > 0) {
      const now = new Date();
      const userCouponsToCreate = targetUsers.map((userId) => ({
        userId,
        couponId: coupon._id,
        receivedAt: now,
        isUsed: false,
      }));

      await UserCoupon.insertMany(userCouponsToCreate);
      
      // usedCount는 실제 쿠폰 사용 시에만 증가하므로 여기서는 증가시키지 않음
    }

    successResponse(res, { coupon }, '쿠폰이 생성되었습니다.');
  } catch (error) {
    console.error('쿠폰 생성 오류:', error);
    
    // MongoDB duplicate key error 처리
    if (error.code === 11000 || error.message?.includes('duplicate key')) {
      const field = Object.keys(error.keyPattern || {})[0] || '';
      if (field === 'code') {
        return errorResponse(res, '쿠폰 코드가 이미 사용 중입니다. 다른 코드를 사용해주세요.', 409);
      } else if (field === 'email') {
        return errorResponse(res, '이미 사용 중인 이메일입니다.', 409);
      } else {
        return errorResponse(res, '이미 사용 중인 정보입니다.', 409);
      }
    }
    
    // Validation error 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((err) => err.message);
      return errorResponse(res, messages[0] || '입력 정보를 확인해주세요.', 400);
    }
    
    errorResponse(res, error.message || '쿠폰 생성에 실패했습니다.', 500);
  }
};

/**
 * 관리자: 쿠폰 수정
 */
const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const {
      title,
      description,
      type,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      isActive,
      targetType,
      targetUsers,
    } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = minPurchaseAmount;
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (targetType !== undefined) updateData.targetType = targetType;
    if (targetUsers !== undefined) updateData.targetUsers = Array.isArray(targetUsers) ? targetUsers : [];

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      updateData,
      { new: true, runValidators: true }
    );

    // 특정 사용자 지정이 변경된 경우 처리
    if (targetType !== undefined || targetUsers !== undefined) {
      const finalTargetType = targetType !== undefined ? targetType : updatedCoupon.targetType;
      const finalTargetUsers = targetUsers !== undefined ? (Array.isArray(targetUsers) ? targetUsers : []) : updatedCoupon.targetUsers;

      // 기존 UserCoupon 삭제 (특정 사용자 지정 쿠폰인 경우)
      if (finalTargetType === 'specific' && Array.isArray(finalTargetUsers) && finalTargetUsers.length > 0) {
        // 기존에 지급된 쿠폰 중 새로운 대상에 없는 사용자의 쿠폰은 유지
        // 새로운 대상에 추가된 사용자에게만 쿠폰 지급
        const existingUserCoupons = await UserCoupon.find({ couponId }).lean();
        const existingUserIds = existingUserCoupons.map(uc => uc.userId.toString());
        const newTargetUserIds = finalTargetUsers.map(id => id.toString());
        
        // 새로 추가된 사용자에게만 쿠폰 지급
        const usersToAdd = newTargetUserIds.filter(id => !existingUserIds.includes(id));
        if (usersToAdd.length > 0) {
          const now = new Date();
          const userCouponsToCreate = usersToAdd.map((userId) => ({
            userId,
            couponId: updatedCoupon._id,
            receivedAt: now,
            isUsed: false,
          }));

          await UserCoupon.insertMany(userCouponsToCreate);
          
          // usedCount는 실제 쿠폰 사용 시에만 증가하므로 여기서는 증가시키지 않음
        }
      }
    }

    successResponse(res, { coupon: updatedCoupon }, '쿠폰이 수정되었습니다.');
  } catch (error) {
    console.error('쿠폰 수정 오류:', error);
    
    // MongoDB duplicate key error 처리
    if (error.code === 11000 || error.message?.includes('duplicate key')) {
      const field = Object.keys(error.keyPattern || {})[0] || '';
      if (field === 'code') {
        return errorResponse(res, '쿠폰 코드가 이미 사용 중입니다. 다른 코드를 사용해주세요.', 409);
      } else if (field === 'email') {
        return errorResponse(res, '이미 사용 중인 이메일입니다.', 409);
      } else {
        return errorResponse(res, '이미 사용 중인 정보입니다.', 409);
      }
    }
    
    // Validation error 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((err) => err.message);
      return errorResponse(res, messages[0] || '입력 정보를 확인해주세요.', 400);
    }
    
    errorResponse(res, error.message || '쿠폰 수정에 실패했습니다.', 500);
  }
};

/**
 * 관리자: 쿠폰 삭제
 */
const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return errorResponse(res, '쿠폰을 찾을 수 없습니다.', 404);
    }

    await Coupon.findByIdAndDelete(couponId);

    successResponse(res, null, '쿠폰이 삭제되었습니다.');
  } catch (error) {
    console.error('쿠폰 삭제 오류:', error);
    errorResponse(res, error.message || '쿠폰 삭제에 실패했습니다.', 500);
  }
};

/**
 * 관리자: 사용자별 쿠폰 조회
 */
const getUserCouponsByAdmin = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const [userCoupons, total] = await Promise.all([
      UserCoupon.find(query)
        .populate('userId', 'name email')
        .populate('couponId')
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      UserCoupon.countDocuments(query),
    ]);

    successResponse(res, {
      userCoupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }, '사용자 쿠폰 조회 성공');
  } catch (error) {
    console.error('사용자 쿠폰 조회 오류:', error);
    errorResponse(res, error.message || '사용자 쿠폰 조회에 실패했습니다.', 500);
  }
};

module.exports = {
  getUserCoupons,
  getAvailableCoupons,
  receiveCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getUserCouponsByAdmin,
};

