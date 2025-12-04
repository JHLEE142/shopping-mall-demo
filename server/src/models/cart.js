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
      required: true,
      index: true,
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

cartSchema.index({ user: 1, status: 1 });

module.exports = model('Cart', cartSchema);

