const { Schema, model } = require('mongoose');

const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'];

const orderItemSchema = new Schema(
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
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    options: {
      type: Map,
      of: String,
      default: {},
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
    lineDiscount: {
      type: Number,
      default: 0,
      min: [0, '할인액은 0 이상이어야 합니다.'],
    },
    lineTotal: {
      type: Number,
      required: true,
      min: [0, '라인 총액은 0 이상이어야 합니다.'],
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: function() {
        return !this.user;
      },
      index: true,
    },
    guestName: {
      type: String,
      default: '',
      trim: true,
    },
    guestEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    guestAuth: {
      accessToken: {
        type: String,
        default: '',
        trim: true,
        index: true,
        sparse: true,
      },
      tokenExpiresAt: {
        type: Date,
        default: null,
      },
      passwordHash: {
        type: String,
        default: '',
        trim: true,
      },
    },
    contact: {
      phone: {
        type: String,
        default: '',
        trim: true,
      },
      email: {
        type: String,
        default: '',
        lowercase: true,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (items) => Array.isArray(items) && items.length > 0,
        '주문에는 최소 한 개 이상의 상품이 필요합니다.',
      ],
      required: true,
    },
    summary: {
      currency: {
        type: String,
        default: 'KRW',
        uppercase: true,
      },
      subtotal: {
        type: Number,
        required: true,
        min: [0, '상품 총액은 0 이상이어야 합니다.'],
      },
      discountTotal: {
        type: Number,
        default: 0,
        min: [0, '할인 총액은 0 이상이어야 합니다.'],
      },
      shippingFee: {
        type: Number,
        default: 0,
        min: [0, '배송비는 0 이상이어야 합니다.'],
      },
      tax: {
        type: Number,
        default: 0,
        min: [0, '세금은 0 이상이어야 합니다.'],
      },
      grandTotal: {
        type: Number,
        required: true,
        min: [0, '결제 금액은 0 이상이어야 합니다.'],
      },
      couponDiscount: {
        type: Number,
        default: 0,
        min: [0, '쿠폰 할인액은 0 이상이어야 합니다.'],
      },
      pointsDiscount: {
        type: Number,
        default: 0,
        min: [0, '포인트 할인액은 0 이상이어야 합니다.'],
      },
    },
    coupon: {
      couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
      },
      userCouponId: {
        type: Schema.Types.ObjectId,
        ref: 'UserCoupon',
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
    },
    payment: {
      method: {
        type: String,
        default: '',
        trim: true,
      },
      status: {
        type: String,
        default: 'ready',
        trim: true,
      },
      amount: {
        type: Number,
        default: 0,
        min: [0, '결제 금액은 0 이상이어야 합니다.'],
      },
      currency: {
        type: String,
        default: 'KRW',
        uppercase: true,
      },
      transactionId: {
        type: String,
        default: '',
        trim: true,
      },
      receiptUrl: {
        type: String,
        default: '',
        trim: true,
      },
      paidAt: {
        type: Date,
      },
    },
    shipping: {
      address: {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
        },
        postalCode: {
          type: String,
          required: true,
          trim: true,
        },
        address1: {
          type: String,
          required: true,
          trim: true,
        },
        address2: {
          type: String,
          default: '',
          trim: true,
        },
      },
      request: {
        type: String,
        default: '',
        trim: true,
      },
      carrier: {
        type: String,
        default: '',
        trim: true,
      },
      status: {
        type: String,
        default: '',
        trim: true,
      },
      trackingNumber: {
        type: String,
        default: '',
        trim: true,
      },
      dispatchedAt: {
        type: Date,
      },
      deliveredAt: {
        type: Date,
      },
      estimatedDays: {
        type: Number,
        default: 3,
        min: [1, '예상 배송일은 최소 1일 이상이어야 합니다.'],
      },
      estimatedDelivery: {
        type: Date,
      },
    },
    sourceCart: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    audit: [
      {
        status: {
          type: String,
          enum: ORDER_STATUSES,
        },
        message: {
          type: String,
          default: '',
          trim: true,
        },
        actor: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    placedAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 기존 인덱스 (회원 주문용)
orderSchema.index({ user: 1, placedAt: -1 });

// 비회원 주문 조회용 인덱스
orderSchema.index({ isGuest: 1, orderNumber: 1 });
orderSchema.index({ isGuest: 1, 'contact.email': 1 });
orderSchema.index({ isGuest: 1, 'contact.phone': 1 });
orderSchema.index({ 'guestAuth.accessToken': 1 }, { sparse: true });

module.exports = model('Order', orderSchema);


