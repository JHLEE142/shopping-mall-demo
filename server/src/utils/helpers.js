const crypto = require('crypto');

// 주문번호 생성
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// 결제번호 생성
const generatePaymentNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

// 환불번호 생성
const generateRefundNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `REF-${timestamp}-${random}`;
};

// 정산번호 생성
const generatePayoutNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `POUT-${timestamp}-${random}`;
};

// 세션 ID 생성
const generateSessionId = () => {
  return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

// 페이지네이션 계산
const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext,
    hasPrev
  };
};

// 커미션 계산
const calculateCommission = (amount, commissionRate) => {
  const commission = (amount * commissionRate) / 100;
  const sellerEarnings = amount - commission;
  return {
    commission: Math.round(commission),
    sellerEarnings: Math.round(sellerEarnings)
  };
};

module.exports = {
  generateOrderNumber,
  generatePaymentNumber,
  generateRefundNumber,
  generatePayoutNumber,
  generateSessionId,
  calculatePagination,
  calculateCommission
};

