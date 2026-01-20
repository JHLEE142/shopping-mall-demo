const { Schema, model } = require('mongoose');

const DEFAULT_ORDER_PAUSE_MESSAGE = '현재 주문이 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.';

const adminSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    orderPause: {
      isPaused: { type: Boolean, default: false },
      message: { type: String, default: DEFAULT_ORDER_PAUSE_MESSAGE, trim: true },
      updatedAt: { type: Date, default: null },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
  },
  { timestamps: true }
);

module.exports = model('AdminSetting', adminSettingSchema);
