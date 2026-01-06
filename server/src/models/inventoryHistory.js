const { Schema, model } = require('mongoose');

const inventoryHistorySchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['deduct', 'restore', 'manual', 'adjustment'],
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    previousReserved: {
      type: Number,
      default: 0,
    },
    newReserved: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
inventoryHistorySchema.index({ product: 1, createdAt: -1 });
inventoryHistorySchema.index({ order: 1 });
inventoryHistorySchema.index({ type: 1, createdAt: -1 });

const InventoryHistory = model('InventoryHistory', inventoryHistorySchema);

module.exports = InventoryHistory;

