const TOSS_PAYMENTS_API_BASE_URL = 'https://api.tosspayments.com/v1';
const Order = require('../models/order');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * 토스페이먼츠 결제 승인
 * 결제 승인 후 주문을 찾아서 PAID 상태로 업데이트
 */
async function confirmPayment(req, res, next) {
  try {
    const { paymentKey, orderId, amount } = req.body;

    console.log('[토스페이먼츠 결제 승인 요청]', { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        message: 'paymentKey, orderId, amount는 필수입니다.',
      });
    }

    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
    if (!secretKey) {
      throw createHttpError(500, '토스페이먼츠 Secret Key가 설정되지 않았습니다.');
    }

    // Secret Key를 Base64로 인코딩 (Basic Auth)
    const encodedSecretKey = Buffer.from(`${secretKey}:`).toString('base64');

    // 토스페이먼츠 결제 승인 API 호출
    const response = await fetch(`${TOSS_PAYMENTS_API_BASE_URL}/payments/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[토스페이먼츠 결제 승인 실패]', data);
      return res.status(response.status).json({
        message: data.message || '결제 승인에 실패했습니다.',
        code: data.code,
        error: data,
      });
    }

    console.log('[토스페이먼츠 결제 승인 성공]', {
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      amount: data.totalAmount,
      method: data.method,
      status: data.status,
    });

    // 결제 승인 성공 후 주문 찾기 및 업데이트
    // orderId는 토스페이먼츠에서 사용하는 주문번호이므로, 우리 DB의 orderNumber와 매칭
    // 또는 payment.transactionId로 찾기
    try {
      // 먼저 orderNumber로 찾기 시도
      let order = await Order.findOne({ orderNumber: orderId });
      
      // orderNumber로 못 찾으면 payment.transactionId로 찾기 시도
      if (!order) {
        order = await Order.findOne({ 'payment.transactionId': paymentKey });
      }

      if (order) {
        // 주문 금액 검증
        const orderTotal = order.summary?.grandTotal || 0;
        const paymentAmount = data.totalAmount;
        
        if (Math.abs(orderTotal - paymentAmount) > 1) { // 1원 오차 허용
          console.warn('[결제 금액 불일치]', {
            orderTotal,
            paymentAmount,
            orderId: order._id,
            orderNumber: order.orderNumber,
          });
        }

        // 주문 상태를 PAID로 업데이트
        order.status = 'paid';
        order.payment.status = 'paid';
        order.payment.transactionId = data.paymentKey;
        order.payment.amount = data.totalAmount;
        order.payment.method = data.method || 'online';
        order.payment.paidAt = data.approvedAt ? new Date(data.approvedAt) : new Date();
        if (data.receipt?.url) {
          order.payment.receiptUrl = data.receipt.url;
        }

        // audit 로그 추가
        order.audit.push({
          status: 'paid',
          message: `토스페이먼츠 결제 승인 완료 (${data.method || 'online'})`,
          createdAt: new Date(),
        });

        await order.save();
        console.log('[주문 업데이트 완료]', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
        });
      } else {
        console.warn('[토스페이먼츠 결제 승인] 주문을 찾을 수 없음 - PaymentSuccessPage에서 생성 예정', { 
          orderId, 
          paymentKey,
          searchAttempts: ['orderNumber', 'payment.transactionId']
        });
        // 주문이 없어도 결제 승인은 성공했으므로 응답은 성공으로 반환
        // (주문은 PaymentSuccessPage에서 생성할 수 있음)
      }
    } catch (dbError) {
      console.error('[주문 업데이트 오류]', dbError);
      // DB 업데이트 실패해도 결제 승인은 성공했으므로 응답은 성공으로 반환
    }

    // 결제 승인 성공
    return res.json({
      success: true,
      data: {
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.totalAmount,
        method: data.method,
        status: data.status,
        approvedAt: data.approvedAt,
        receipt: data.receipt,
      },
    });
  } catch (error) {
    console.error('[토스페이먼츠 결제 승인 오류]', error);
    return next(error);
  }
}

module.exports = {
  confirmPayment,
};

