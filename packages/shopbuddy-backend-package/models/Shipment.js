import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  carrier: {
    type: String,
    trim: true // 택배사
  },
  status: {
    type: String,
    enum: ['preparing', 'shipped', 'in_transit', 'delivered', 'returned'],
    default: 'preparing'
  },
  shippedAt: Date,
  deliveredAt: Date,
  estimatedDelivery: Date,
  // 배송 추적 정보
  trackingHistory: [{
    status: String,
    location: String,
    timestamp: Date,
    description: String
  }],
  // 배송 주소 (주문서와 동일하지만 스냅샷)
  address: {
    recipientName: String,
    phone: String,
    postalCode: String,
    address1: String,
    address2: String,
    city: String,
    country: String
  }
}, {
  timestamps: true
});

// 인덱스
shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ status: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;

