const { Schema, model } = require('mongoose');

const CART_STATUSES = ['active', 'ordered', 'abandoned'];

const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: [0, 'Price snapshot must be a positive number'],
    },
    selectedOptions: {
      type: Map,
      of: String,
      default: {},
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    isGuest: {
      type: Boolean,
      default: function() {
        return !this.user;
      },
      index: true,
    },
    guestSessionId: {
      type: String,
      default: '',
      trim: true,
      index: true,
      sparse: true,
    },
    guestInfo: {
      deviceId: {
        type: String,
        default: '',
        trim: true,
        index: true,
        sparse: true,
      },
      ipAddress: {
        type: String,
        default: '',
        trim: true,
        index: true,
        sparse: true,
      },
      userAgent: {
        type: String,
        default: '',
        trim: true,
      },
      sessionCreatedAt: {
        type: Date,
        default: Date.now,
      },
      lastAccessedAt: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: CART_STATUSES,
      default: 'active',
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: [
        (items) => Array.isArray(items) && items.length > 0,
        'Cart must contain at least one item',
      ],
    },
    summary: {
      currency: {
        type: String,
        default: 'KRW',
        uppercase: true,
      },
      subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal must be a positive number'],
      },
      discountTotal: {
        type: Number,
        default: 0,
        min: [0, 'Discount total must be a positive number'],
      },
      shippingFee: {
        type: Number,
        default: 0,
        min: [0, 'Shipping fee must be a positive number'],
      },
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 기존 인덱스 (회원 장바구니용)
cartSchema.index({ user: 1, status: 1 });

// 비회원 장바구니 조회용 인덱스
cartSchema.index({ isGuest: 1, guestSessionId: 1 });
cartSchema.index({ isGuest: 1, 'guestInfo.deviceId': 1 });
cartSchema.index({ isGuest: 1, 'guestInfo.ipAddress': 1, status: 1 });
cartSchema.index({ isGuest: 1, status: 1, 'guestInfo.lastAccessedAt': -1 });

// 복합 인덱스 (비회원 장바구니 조회 최적화)
cartSchema.index({ 
  isGuest: 1, 
  'guestInfo.deviceId': 1, 
  'guestInfo.ipAddress': 1, 
  status: 1 
});

module.exports = model('Cart', cartSchema);

