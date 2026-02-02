const Order = require('../models/order');
const Cart = require('../models/cart');
const { Coupon, UserCoupon } = require('../models/coupon');
const User = require('../models/user');
const PointHistory = require('../models/point');
const Product = require('../models/product');
const InventoryHistory = require('../models/inventoryHistory');
const Notification = require('../models/notification');
const AdminSetting = require('../models/adminSetting');
const mongoose = require('mongoose');
const crypto = require('crypto');

const PORTONE_API_BASE_URL = 'https://api.iamport.kr';
const DEFAULT_ORDER_PAUSE_MESSAGE = '현재 주문이 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.';

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getPortOneAccessToken() {
  const apiKey = process.env.PORTONE_API_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw createHttpError(500, '포트원 API 인증 정보가 설정되지 않았습니다.');
  }

  const response = await fetch(`${PORTONE_API_BASE_URL}/users/getToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imp_key: apiKey,
      imp_secret: apiSecret,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.code !== 0) {
    const message = data?.message || '포트원 액세스 토큰 발급에 실패했습니다.';
    throw createHttpError(502, message);
  }

  return data.response?.access_token;
}

async function fetchPortOnePayment(impUid, accessToken) {
  const response = await fetch(`${PORTONE_API_BASE_URL}/payments/${impUid}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.code !== 0) {
    const message = data?.message || '포트원 결제 정보를 조회하지 못했습니다.';
    throw createHttpError(400, message);
  }

  return data.response;
}

async function verifyPortOnePayment(impUid, expectedAmount) {
  const normalizedImpUid = normalizeString(impUid);

  if (!normalizedImpUid) {
    throw createHttpError(400, '결제 고유번호가 필요합니다.');
  }

  const accessToken = await getPortOneAccessToken();
  const paymentInfo = await fetchPortOnePayment(normalizedImpUid, accessToken);

  if (!paymentInfo) {
    throw createHttpError(400, '결제 정보를 찾을 수 없습니다.');
  }

  if (paymentInfo.status !== 'paid') {
    throw createHttpError(400, '결제가 완료되지 않았습니다.');
  }

  const paidAmount = Number(paymentInfo.amount ?? 0);
  const normalizedExpectedAmount = Number(expectedAmount ?? 0);

  if (Number.isNaN(normalizedExpectedAmount) || normalizedExpectedAmount <= 0) {
    throw createHttpError(400, '유효하지 않은 결제 금액입니다.');
  }

  if (paidAmount !== normalizedExpectedAmount) {
    throw createHttpError(400, '결제 금액이 일치하지 않습니다.');
  }

  return paymentInfo;
}

// 포트원 결제 취소 함수
async function cancelPortOnePayment(impUid, amount, reason = '') {
  const accessToken = await getPortOneAccessToken();
  
  const response = await fetch(`${PORTONE_API_BASE_URL}/payments/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      imp_uid: impUid,
      amount: amount,
      reason: reason || '고객 요청에 의한 환불',
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.code !== 0) {
    const message = data?.message || '결제 취소에 실패했습니다.';
    throw createHttpError(400, message);
  }

  return data.response;
}

// 적립금 계산 함수: 결제 금액의 1%를 원 단위로 절삭
function calculateRewardPoints(paymentAmount) {
  const rewardAmount = paymentAmount * 0.01; // 1%
  return Math.floor(rewardAmount); // 원 단위 절삭
}

// 적립금 적립 함수
async function earnOrderRewardPoints(order) {
  try {
    // 게스트 주문이거나 결제가 완료되지 않은 경우 적립하지 않음
    if (!order.user || order.payment?.status !== 'paid') {
      return;
    }

    // 이미 적립금이 적립되었는지 확인 (중복 적립 방지)
    const existingPoint = await PointHistory.findOne({
      user: order.user,
      relatedOrder: order._id,
      type: 'earn',
    });

    if (existingPoint) {
      return; // 이미 적립됨
    }

    const paymentAmount = order.payment?.amount || order.summary?.grandTotal || 0;
    if (paymentAmount <= 0) {
      return;
    }

    const rewardAmount = calculateRewardPoints(paymentAmount);
    if (rewardAmount <= 0) {
      return;
    }

    const user = await User.findById(order.user);
    if (!user) {
      return;
    }

    const newBalance = (user.points || 0) + rewardAmount;

    // 사용자 적립금 업데이트
    user.points = newBalance;
    await user.save();

    // 적립금 내역 저장
    await PointHistory.create({
      user: order.user,
      type: 'earn',
      amount: rewardAmount,
      balance: newBalance,
      description: `주문 완료 적립 (주문번호: ${order.orderNumber})`,
      relatedOrder: order._id,
    });
  } catch (error) {
    console.error('적립금 적립 중 오류:', error);
    // 적립금 적립 실패가 주문 처리에 영향을 주지 않도록 에러를 무시
  }
}

function normalizeSubdocument(subdoc) {
  if (!subdoc) {
    return {};
  }

  if (typeof subdoc.toObject === 'function') {
    return subdoc.toObject();
  }

  return { ...subdoc };
}

function normalizeString(value = '') {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

async function generateUniqueOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  let uniqueNumber = '';
  let exists = true;

  while (exists) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    uniqueNumber = `${datePart}-${randomPart}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Order.exists({ orderNumber: uniqueNumber });
  }

  return uniqueNumber;
}

