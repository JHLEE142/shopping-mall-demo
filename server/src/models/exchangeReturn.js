const { Schema, model } = require('mongoose');

const EXCHANGE_RETURN_STATUSES = ['pending', 'processing', 'completed', 'rejected', 'cancelled'];
const SOLUTION_TYPES = ['return-refund', 'exchange'];
const COLLECTION_LOCATIONS = ['door', 'security', 'other'];

const exchangeReturnItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, '수량은 최소 1개 이상이어야 합니다.'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, '단가는 0 이상이어야 합니다.'],
    },
  },
  { _id: false }
);

const exchangeReturnSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [exchangeReturnItemSchema],
      validate: [
        (items) => Array.isArray(items) && items.length > 0,
        '반품/교환 상품은 최소 한 개 이상이어야 합니다.',
      ],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'not-satisfied',
        'cheaper-found',
        'wrong-product',
        'box-lost',
        'wrong-address',
        'partial-problem',
        'missing-parts',
        'different-description',
        'damaged',
        'defect',
      ],
    },
    reasonLabel: {
      type: String,
      required: true,
      trim: true,
    },
    solution: {
      type: String,
      required: true,
      enum: SOLUTION_TYPES,
    },
    status: {
      type: String,
      enum: EXCHANGE_RETURN_STATUSES,
      default: 'pending',
      index: true,
    },
    collectionDate: {
      type: Date,
      required: true,
    },
    collectionLocation: {
      type: {
        type: String,
        enum: COLLECTION_LOCATIONS,
        required: true,
      },
      customText: {
        type: String,
        default: '',
        trim: true,
      },
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, '환불 금액은 0 이상이어야 합니다.'],
    },
    refundMethod: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    rejectedReason: {
      type: String,
      default: '',
      trim: true,
    },
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

exchangeReturnSchema.index({ user: 1, createdAt: -1 });
exchangeReturnSchema.index({ order: 1 });

module.exports = model('ExchangeReturn', exchangeReturnSchema);

