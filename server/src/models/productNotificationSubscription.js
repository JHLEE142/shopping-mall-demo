const { Schema, model } = require('mongoose');

const productNotificationSubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
productNotificationSubscriptionSchema.index({ user: 1, isActive: 1 });

const ProductNotificationSubscription = model('ProductNotificationSubscription', productNotificationSubscriptionSchema);

module.exports = ProductNotificationSubscription;

