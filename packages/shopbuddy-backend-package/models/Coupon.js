import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true
  },
  // 할인 유형: 'percent' (할인율), 'amount' (할인금액), 'shipping' (무료배송)
  discountType: {
    type: String,
    enum: ['percent', 'amount', 'shipping'],
    required: true
  },
  // 할인율 또는 할인금액
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  // 최소 구매금액 (0이면 제한 없음)
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  // 최대 할인금액 (할인율 쿠폰의 경우)
  maxDiscount: {
    type: Number,
    default: null,
    min: 0
  },
  // 유효기간
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  // 전체 최대 발급 수량 (null이면 무제한)
  maxIssues: {
    type: Number,
    default: null,
    min: 1
  },
  // 사용자당 최대 발급 수량
  maxIssuesPerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  // 발급 방식: 'auto' (자동 발급), 'manual' (수동 발급), 'code' (코드 입력)
  issueType: {
    type: String,
    enum: ['auto', 'manual', 'code'],
    default: 'manual'
  },
  // 적용 가능한 카테고리 (빈 배열이면 전체 카테고리)
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // 적용 가능한 상품 (빈 배열이면 전체 상품)
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // 활성화 여부
  isActive: {
    type: Boolean,
    default: true
  },
  // 발급된 쿠폰 수
  issuedCount: {
    type: Number,
    default: 0
  },
  // 사용된 쿠폰 수
  usedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 인덱스
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ issueType: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;

