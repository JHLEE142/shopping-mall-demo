const Order = require('../models/order');
const Cart = require('../models/cart');

const PORTONE_API_BASE_URL = 'https://api.iamport.kr';

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getPortOneAccessToken() {
  const apiKey = process.env.PORTONE_API_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw createHttpError(500, '포트원 API 인증 정보가 설정되지 않았습니다.');
  }

  const response = await fetch(`${PORTONE_API_BASE_URL}/users/getToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imp_key: apiKey,
      imp_secret: apiSecret,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.code !== 0) {
    const message = data?.message || '포트원 액세스 토큰 발급에 실패했습니다.';
    throw createHttpError(502, message);
  }

  return data.response?.access_token;
}

async function fetchPortOnePayment(impUid, accessToken) {
  const response = await fetch(`${PORTONE_API_BASE_URL}/payments/${impUid}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.code !== 0) {
    const message = data?.message || '포트원 결제 정보를 조회하지 못했습니다.';
    throw createHttpError(400, message);
  }

  return data.response;
}

async function verifyPortOnePayment(impUid, expectedAmount) {
  const normalizedImpUid = normalizeString(impUid);

  if (!normalizedImpUid) {
    throw createHttpError(400, '결제 고유번호가 필요합니다.');
  }

  const accessToken = await getPortOneAccessToken();
  const paymentInfo = await fetchPortOnePayment(normalizedImpUid, accessToken);

  if (!paymentInfo) {
    throw createHttpError(400, '결제 정보를 찾을 수 없습니다.');
  }

  if (paymentInfo.status !== 'paid') {
    throw createHttpError(400, '결제가 완료되지 않았습니다.');
  }

  const paidAmount = Number(paymentInfo.amount ?? 0);
  const normalizedExpectedAmount = Number(expectedAmount ?? 0);

  if (Number.isNaN(normalizedExpectedAmount) || normalizedExpectedAmount <= 0) {
    throw createHttpError(400, '유효하지 않은 결제 금액입니다.');
  }

  if (paidAmount !== normalizedExpectedAmount) {
    throw createHttpError(400, '결제 금액이 일치하지 않습니다.');
  }

  return paymentInfo;
}

function normalizeSubdocument(subdoc) {
  if (!subdoc) {
    return {};
  }

  if (typeof subdoc.toObject === 'function') {
    return subdoc.toObject();
  }

  return { ...subdoc };
}

