const AdminSetting = require('../models/adminSetting');

const DEFAULT_ORDER_PAUSE_MESSAGE = '현재 주문이 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.';

function normalizeOrderPauseMessage(message) {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  return trimmed || DEFAULT_ORDER_PAUSE_MESSAGE;
}

async function getOrderPause(req, res, next) {
  try {
    const settings = await AdminSetting.findOne({ key: 'orderPause' }).lean();
    if (!settings) {
      const created = await AdminSetting.create({
        key: 'orderPause',
        orderPause: {
          isPaused: false,
          message: DEFAULT_ORDER_PAUSE_MESSAGE,
        },
      });
      return res.json(created.orderPause);
    }
    return res.json({
      isPaused: Boolean(settings.orderPause?.isPaused),
      message: normalizeOrderPauseMessage(settings.orderPause?.message),
      updatedAt: settings.orderPause?.updatedAt || null,
      updatedBy: settings.orderPause?.updatedBy || null,
    });
  } catch (error) {
    next(error);
  }
}

async function updateOrderPause(req, res, next) {
  try {
    const { isPaused, message } = req.body || {};
    const payload = {
      isPaused: Boolean(isPaused),
      message: normalizeOrderPauseMessage(message),
      updatedAt: new Date(),
      updatedBy: req.user?._id || null,
    };

    const settings = await AdminSetting.findOneAndUpdate(
      { key: 'orderPause' },
      { $set: { orderPause: payload }, $setOnInsert: { key: 'orderPause' } },
      { new: true, upsert: true }
    ).lean();

    res.json({
      isPaused: Boolean(settings.orderPause?.isPaused),
      message: normalizeOrderPauseMessage(settings.orderPause?.message),
      updatedAt: settings.orderPause?.updatedAt || null,
      updatedBy: settings.orderPause?.updatedBy || null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrderPause,
  updateOrderPause,
};
