const { Schema, model } = require('mongoose');

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['new_product', 'order_status', 'promotion', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedProduct: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = model('Notification', notificationSchema);

module.exports = Notification;