function computeOrderTotals(items = [], summaryOverrides = {}, couponDiscount = 0, pointsDiscount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.lineDiscount, 0);
  const shippingFee = Number(summaryOverrides.shippingFee ?? 0);
  const tax = Number(summaryOverrides.tax ?? 0);
  const couponDiscountAmount = Number(couponDiscount ?? 0);
  const pointsDiscountAmount = Number(pointsDiscount ?? 0);
  const grandTotal =
    Number(summaryOverrides.grandTotal ?? subtotal - discountTotal - couponDiscountAmount - pointsDiscountAmount + shippingFee + tax);

  return {
    currency: (summaryOverrides.currency || 'KRW').toUpperCase(),
    subtotal,
    discountTotal,
    shippingFee,
    tax,
    couponDiscount: couponDiscountAmount,
    pointsDiscount: pointsDiscountAmount,
    grandTotal: Math.max(0, grandTotal), // 최소 0원
  };
}

function canAccessOrder(user, order) {
  if (!order) {
    return false;
  }

  // 관리자는 모든 주문 접근 가능
  if (user && user.user_type === 'admin') {
    return true;
  }

  // 회원 주문인 경우
  if (order.user) {
    return user && order.user.toString() === user.id;
  }

  // 비회원 주문은 항상 false (별도 인증 필요)
  return false;
}

// 비회원 주문 접근 권한 확인
function canAccessGuestOrder(order, guestSessionId, accessToken, email, phone) {
  if (!order || !order.isGuest) {
    return false;
  }

  // accessToken으로 확인
  if (accessToken && order.guestAuth?.accessToken) {
    if (order.guestAuth.accessToken === accessToken) {
      // 토큰 만료 확인
      if (order.guestAuth.tokenExpiresAt && new Date() > order.guestAuth.tokenExpiresAt) {
        return false;
      }
      return true;
    }
  }

  // 주문번호 + 이메일/전화번호로 확인
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const normalizedPhone = phone ? phone.trim() : '';
  
  if (normalizedEmail && order.contact?.email && order.contact.email === normalizedEmail) {
    return true;
  }
  
  if (normalizedPhone && order.contact?.phone && order.contact.phone === normalizedPhone) {
    return true;
  }

  return false;
}

