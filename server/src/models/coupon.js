const { Schema, model } = require('mongoose');

const couponSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['freeShipping', 'fixedAmount', 'percentage'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    targetUsers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    targetType: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
    },
  },
  {
    timestamps: true,
  }
);

const userCouponSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
userCouponSchema.index({ userId: 1, isUsed: 1 });
userCouponSchema.index({ couponId: 1 });

module.exports = {
  Coupon: model('Coupon', couponSchema),
  UserCoupon: model('UserCoupon', userCouponSchema),
};

