import mongoose from 'mongoose';

const sellerPayoutSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  payoutNumber: {
    type: String,
    required: true
  },
  // 정산 기간
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  // 정산 금액
  totalSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  totalRefunds: {
    type: Number,
    default: 0
  },
  payoutAmount: {
    type: Number,
    required: true // 실제 정산 금액
  },
  // 정산 상태
  status: {
    type: String,
    enum: ['pending', 'calculated', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },
  // 정산 항목들
  items: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderNumber: String,
    orderDate: Date,
    salesAmount: Number,
    commissionRate: Number,
    commissionAmount: Number,
    refundAmount: Number,
    netAmount: Number // 최종 정산 금액
  }],
  // 처리 정보
  calculatedAt: Date,
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMethod: String, // 'bank_transfer' 등
  transactionId: String,
  notes: String
}, {
  timestamps: true
});

// 인덱스
sellerPayoutSchema.index({ sellerId: 1 });
sellerPayoutSchema.index({ payoutNumber: 1 }, { unique: true });
sellerPayoutSchema.index({ status: 1 });
sellerPayoutSchema.index({ periodStart: 1, periodEnd: 1 });

const SellerPayout = mongoose.model('SellerPayout', sellerPayoutSchema);

export default SellerPayout;