async function createOrder(req, res, next) {
  try {
    const orderPauseSetting = await AdminSetting.findOne({ key: 'orderPause' }).lean();
    if (orderPauseSetting?.orderPause?.isPaused) {
      return res.status(423).json({
        message: orderPauseSetting.orderPause.message || DEFAULT_ORDER_PAUSE_MESSAGE,
        code: 'ORDER_PAUSED',
      });
    }

    const {
      items = [],
      summary = {},
      payment = {},
      shipping,
      notes = '',
      contact = {},
      guestName = '',
      guestEmail = '',
      sourceCart = null,
      orderNumber: providedOrderNumber,
      paymentVerification = {},
      coupon: couponData = null,
      pointsUsed = 0, // 포인트 사용 금액
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '주문에 포함될 상품이 필요합니다.' });
    }

    if (!shipping || !shipping.address) {
      return res.status(400).json({ message: '배송 정보는 필수입니다.' });
    }

    // 배송 주소 필수 필드 검증
    const address = shipping.address;
    if (!address.name || !address.name.trim()) {
      return res.status(400).json({ message: '배송지 수령인 이름은 필수입니다.' });
    }
    if (!address.phone || !address.phone.trim()) {
      return res.status(400).json({ message: '배송지 연락처는 필수입니다.' });
    }
    if (!address.postalCode || !address.postalCode.trim()) {
      return res.status(400).json({ message: '배송지 우편번호는 필수입니다.' });
    }
    if (!address.address1 || !address.address1.trim()) {
      return res.status(400).json({ message: '배송지 주소는 필수입니다.' });
    }

    // 비회원 주문인 경우 필수 정보 확인
    if (!req.user) {
      if (!guestName && !contact.email && !contact.phone) {
        return res.status(400).json({ 
          message: '비회원 주문은 이름, 이메일, 또는 전화번호 중 하나는 필수입니다.' 
        });
      }
    }

    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const lineDiscount = Number(item.lineDiscount ?? 0);
      const lineTotal =
        item.lineTotal !== undefined
          ? Number(item.lineTotal)
          : quantity * unitPrice - lineDiscount;

      return {
        product: item.product,
        name: normalizeString(item.name),
        sku: normalizeString(item.sku),
        thumbnail: normalizeString(item.thumbnail),
        options: item.options || {},
        quantity,
        unitPrice,
        lineDiscount,
        lineTotal,
      };
    });

    // 쿠폰 적용 처리
    let couponDiscount = 0;
    let couponInfo = null;
    let userCouponId = null;

    if (couponData && couponData.userCouponId) {
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: '쿠폰 사용을 위해 로그인이 필요합니다.' });
      }

      // 사용자 쿠폰 확인
      const userCoupon = await UserCoupon.findOne({
        _id: couponData.userCouponId,
        userId: userId,
        isUsed: false,
      }).populate('couponId');

      if (!userCoupon || !userCoupon.couponId) {
        return res.status(400).json({ message: '유효하지 않은 쿠폰입니다.' });
      }

      const coupon = userCoupon.couponId;
      const now = new Date();

      // 쿠폰 유효성 검증
      if (!coupon.isActive) {
        return res.status(400).json({ message: '사용할 수 없는 쿠폰입니다.' });
      }

      if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
        return res.status(400).json({ message: '쿠폰 유효기간이 지났습니다.' });
      }

      // 최소 구매 금액 확인
      const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
        return res.status(400).json({ 
          message: `최소 구매 금액 ${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.` 
        });
      }

      // 할인 금액 계산
      if (coupon.type === 'freeShipping') {
        // 무료배송은 shippingFee에서 차감
        couponDiscount = 0; // shippingFee는 별도 처리
      } else if (coupon.type === 'fixedAmount') {
        couponDiscount = coupon.discountValue;
      } else if (coupon.type === 'percentage') {
        const percentageDiscount = Math.floor(subtotal * (coupon.discountValue / 100));
        couponDiscount = coupon.maxDiscountAmount 
          ? Math.min(percentageDiscount, coupon.maxDiscountAmount)
          : percentageDiscount;
      }

      couponInfo = {
        couponId: coupon._id,
        userCouponId: userCoupon._id,
        discountAmount: couponDiscount,
      };
      userCouponId = userCoupon._id;
    }

    // 포인트 사용 처리
    let pointsDiscount = 0;
    let pointsUsedAmount = Number(pointsUsed) || 0;
    if (pointsUsedAmount > 0) {
      if (!req.user) {
        return res.status(401).json({ message: '포인트 사용을 위해 로그인이 필요합니다.' });
      }

      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      const availablePoints = user.points || 0;
      if (availablePoints < pointsUsedAmount) {
        return res.status(400).json({ 
          message: `보유 포인트가 부족합니다. (보유: ${availablePoints}원, 사용 요청: ${pointsUsedAmount}원)` 
        });
      }

      // 주문 총액 계산 (쿠폰 할인 전)
      const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const shippingFee = Number(summary.shippingFee ?? 0);
      const orderTotal = subtotal + shippingFee;

      // 포인트는 주문 총액을 초과할 수 없음
      pointsUsedAmount = Math.min(pointsUsedAmount, orderTotal);
      pointsDiscount = pointsUsedAmount;
    }

    // 무료배송 쿠폰 처리
    let finalShippingFee = Number(summary.shippingFee ?? 0);
    if (couponInfo) {
      const coupon = await Coupon.findById(couponInfo.couponId).lean();
      if (coupon && coupon.type === 'freeShipping') {
        finalShippingFee = 0;
      }
    }
    
    const computedSummary = computeOrderTotals(normalizedItems, { ...summary, shippingFee: finalShippingFee }, couponDiscount, pointsDiscount);

    if (payment?.transactionId) {
      const duplicateOrder = await Order.findOne({
        'payment.transactionId': normalizeString(payment.transactionId),
      }).lean();

      if (duplicateOrder) {
        return res.status(409).json({ message: '이미 처리된 주문입니다.' });
      }
    }

    let verifiedPaymentInfo = null;

    // 토스페이먼츠 결제인지 확인 (paymentKey 형식: tgen_ 또는 t_ 로 시작)
    const transactionId = normalizeString(payment?.transactionId || '');
    const isTossPayment = transactionId && (
      transactionId.startsWith('tgen_') || 
      transactionId.startsWith('t_') ||
      transactionId.startsWith('toss_')
    );

    // 포트원 결제 검증이 필요한 경우에만 검증 수행
    // 토스페이먼츠 결제는 이미 confirmPayment API에서 승인되었으므로 검증 건너뛰기
    // payment.status가 이미 'paid'이고 토스페이먼츠 결제인 경우도 검증 건너뛰기
    const shouldVerifyPayment = 
      !isTossPayment && // 토스페이먼츠 결제가 아닌 경우
      payment?.status !== 'paid' && // 결제 상태가 아직 'paid'가 아닌 경우
      (normalizeString(paymentVerification?.impUid) || // impUid가 명시적으로 전달된 경우
       (transactionId && !isTossPayment)); // transactionId가 있고 토스페이먼츠가 아닌 경우

    if (shouldVerifyPayment) {
      try {
        const impUid =
          paymentVerification?.impUid || normalizeString(payment?.transactionId);

        verifiedPaymentInfo = await verifyPortOnePayment(
          impUid,
          Number(payment?.amount ?? computedSummary.grandTotal)
        );
      } catch (verificationError) {
        // 결제 실패 시 명확한 에러 메시지 반환 및 주문 상태 정보 포함
        const errorMessage = verificationError.message || '결제 검증에 실패했습니다.';
        const errorStatus = verificationError.status || 400;
        
        // 결제 실패 원인별 메시지 구분
        let userFriendlyMessage = '결제 처리에 실패했습니다.';
        if (errorMessage.includes('결제가 완료되지 않았습니다')) {
          userFriendlyMessage = '결제가 완료되지 않았습니다. 결제를 다시 시도해주세요.';
        } else if (errorMessage.includes('결제 금액이 일치하지 않습니다')) {
          userFriendlyMessage = '결제 금액이 일치하지 않습니다. 주문 정보를 확인해주세요.';
        } else if (errorMessage.includes('결제 정보를 찾을 수 없습니다')) {
          userFriendlyMessage = '결제 정보를 찾을 수 없습니다. 결제를 다시 시도해주세요.';
        }
        
        return res.status(errorStatus).json({
          message: userFriendlyMessage,
          error: errorMessage,
          code: 'PAYMENT_VERIFICATION_FAILED',
          // 재시도 가능 여부 표시
          retryable: !errorMessage.includes('금액이 일치하지 않습니다'),
        });
      }
    } else if (isTossPayment && payment?.status === 'paid') {
      // 토스페이먼츠 결제이고 이미 paid 상태인 경우, 검증 없이 진행
      console.log('[주문 생성] 토스페이먼츠 결제 - 검증 건너뛰기 (이미 승인됨)', {
        transactionId,
        amount: payment?.amount,
      });
    }

    // 재고 확인 및 차감 (트랜잭션 사용)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 재고 확인 및 차감
      const inventoryUpdates = [];
      for (const item of normalizedItems) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          await session.abortTransaction();
          return res.status(400).json({ message: `상품을 찾을 수 없습니다: ${item.name}` });
        }

        const currentStock = product.inventory?.stock || 0;
        const currentReserved = product.inventory?.reserved || 0;
        const availableStock = currentStock - currentReserved;

        if (availableStock < item.quantity) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `재고가 부족합니다: ${item.name} (재고: ${availableStock}개, 주문: ${item.quantity}개)` 
          });
        }

        // 재고 차감
        const newReserved = currentReserved + item.quantity;
        const newStock = currentStock; // stock은 그대로, reserved만 증가

        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: { 'inventory.reserved': item.quantity },
            'inventory.updatedAt': new Date(),
          },
          { session }
        );

        // 재고 이력 기록
        await InventoryHistory.create([{
          product: item.product,
          type: 'deduct',
          quantity: item.quantity,
          previousStock: currentStock,
          newStock: newStock,
          previousReserved: currentReserved,
          newReserved: newReserved,
          reason: `주문 생성: ${item.name}`,
          actor: req.user ? req.user._id : undefined,
        }], { session });

        inventoryUpdates.push({
          productId: item.product,
          productName: item.name,
          quantity: item.quantity,
        });
      }

      const orderNumber = providedOrderNumber || (await generateUniqueOrderNumber());

      // 비회원 주문인 경우 accessToken 생성
      let guestAuth = undefined;
      if (!req.user) {
        const accessToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30); // 30일 유효
        
        guestAuth = {
          accessToken,
          tokenExpiresAt,
          passwordHash: '', // 필요시 추가
        };
      }

      const paymentStatus = verifiedPaymentInfo ? 'paid' : normalizeString(payment.status || 'ready');
      const orderStatus = paymentStatus === 'paid' ? 'paid' : 'pending';

      const orderPayload = {
        orderNumber,
        user: req.user ? req.user._id : undefined,
        isGuest: !req.user,
        guestName: normalizeString(guestName),
        guestEmail: normalizeString(guestEmail).toLowerCase(),
        guestAuth: guestAuth,
        contact: {
          phone: normalizeString(contact.phone),
          email: normalizeString(contact.email).toLowerCase(),
        },
        status: orderStatus,
        items: normalizedItems,
        summary: computedSummary,
        coupon: couponInfo || undefined,
        payment: {
          method: normalizeString(payment.method),
          status: paymentStatus,
          amount: Number(payment.amount ?? computedSummary.grandTotal),
          currency: (payment.currency || computedSummary.currency).toUpperCase(),
          transactionId: normalizeString(
            verifiedPaymentInfo?.imp_uid || payment.transactionId
          ),
          receiptUrl:
            normalizeString(payment.receiptUrl) || normalizeString(verifiedPaymentInfo?.receipt_url),
          paidAt: verifiedPaymentInfo?.paid_at
            ? new Date(verifiedPaymentInfo.paid_at * 1000)
            : payment.paidAt
              ? new Date(payment.paidAt)
              : undefined,
        },
        shipping: {
          address: {
            name: normalizeString(shipping.address.name),
            phone: normalizeString(shipping.address.phone),
            postalCode: normalizeString(shipping.address.postalCode),
            address1: normalizeString(shipping.address.address1),
            address2: normalizeString(shipping.address.address2),
          },
          request: normalizeString(shipping.request),
          carrier: normalizeString(shipping.carrier),
          trackingNumber: normalizeString(shipping.trackingNumber),
          dispatchedAt: shipping.dispatchedAt ? new Date(shipping.dispatchedAt) : undefined,
          deliveredAt: shipping.deliveredAt ? new Date(shipping.deliveredAt) : undefined,
        },
        sourceCart,
        notes: normalizeString(notes),
        audit: [
          {
            status: orderStatus,
            message: '주문 생성',
            actor: req.user ? req.user._id : undefined,
          },
        ],
        placedAt: new Date(),
      };

      const order = await Order.create([orderPayload], { session });
      const createdOrder = order[0];

      // 쿠폰 사용 처리
      if (userCouponId) {
        await UserCoupon.findByIdAndUpdate(userCouponId, {
          isUsed: true,
          usedAt: new Date(),
          orderId: createdOrder._id,
        }, { session });

        // 쿠폰 사용 횟수 증가
        if (couponInfo && couponInfo.couponId) {
          await Coupon.findByIdAndUpdate(couponInfo.couponId, {
            $inc: { usedCount: 1 },
          }, { session });
        }
      }

      // 포인트 사용 처리
      if (pointsUsedAmount > 0 && createdOrder.user) {
        const user = await User.findById(createdOrder.user).session(session);
        if (user) {
          const currentPoints = user.points || 0;
          const newBalance = currentPoints - pointsUsedAmount;

          user.points = newBalance;
          await user.save({ session });

          // 포인트 사용 내역 저장
          await PointHistory.create([{
            user: createdOrder.user,
            type: 'use',
            amount: -pointsUsedAmount,
            balance: newBalance,
            description: `주문 결제 사용 (주문번호: ${createdOrder.orderNumber})`,
            relatedOrder: createdOrder._id,
          }], { session });
        }
      }

      // 트랜잭션 커밋
      await session.commitTransaction();

      // 재고 이력에 주문 ID 업데이트
      for (const update of inventoryUpdates) {
        await InventoryHistory.updateMany(
          { product: update.productId, order: null },
          { $set: { order: createdOrder._id } }
        );
      }

      // 결제 완료된 경우 적립금 적립 (트랜잭션 외부에서 처리)
      if (createdOrder.payment?.status === 'paid' && createdOrder.user) {
        await earnOrderRewardPoints(createdOrder);
      }

      const populatedOrder = await Order.findById(createdOrder._id).populate('user', 'name email user_type');
      
      // Slack 알림 전송 (비동기로 처리, 에러가 발생해도 주문 생성은 성공)
      sendSlackOrderNotification(populatedOrder).catch((error) => {
        console.error('Slack 주문 알림 전송 실패:', error);
      });
      
      return res.status(201).json(populatedOrder);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // 쿠폰 사용 처리
    if (userCouponId) {
      await UserCoupon.findByIdAndUpdate(userCouponId, {
        isUsed: true,
        usedAt: new Date(),
        orderId: order._id,
      });

      // 쿠폰 사용 횟수 증가
      if (couponInfo && couponInfo.couponId) {
        await Coupon.findByIdAndUpdate(couponInfo.couponId, {
          $inc: { usedCount: 1 },
        });
      }
    }

    // 바로 구매가 아닌 경우에도 장바구니를 유지하기 위해 상태 변경하지 않음
    // 주문 기록은 sourceCart 필드로 추적 가능
    // if (order.sourceCart) {
    //   await Cart.findByIdAndUpdate(order.sourceCart, {
    //     status: 'ordered',
    //     lockedAt: new Date(),
    //   });
    // }

    // 결제 완료된 경우 적립금 적립
    if (order.payment?.status === 'paid' && order.user) {
      await earnOrderRewardPoints(order);
    }

    const populatedOrder = await order.populate('user', 'name email user_type');
    return res.status(201).json(populatedOrder);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.orderNumber) {
      error.status = 409;
      error.message = '이미 존재하는 주문번호입니다.';
    }
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const { status, userId } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const isAdmin = req.user && req.user.user_type === 'admin';

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (isAdmin && userId) {
      filter.user = userId;
    } else if (!isAdmin) {
      filter.user = req.user._id;
    }

    const [orders, totalItems] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email user_type'),
      Order.countDocuments(filter),
    ]);

    // items의 product populate
    const items = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toObject ? order.toObject() : order;
        if (orderObj.items && orderObj.items.length > 0) {
          const productIds = orderObj.items.map(item => item.product).filter(Boolean);
          if (productIds.length > 0) {
            const Product = require('../models/product');
            const products = await Product.find({ _id: { $in: productIds } })
              .select('name image images')
              .lean();
            const productMap = new Map(products.map(p => [p._id.toString(), p]));
            
            orderObj.items = orderObj.items.map(item => {
              const product = productMap.get(item.product?.toString());
              return {
                ...item,
                product: product ? {
                  _id: product._id,
                  name: product.name,
                  image: product.images?.[0] || product.image,
                } : null,
              };
            });
          }
        }
        return orderObj;
      })
    );

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    return res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items,
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    
    // _id 또는 orderNumber로 조회
    let order;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId 형식인 경우
      order = await Order.findById(id).populate('user', 'name email user_type');
    } else {
      // orderNumber인 경우
      order = await Order.findOne({ orderNumber: id }).populate('user', 'name email user_type');
    }

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // 관리자는 모든 주문 조회 가능
    const isAdmin = req.user && req.user.user_type === 'admin';
    if (isAdmin) {
      return res.json(order);
    }

    // 회원 주문인 경우
    if (order.user) {
      if (!canAccessOrder(req.user, order)) {
        return res.status(403).json({ message: '이 주문을 조회할 권한이 없습니다.' });
      }
    } else {
      // 비회원 주문인 경우
      const accessToken = req.headers['x-guest-access-token'] || req.query.accessToken;
      const email = req.query.email;
      const phone = req.query.phone;
      const guestSessionId = req.headers['x-guest-session-id'] || req.query.guestSessionId;
      
      if (!canAccessGuestOrder(order, guestSessionId, accessToken, email, phone)) {
        return res.status(403).json({ message: '이 주문을 조회할 권한이 없습니다.' });
      }
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

// 비회원 주문 조회 API (별도 엔드포인트)
async function lookupGuestOrder(req, res, next) {
  try {
    const { orderNumber, email, phone, accessToken } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ message: '주문번호는 필수입니다.' });
    }

    const order = await Order.findOne({ orderNumber }).populate('user', 'name email user_type');

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (!order.isGuest) {
      return res.status(400).json({ message: '회원 주문은 로그인 후 조회해주세요.' });
    }

    // 비회원 주문 접근 권한 확인
    if (!canAccessGuestOrder(order, null, accessToken, email, phone)) {
      return res.status(403).json({ message: '주문 정보가 일치하지 않습니다.' });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const isAdmin = req.user && req.user.user_type === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: '주문을 수정할 권한이 없습니다.' });
    }

    const { status, payment, shipping, summary, notes, contact, auditMessage } = req.body || {};

    const auditEntries = [];

    if (status && status !== order.status) {
      const previousStatus = order.status;
      order.status = status;
      
      if (status === 'cancelled') {
        order.cancelledAt = new Date();
        // 주문 취소 시 재고 복구 (트랜잭션 없이 처리 - 이미 취소된 주문이므로)
        // 실제 재고 복구는 cancelOrder 함수에서 처리됨
      }

      auditEntries.push({
        status,
        message: normalizeString(auditMessage) || '주문 상태가 변경되었습니다.',
        actor: req.user ? req.user._id : undefined,
      });
    }

    if (payment) {
      const previousPaymentStatus = order.payment?.status;
      order.set('payment', {
        ...normalizeSubdocument(order.payment),
        ...payment,
        currency: (payment.currency || order.payment?.currency || 'KRW').toUpperCase(),
      });

      // 결제 상태가 'paid'로 변경된 경우 적립금 적립
      if (previousPaymentStatus !== 'paid' && payment.status === 'paid' && order.user) {
        await earnOrderRewardPoints(order);
      }
    }

    if (shipping) {
      const previousTrackingNumber = order.shipping?.trackingNumber;
      const newTrackingNumber = shipping.trackingNumber;
      const previousDispatchedAt = order.shipping?.dispatchedAt;
      const newDispatchedAt = shipping.dispatchedAt;

      order.set('shipping', {
        ...normalizeSubdocument(order.shipping),
        ...shipping,
        address: {
          ...normalizeSubdocument(order.shipping?.address),
          ...shipping.address,
        },
      });

      // 배송 추적 번호가 새로 입력되거나 배송 시작 시간이 설정되면 fulfilled 상태로 변경
      if ((newTrackingNumber && newTrackingNumber !== previousTrackingNumber) || 
          (newDispatchedAt && !previousDispatchedAt)) {
        if (order.status === 'paid' || order.status === 'pending') {
          order.status = 'fulfilled';
          auditEntries.push({
            status: 'fulfilled',
            message: '배송 시작',
            actor: req.user ? req.user._id : undefined,
          });
          
          // 배송 예상일 계산 (배송 시작일 + 예상 소요일)
          const estimatedDays = shipping.estimatedDays || 3; // 기본값 3일
          if (newDispatchedAt) {
            const estimatedDelivery = new Date(newDispatchedAt);
            estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);
            order.shipping.estimatedDelivery = estimatedDelivery;
          }
          
          // 배송 시작 알림 생성
          if (order.user) {
            try {
              await Notification.create({
                user: order.user,
                type: 'order_status',
                title: '배송이 시작되었습니다',
                message: `주문번호 ${order.orderNumber}의 배송이 시작되었습니다. 운송장 번호: ${newTrackingNumber || '등록 예정'}`,
                relatedOrder: order._id,
                isRead: false,
              });
            } catch (notificationError) {
              console.error('배송 시작 알림 생성 실패:', notificationError);
              // 알림 생성 실패가 주문 업데이트에 영향을 주지 않도록 에러 무시
            }
          }
        }
      }

      // 배송 완료 시간이 설정되면 상태 확인 (이미 fulfilled일 수 있음)
      if (shipping.deliveredAt && !order.shipping?.deliveredAt) {
        if (order.status !== 'fulfilled') {
          order.status = 'fulfilled';
          auditEntries.push({
            status: 'fulfilled',
            message: '배송 완료',
            actor: req.user ? req.user._id : undefined,
          });
        }
        
        // 배송 완료 알림 생성
        if (order.user) {
          try {
            await Notification.create({
              user: order.user,
              type: 'order_status',
              title: '배송이 완료되었습니다',
              message: `주문번호 ${order.orderNumber}의 배송이 완료되었습니다.`,
              relatedOrder: order._id,
              isRead: false,
            });
          } catch (notificationError) {
            console.error('배송 완료 알림 생성 실패:', notificationError);
            // 알림 생성 실패가 주문 업데이트에 영향을 주지 않도록 에러 무시
          }
        }
      }
    }

    if (summary) {
      order.set('summary', {
        ...normalizeSubdocument(order.summary),
        ...summary,
        currency: (summary.currency || order.summary?.currency || 'KRW').toUpperCase(),
      });
    }

    if (notes !== undefined) {
      order.notes = normalizeString(notes);
    }

    if (contact) {
      order.set('contact', {
        ...normalizeSubdocument(order.contact),
        phone: normalizeString(contact.phone ?? order.contact?.phone),
        email: normalizeString(contact.email ?? order.contact?.email).toLowerCase(),
      });
    }

    if (auditEntries.length) {
      order.audit.push(...auditEntries);
    }

    await order.save();

    const populatedOrder = await order.populate('user', 'name email user_type');

    return res.json(populatedOrder);
  } catch (error) {
    return next(error);
  }
}