function normalizeString(value = '') {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

async function generateUniqueOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  let uniqueNumber = '';
  let exists = true;

  while (exists) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    uniqueNumber = `${datePart}-${randomPart}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Order.exists({ orderNumber: uniqueNumber });
  }

  return uniqueNumber;
}

function computeOrderTotals(items = [], summaryOverrides = {}) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.lineDiscount, 0);
  const shippingFee = Number(summaryOverrides.shippingFee ?? 0);
  const tax = Number(summaryOverrides.tax ?? 0);
  const grandTotal =
    Number(summaryOverrides.grandTotal ?? subtotal - discountTotal + shippingFee + tax);

  return {
    currency: (summaryOverrides.currency || 'KRW').toUpperCase(),
    subtotal,
    discountTotal,
    shippingFee,
    tax,
    grandTotal,
  };
}

function canAccessOrder(user, order) {
  if (!user || !order) {
    return false;
  }

  if (user.user_type === 'admin') {
    return true;
  }

  return order.user && order.user.toString() === user.id;
}

async function createOrder(req, res, next) {
  try {
    const {
      items = [],
      summary = {},
      payment = {},
      shipping,
      notes = '',
      contact = {},
      guestName = '',
      guestEmail = '',
      sourceCart = null,
      orderNumber: providedOrderNumber,
      paymentVerification = {},
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '주문에 포함될 상품이 필요합니다.' });
    }

    if (!shipping || !shipping.address) {
      return res.status(400).json({ message: '배송 정보는 필수입니다.' });
    }

    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const lineDiscount = Number(item.lineDiscount ?? 0);
      const lineTotal =
        item.lineTotal !== undefined
          ? Number(item.lineTotal)
          : quantity * unitPrice - lineDiscount;

      return {
        product: item.product,
        name: normalizeString(item.name),
        sku: normalizeString(item.sku),
        thumbnail: normalizeString(item.thumbnail),
        options: item.options || {},
        quantity,
        unitPrice,
        lineDiscount,
        lineTotal,
      };
    });

    const computedSummary = computeOrderTotals(normalizedItems, summary);

    if (payment?.transactionId) {
      const duplicateOrder = await Order.findOne({
        'payment.transactionId': normalizeString(payment.transactionId),
      }).lean();

      if (duplicateOrder) {
        return res.status(409).json({ message: '이미 처리된 주문입니다.' });
      }
    }

    let verifiedPaymentInfo = null;

    const shouldVerifyPayment =
      normalizeString(payment?.transactionId) ||
      normalizeString(paymentVerification?.impUid);

    if (shouldVerifyPayment) {
      try {
        const impUid =
          paymentVerification?.impUid || normalizeString(payment?.transactionId);

        verifiedPaymentInfo = await verifyPortOnePayment(
          impUid,
          Number(payment?.amount ?? computedSummary.grandTotal)
        );
      } catch (verificationError) {
        return next(verificationError);
      }
    }

    const orderNumber = providedOrderNumber || (await generateUniqueOrderNumber());

    const orderPayload = {
      orderNumber,
      user: req.user ? req.user._id : undefined,
      guestName: normalizeString(guestName),
      guestEmail: normalizeString(guestEmail).toLowerCase(),
      contact: {
        phone: normalizeString(contact.phone),
        email: normalizeString(contact.email).toLowerCase(),
      },
      status: 'pending',
      items: normalizedItems,
      summary: computedSummary,
      payment: {
        method: normalizeString(payment.method),
        status: verifiedPaymentInfo ? 'paid' : normalizeString(payment.status || 'ready'),
        amount: Number(payment.amount ?? computedSummary.grandTotal),
        currency: (payment.currency || computedSummary.currency).toUpperCase(),
        transactionId: normalizeString(
          verifiedPaymentInfo?.imp_uid || payment.transactionId
        ),
        receiptUrl:
          normalizeString(payment.receiptUrl) || normalizeString(verifiedPaymentInfo?.receipt_url),
        paidAt: verifiedPaymentInfo?.paid_at
          ? new Date(verifiedPaymentInfo.paid_at * 1000)
          : payment.paidAt
            ? new Date(payment.paidAt)
            : undefined,
      },
      shipping: {
        address: {
          name: normalizeString(shipping.address.name),
          phone: normalizeString(shipping.address.phone),
          postalCode: normalizeString(shipping.address.postalCode),
          address1: normalizeString(shipping.address.address1),
          address2: normalizeString(shipping.address.address2),
        },
        request: normalizeString(shipping.request),
        carrier: normalizeString(shipping.carrier),
        trackingNumber: normalizeString(shipping.trackingNumber),
        dispatchedAt: shipping.dispatchedAt ? new Date(shipping.dispatchedAt) : undefined,
        deliveredAt: shipping.deliveredAt ? new Date(shipping.deliveredAt) : undefined,
      },
      sourceCart,
      notes: normalizeString(notes),
      audit: [
        {
          status: 'pending',
          message: '주문 생성',
          actor: req.user ? req.user._id : undefined,
        },
      ],
      placedAt: new Date(),
    };

    const order = await Order.create(orderPayload);

    if (order.sourceCart) {
      await Cart.findByIdAndUpdate(order.sourceCart, {
        status: 'ordered',
        lockedAt: new Date(),
      });
    }

    const populatedOrder = await order.populate('user', 'name email user_type');
    return res.status(201).json(populatedOrder);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.orderNumber) {
      error.status = 409;
      error.message = '이미 존재하는 주문번호입니다.';
    }
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const { status, userId } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const isAdmin = req.user && req.user.user_type === 'admin';

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (isAdmin && userId) {
      filter.user = userId;
    } else if (!isAdmin) {
      filter.user = req.user._id;
    }

    const [items, totalItems] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email user_type'),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    return res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items,
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    
    // _id 또는 orderNumber로 조회
    let order;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId 형식인 경우
      order = await Order.findById(id).populate('user', 'name email user_type');
    } else {
      // orderNumber인 경우
      order = await Order.findOne({ orderNumber: id }).populate('user', 'name email user_type');
    }

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (!canAccessOrder(req.user, order)) {
      return res.status(403).json({ message: '이 주문을 조회할 권한이 없습니다.' });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const isAdmin = req.user && req.user.user_type === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: '주문을 수정할 권한이 없습니다.' });
    }

    const { status, payment, shipping, summary, notes, contact, auditMessage } = req.body || {};

    const auditEntries = [];

    if (status && status !== order.status) {
      order.status = status;
      if (status === 'cancelled') {
        order.cancelledAt = new Date();
      }

      auditEntries.push({
        status,
        message: normalizeString(auditMessage) || '주문 상태가 변경되었습니다.',
        actor: req.user ? req.user._id : undefined,
      });
    }

    if (payment) {
      order.set('payment', {
        ...normalizeSubdocument(order.payment),
        ...payment,
        currency: (payment.currency || order.payment?.currency || 'KRW').toUpperCase(),
      });
    }

    if (shipping) {
      order.set('shipping', {
        ...normalizeSubdocument(order.shipping),
        ...shipping,
        address: {
          ...normalizeSubdocument(order.shipping?.address),
          ...shipping.address,
        },
      });
    }

    if (summary) {
      order.set('summary', {
        ...normalizeSubdocument(order.summary),
        ...summary,
        currency: (summary.currency || order.summary?.currency || 'KRW').toUpperCase(),
      });
    }

    if (notes !== undefined) {
      order.notes = normalizeString(notes);
    }

    if (contact) {
      order.set('contact', {
        ...normalizeSubdocument(order.contact),
        phone: normalizeString(contact.phone ?? order.contact?.phone),
        email: normalizeString(contact.email ?? order.contact?.email).toLowerCase(),
      });
    }

    if (auditEntries.length) {
      order.audit.push(...auditEntries);
    }

    await order.save();

    const populatedOrder = await order.populate('user', 'name email user_type');

    return res.json(populatedOrder);
  } catch (error) {
    return next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (!canAccessOrder(req.user, order)) {
      return res.status(403).json({ message: '이 주문을 취소할 권한이 없습니다.' });
    }

    if (order.status === 'cancelled') {
      const populated = await order.populate('user', 'name email user_type');
      return res.json(populated);
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();

    if (req.body && req.body.paymentStatus) {
      order.set('payment', {
        ...normalizeSubdocument(order.payment),
        status: req.body.paymentStatus,
      });
    }

    order.audit.push({
      status: 'cancelled',
      message:
        normalizeString(req.body && req.body.auditMessage) || '주문이 취소되었습니다.',
      actor: req.user ? req.user._id : undefined,
    });

    await order.save();

    const populatedOrder = await order.populate('user', 'name email user_type');
    return res.json(populatedOrder);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
};


