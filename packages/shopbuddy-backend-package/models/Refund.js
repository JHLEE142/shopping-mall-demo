import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  refundNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  // 환불 타입: 전체/부분
  type: {
    type: String,
    enum: ['full', 'partial'],
    default: 'full'
  },
  // 환불 항목 (부분 환불 시)
  refundItems: [{
    orderItemIndex: Number,
    quantity: Number,
    amount: Number
  }],
  // 처리 정보
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  pgRefundId: String, // PG사 환불 ID
  notes: String
}, {
  timestamps: true
});

// 인덱스
refundSchema.index({ refundNumber: 1 }, { unique: true });
refundSchema.index({ orderId: 1 });
refundSchema.index({ status: 1 });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;

