const { Schema, model } = require('mongoose');

const pointHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['earn', 'use', 'expire', 'refund'],
    },
    amount: {
      type: Number,
      required: true,
      // earn: 양수, use/expire: 음수
    },
    balance: {
      type: Number,
      required: true,
      // 거래 후 잔액
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    relatedProduct: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      // 적립금 만료일 (null이면 만료 없음)
    },
  },
  {
    timestamps: true,
  }
);

// 사용자별, 날짜별 조회를 위한 인덱스
pointHistorySchema.index({ user: 1, createdAt: -1 });
pointHistorySchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = model('PointHistory', pointHistorySchema);

