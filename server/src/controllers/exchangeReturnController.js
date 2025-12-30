const ExchangeReturn = require('../models/exchangeReturn');
const Order = require('../models/order');

const REASON_LABELS = {
  'not-satisfied': '상품이 마음에 들지 않음',
  'cheaper-found': '더 저렴한 상품을 발견함',
  'wrong-product': '다른 상품이 배송됨',
  'box-lost': '배송된 장소에 박스가 분실됨',
  'wrong-address': '다른 주소로 배송됨',
  'partial-problem': '상품 일부에 문제가 있음',
  'missing-parts': '상품의 구성품/부속품이 들어있지 않음',
  'different-description': '상품이 설명과 다름',
  'damaged': '상품이 파손되어 배송됨',
  'defect': '상품 결함/기능에 이상이 있음',
};

function sanitizeExchangeReturn(exchangeReturn) {
  if (!exchangeReturn) {
    return null;
  }
  const obj = exchangeReturn.toObject ? exchangeReturn.toObject() : { ...exchangeReturn };
  return obj;
}

async function createExchangeReturn(req, res, next) {
  try {
    const {
      orderId,
      items = [],
      reason,
      solution,
      collectionDate,
      collectionLocation,
      refundAmount = 0,
      refundMethod = '',
      notes = '',
    } = req.body;

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (!orderId) {
      return res.status(400).json({ message: '주문 ID가 필요합니다.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '반품/교환할 상품이 필요합니다.' });
    }

    if (!reason) {
      return res.status(400).json({ message: '반품/교환 사유가 필요합니다.' });
    }

    if (!solution) {
      return res.status(400).json({ message: '해결방법이 필요합니다.' });
    }

    if (!collectionDate) {
      return res.status(400).json({ message: '회수 예정일이 필요합니다.' });
    }

    // 주문 확인
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // 주문 소유자 확인
    const orderUserId = order.user?._id?.toString() || order.user?.toString() || order.userId?.toString();
    if (orderUserId !== userId.toString()) {
      return res.status(403).json({ message: '해당 주문에 대한 권한이 없습니다.' });
    }

    // 사유 라벨 가져오기
    const reasonLabel = REASON_LABELS[reason] || reason;

    // 회수 위치 처리
    const collectionLocationData = {
      type: collectionLocation.type || collectionLocation,
      customText: collectionLocation.type === 'other' ? collectionLocation.customText || collectionLocation.customLocation || '' : '',
    };

    const exchangeReturn = await ExchangeReturn.create({
      order: orderId,
      user: userId,
      items: items.map((item) => ({
        product: item.productId || item.product,
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
      })),
      reason,
      reasonLabel,
      solution,
      collectionDate: new Date(collectionDate),
      collectionLocation: collectionLocationData,
      refundAmount: solution === 'return-refund' ? refundAmount : 0,
      refundMethod,
      notes,
      status: 'pending',
    });

    res.status(201).json(sanitizeExchangeReturn(exchangeReturn));
  } catch (error) {
    console.error('교환/반품 신청 생성 오류:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((err) => err.message);
      return res.status(400).json({ message: messages[0] || '입력 정보를 확인해주세요.' });
    }
    next(error);
  }
}

async function getExchangeReturns(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user && req.user.user_type === 'admin';

    const filter = {};
    if (!isAdmin) {
      filter.user = userId;
    }
    if (status) {
      filter.status = status;
    }

    const [items, totalItems] = await Promise.all([
      ExchangeReturn.find(filter)
        .populate('order', 'orderNumber')
        .populate('user', 'name email')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExchangeReturn.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items: items.map(sanitizeExchangeReturn),
    });
  } catch (error) {
    next(error);
  }
}

async function getExchangeReturnById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user && req.user.user_type === 'admin';

    const exchangeReturn = await ExchangeReturn.findById(id)
      .populate('order')
      .populate('user', 'name email')
      .populate('items.product', 'name sku image');

    if (!exchangeReturn) {
      return res.status(404).json({ message: '교환/반품 신청을 찾을 수 없습니다.' });
    }

    // 권한 확인
    const exchangeReturnUserId = exchangeReturn.user?._id?.toString() || exchangeReturn.user?.toString();
    if (!isAdmin && exchangeReturnUserId !== userId.toString()) {
      return res.status(403).json({ message: '해당 교환/반품 신청에 대한 권한이 없습니다.' });
    }

    res.json(sanitizeExchangeReturn(exchangeReturn));
  } catch (error) {
    next(error);
  }
}

async function updateExchangeReturnStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, rejectedReason, notes } = req.body;

    const isAdmin = req.user && req.user.user_type === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    if (!status) {
      return res.status(400).json({ message: '상태가 필요합니다.' });
    }

    const updateData = { status };
    if (status === 'rejected' && rejectedReason) {
      updateData.rejectedReason = rejectedReason;
    }
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    if (status === 'processing') {
      updateData.processedAt = new Date();
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const exchangeReturn = await ExchangeReturn.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('order')
      .populate('user', 'name email');

    if (!exchangeReturn) {
      return res.status(404).json({ message: '교환/반품 신청을 찾을 수 없습니다.' });
    }

    res.json(sanitizeExchangeReturn(exchangeReturn));
  } catch (error) {
    next(error);
  }
}

async function cancelExchangeReturn(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user && req.user.user_type === 'admin';

    const exchangeReturn = await ExchangeReturn.findById(id);

    if (!exchangeReturn) {
      return res.status(404).json({ message: '교환/반품 신청을 찾을 수 없습니다.' });
    }

    // 권한 확인
    const exchangeReturnUserId = exchangeReturn.user?._id?.toString() || exchangeReturn.user?.toString();
    if (!isAdmin && exchangeReturnUserId !== userId.toString()) {
      return res.status(403).json({ message: '해당 교환/반품 신청을 취소할 권한이 없습니다.' });
    }

    // 취소 가능한 상태 확인
    if (exchangeReturn.status === 'completed' || exchangeReturn.status === 'rejected') {
      return res.status(400).json({ message: '이미 완료되거나 거절된 신청은 취소할 수 없습니다.' });
    }

    exchangeReturn.status = 'cancelled';
    await exchangeReturn.save();

    res.json(sanitizeExchangeReturn(exchangeReturn));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createExchangeReturn,
  getExchangeReturns,
  getExchangeReturnById,
  updateExchangeReturnStatus,
  cancelExchangeReturn,
};

