import mongoose from 'mongoose';

const userCouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  // 쿠폰 상태: 'available' (사용 가능), 'used' (사용 완료), 'expired' (만료됨)
  status: {
    type: String,
    enum: ['available', 'used', 'expired'],
    default: 'available'
  },
  // 사용일시
  usedAt: {
    type: Date,
    default: null
  },
  // 사용한 주문 ID
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  // 만료일시 (쿠폰의 validUntil과 동일하거나 더 짧을 수 있음)
  expiresAt: {
    type: Date,
    required: true
  },
  // 발급일시
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스
userCouponSchema.index({ userId: 1, status: 1 });
userCouponSchema.index({ couponId: 1 });
userCouponSchema.index({ userId: 1, couponId: 1 }); // 중복 발급 방지
userCouponSchema.index({ expiresAt: 1 }); // 만료된 쿠폰 조회용
userCouponSchema.index({ orderId: 1 });

// 만료된 쿠폰 자동 업데이트 (매일 실행되는 스크립트에서 사용)
userCouponSchema.statics.updateExpiredCoupons = async function() {
  const now = new Date();
  return await this.updateMany(
    {
      status: 'available',
      expiresAt: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

const UserCoupon = mongoose.model('UserCoupon', userCouponSchema);

export default UserCoupon;

