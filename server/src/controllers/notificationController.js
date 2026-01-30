const Notification = require('../models/notification');
const ProductNotificationSubscription = require('../models/productNotificationSubscription');
const createHttpError = require('http-errors');

/**
 * 신상품 알림 구독
 */
async function subscribeToNewProducts(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(401, '로그인이 필요합니다.');
    }

    const userId = req.user._id;

    // 이미 구독 중인지 확인
    let subscription = await ProductNotificationSubscription.findOne({ user: userId });

    if (subscription) {
      // 이미 구독 중이면 활성화
      if (!subscription.isActive) {
        subscription.isActive = true;
        subscription.subscribedAt = new Date();
        await subscription.save();
      }
    } else {
      // 새로 구독
      subscription = await ProductNotificationSubscription.create({
        user: userId,
        isActive: true,
      });
    }

    res.json({
      success: true,
      message: '신상품 알림 구독이 완료되었습니다.',
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 신상품 알림 구독 해제
 */
async function unsubscribeFromNewProducts(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(401, '로그인이 필요합니다.');
    }

    const userId = req.user._id;

    const subscription = await ProductNotificationSubscription.findOne({ user: userId });

    if (subscription) {
      subscription.isActive = false;
      await subscription.save();
    }

    res.json({
      success: true,
      message: '신상품 알림 구독이 해제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 구독 상태 확인
 */
async function getSubscriptionStatus(req, res, next) {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        subscribed: false,
      });
    }

    const userId = req.user._id;
    const subscription = await ProductNotificationSubscription.findOne({ user: userId });

    res.json({
      success: true,
      subscribed: subscription?.isActive || false,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자 알림 목록 조회
 */
async function getUserNotifications(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(401, '로그인이 필요합니다.');
    }

    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate({
        path: 'relatedProduct',
        select: 'name image',
        // 삭제된 상품도 null로 유지 (제거하지 않음)
        match: { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }
      })
      .populate('relatedOrder', 'orderNumber')
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 알림 읽음 처리
 */
async function markNotificationAsRead(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(401, '로그인이 필요합니다.');
    }

    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      throw createHttpError(404, '알림을 찾을 수 없습니다.');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: '알림이 읽음 처리되었습니다.',
      notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 모든 알림 읽음 처리
 */
async function markAllNotificationsAsRead(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(401, '로그인이 필요합니다.');
    }

    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  subscribeToNewProducts,
  unsubscribeFromNewProducts,
  getSubscriptionStatus,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

