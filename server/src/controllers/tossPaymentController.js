const TOSS_PAYMENTS_API_BASE_URL = 'https://api.tosspayments.com/v1';

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * 토스페이먼츠 결제 승인
 */
async function confirmPayment(req, res, next) {
  try {
    const { paymentKey, orderId, amount } = req.body;

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
      return res.status(response.status).json({
        message: data.message || '결제 승인에 실패했습니다.',
        code: data.code,
        error: data,
      });
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
    console.error('토스페이먼츠 결제 승인 오류:', error);
    return next(error);
  }
}

module.exports = {
  confirmPayment,
};

