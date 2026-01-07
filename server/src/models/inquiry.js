const { Schema, model } = require('mongoose');

const INQUIRY_STATUSES = ['pending', 'answered', 'closed'];
const INQUIRY_TYPES = ['general', 'order', 'product', 'payment', 'delivery', 'return', 'other'];

const inquirySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: INQUIRY_TYPES,
      default: 'general',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, '제목은 200자 이하여야 합니다.'],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: INQUIRY_STATUSES,
      default: 'pending',
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    answer: {
      content: {
        type: String,
        default: '',
        trim: true,
      },
      answeredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      answeredAt: {
        type: Date,
        default: null,
      },
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스
inquirySchema.index({ user: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ type: 1, createdAt: -1 });

module.exports = model('Inquiry', inquirySchema);

