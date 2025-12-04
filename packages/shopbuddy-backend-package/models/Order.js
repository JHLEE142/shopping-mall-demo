import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String, // 주문 시점의 상품명 (스냅샷)
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    selectedOptions: {
      type: Map,
      of: String
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    // 셀러 정보
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      default: null
    },
    ownershipType: {
      type: String,
      enum: ['seller', 'platform'],
      required: true
    },
    // 커미션 정보
    commissionRate: {
      type: Number,
      default: 0
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    sellerEarnings: {
      type: Number,
      default: 0 // 판매자 정산 금액
    }
  }],
  // 주문 금액
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  // 배송 정보
  shippingAddress: {
    recipientName: String,
    phone: String,
    postalCode: String,
    address1: String,
    address2: String,
    city: String,
    country: {
      type: String,
      default: 'KR'
    }
  },
  // 주문 상태
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // 결제 정보
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  // 메모
  notes: String,
  cancelledAt: Date,
  cancelledReason: String
}, {
  timestamps: true
});

// 인덱스
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.sellerId': 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