async function cancelOrder(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (!canAccessOrder(req.user, order)) {
      await session.abortTransaction();
      return res.status(403).json({ message: '이 주문을 취소할 권한이 없습니다.' });
    }

    if (order.status === 'cancelled') {
      await session.abortTransaction();
      const populated = await order.populate('user', 'name email user_type');
      return res.json(populated);
    }

    // 취소 불가능한 상태 확인
    if (order.status === 'refunded') {
      await session.abortTransaction();
      return res.status(400).json({ message: '이미 환불된 주문은 취소할 수 없습니다.' });
    }

    // 재고 복구
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);
      if (product && product.inventory) {
        const currentStock = product.inventory.stock || 0;
        const currentReserved = product.inventory.reserved || 0;
        const newReserved = Math.max(0, currentReserved - item.quantity);

        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: { 'inventory.reserved': -item.quantity },
            'inventory.updatedAt': new Date(),
          },
          { session }
        );

        // 재고 이력 기록
        await InventoryHistory.create([{
          product: item.product,
          order: order._id,
          type: 'restore',
          quantity: item.quantity,
          previousStock: currentStock,
          newStock: currentStock,
          previousReserved: currentReserved,
          newReserved: newReserved,
          reason: `주문 취소: ${item.name}`,
          actor: req.user ? req.user._id : undefined,
        }], { session });
      }
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();

    if (req.body && req.body.paymentStatus) {
      order.set('payment', {
        ...normalizeSubdocument(order.payment),
        status: req.body.paymentStatus,
      });
    }

    order.audit.push({
      status: 'cancelled',
      message:
        normalizeString(req.body && req.body.auditMessage) || '주문이 취소되었습니다.',
      actor: req.user ? req.user._id : undefined,
    });

    await order.save({ session });

    // 트랜잭션 커밋
    await session.commitTransaction();

    const populatedOrder = await Order.findById(order._id).populate('user', 'name email user_type');
    return res.json(populatedOrder);
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
}

