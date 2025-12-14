const { Schema, model } = require('mongoose');

const productInquirySchema = new Schema(
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
    question: {
      type: String,
      required: true,
      trim: true,
    },
    isSecret: {
      type: Boolean,
      default: false, // 비밀글 여부
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'closed'],
      default: 'pending',
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스
productInquirySchema.index({ productId: 1, createdAt: -1 });
productInquirySchema.index({ userId: 1, createdAt: -1 });
productInquirySchema.index({ status: 1, createdAt: -1 });

module.exports = model('ProductInquiry', productInquirySchema);

