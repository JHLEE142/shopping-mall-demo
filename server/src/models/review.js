const { Schema, model } = require('mongoose');

const reviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      default: '',
      trim: true,
    },
    fit: {
      type: String,
      default: '',
      trim: true, // e.g., "정사이즈", "작음", "큼"
    },
    purchaseSize: {
      type: String,
      default: '',
      trim: true, // e.g., "구매 사이즈: M"
    },
    images: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    purpose: {
      type: String,
      default: '',
      trim: true, // e.g., "러닝", "트레이닝"
    },
    isVerified: {
      type: Boolean,
      default: false, // 구매 확인 여부
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // 사용자당 상품당 1개 리뷰만

module.exports = model('Review', reviewSchema);

