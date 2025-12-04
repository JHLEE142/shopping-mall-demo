import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  paymentNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal', 'kakao_pay', 'naver_pay'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // PG사 정보
  pgProvider: String,
  pgTransactionId: String,
  pgResponse: mongoose.Schema.Types.Mixed, // PG사 응답 전체
  // 결제 완료 정보
  paidAt: Date,
  // 환불 정보
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String
}, {
  timestamps: true
});

// 인덱스
paymentSchema.index({ paymentNumber: 1 }, { unique: true });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ pgTransactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