/**
 * Slack 주문 알림 전송
 */
async function sendSlackOrderNotification(order) {
  try {
    // Slack Webhook URL (환경변수에서만 가져오기)
    const SLACK_WEBHOOK_ORDER = process.env.SLACK_WEBHOOK_ORDER;
    const SLACK_WEBHOOK_ADMIN = process.env.SLACK_WEBHOOK_ADMIN;
    
    // 환경변수가 없으면 알림 전송 건너뛰기
    if (!SLACK_WEBHOOK_ORDER && !SLACK_WEBHOOK_ADMIN) {
      console.log('Slack Webhook URL이 설정되지 않아 알림을 전송하지 않습니다.');
      return;
    }

    // 주문 정보 포맷팅
    const orderNumber = order.orderNumber || 'N/A';
    const totalAmount = order.summary?.grandTotal || order.summary?.total || 0;
    const formattedAmount = new Intl.NumberFormat('ko-KR').format(totalAmount);
    
    // 고객 정보
    const customerName = order.user?.name || order.guestName || '비회원';
    const customerEmail = order.user?.email || order.guestEmail || order.contact?.email || 'N/A';
    const customerPhone = order.contact?.phone || order.shipping?.address?.phone || 'N/A';
    const isGuest = order.isGuest || !order.user;
    
    // 주문 상품 목록
    const itemsList = order.items?.map((item, index) => {
      const itemTotal = item.lineTotal || (item.quantity * item.unitPrice);
      return `${index + 1}. ${item.name} (${item.quantity}개) - ${new Intl.NumberFormat('ko-KR').format(itemTotal)}원`;
    }).join('\n') || '상품 정보 없음';
    
    // 배송지 정보
    const shippingAddress = order.shipping?.address;
    const address = shippingAddress 
      ? `${shippingAddress.address1} ${shippingAddress.address2 || ''}`.trim()
      : 'N/A';
    const recipientName = shippingAddress?.name || 'N/A';
    const recipientPhone = shippingAddress?.phone || 'N/A';
    
    // 결제 정보
    const paymentStatus = order.payment?.status || 'ready';
    const paymentMethod = order.payment?.method || 'N/A';
    const paymentStatusEmoji = paymentStatus === 'paid' ? '✅' : '⏳';
    
    // 메시지 구성
    const message = `🛒 *신규 주문 접수!*

*주문번호:* #${orderNumber}
*결제 상태:* ${paymentStatusEmoji} ${paymentStatus === 'paid' ? '결제 완료' : '결제 대기'}
*결제 수단:* ${paymentMethod}
*주문 금액:* ${formattedAmount}원

*고객 정보:*
• 이름: ${customerName} ${isGuest ? '(비회원)' : '(회원)'}
• 이메일: ${customerEmail}
• 전화번호: ${customerPhone}

*주문 상품:*
${itemsList}

*배송지 정보:*
• 수령인: ${recipientName}
• 전화번호: ${recipientPhone}
• 주소: ${address}
${order.shipping?.request ? `• 배송 요청사항: ${order.shipping.request}` : ''}

*주문 시간:* ${new Date(order.placedAt || Date.now()).toLocaleString('ko-KR')}`;

    // Slack 메시지 전송 (#order 채널)
    if (SLACK_WEBHOOK_ORDER) {
      await fetch(SLACK_WEBHOOK_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
        }),
      });
    }

    // 관리자 채널에도 전송 (#admin 채널)
    if (SLACK_WEBHOOK_ADMIN) {
      await fetch(SLACK_WEBHOOK_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
        }),
      });
    }
  } catch (error) {
    // Slack 알림 실패는 로그만 남기고 주문 생성에는 영향 없음
    console.error('Slack 주문 알림 전송 중 오류:', error.message);
  }
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  lookupGuestOrder,
  cancelPortOnePayment, // 환불 처리를 위해 export
};


