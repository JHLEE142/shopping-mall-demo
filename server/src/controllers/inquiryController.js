const Inquiry = require('../models/inquiry');
const Order = require('../models/order');
const Product = require('../models/product');

/**
 * 1:1 문의 목록 조회 (사용자용)
 */
async function getInquiries(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { page = 1, limit = 20, status, type } = req.query;
    const query = { user: userId };

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('order', 'orderNumber')
        .populate('product', 'name image')
        .populate('answer.answeredBy', 'name email')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Inquiry.countDocuments(query),
    ]);

    res.json({
      items: inquiries,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 1:1 문의 목록 조회 (관리자용 - 모든 문의)
 */
async function getAllInquiries(req, res, next) {
  try {
    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
    }

    const { page = 1, limit = 20, status, type, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('user', 'name email')
        .populate('order', 'orderNumber')
        .populate('product', 'name image')
        .populate('answer.answeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Inquiry.countDocuments(query),
    ]);

    res.json({
      items: inquiries,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 1:1 문의 상세 조회
 */
async function getInquiryById(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const inquiry = await Inquiry.findById(id)
      .populate('order', 'orderNumber')
      .populate('product', 'name image')
      .populate('answer.answeredBy', 'name email')
      .lean();

    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    // 본인 문의인지 확인
    if (inquiry.user?.toString() !== userId.toString() && req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    res.json(inquiry);
  } catch (error) {
    next(error);
  }
}

/**
 * 1:1 문의 생성
 */
async function createInquiry(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { type, title, content, isSecret, orderId, productId, attachments } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    // 주문/상품 확인
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
      }
      if (order.user?.toString() !== userId.toString()) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }
    }

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
      }
    }

    const inquiry = await Inquiry.create({
      user: userId,
      type: type || 'general',
      title,
      content,
      isSecret: isSecret || false,
      order: orderId || null,
      product: productId || null,
      attachments: attachments || [],
    });

    const populated = await Inquiry.findById(inquiry._id)
      .populate('order', 'orderNumber')
      .populate('product', 'name image')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * 1:1 문의 수정
 */
async function updateInquiry(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const { title, content, isSecret, attachments } = req.body;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    // 본인 문의인지 확인
    if (inquiry.user?.toString() !== userId.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 답변이 있으면 수정 불가
    if (inquiry.status === 'answered' || inquiry.status === 'closed') {
      return res.status(400).json({ message: '답변이 완료된 문의는 수정할 수 없습니다.' });
    }

    if (title) inquiry.title = title;
    if (content) inquiry.content = content;
    if (typeof isSecret !== 'undefined') inquiry.isSecret = isSecret;
    if (attachments) inquiry.attachments = attachments;

    await inquiry.save();

    const populated = await Inquiry.findById(inquiry._id)
      .populate('order', 'orderNumber')
      .populate('product', 'name image')
      .populate('answer.answeredBy', 'name email')
      .lean();

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * 1:1 문의 삭제
 */
async function deleteInquiry(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 문의 삭제 가능, 일반 사용자는 본인 문의만 삭제 가능
    const isAdmin = req.user?.user_type === 'admin';
    if (!isAdmin && inquiry.user?.toString() !== userId.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await Inquiry.findByIdAndDelete(id);
    res.json({ message: '문의가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

/**
 * 1:1 문의 답변 (관리자용)
 */
async function answerInquiry(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 답변할 수 있습니다.' });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: '답변 내용은 필수입니다.' });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    inquiry.answer = {
      content,
      answeredBy: userId,
      answeredAt: new Date(),
    };
    inquiry.status = 'answered';

    await inquiry.save();

    const populated = await Inquiry.findById(inquiry._id)
      .populate('order', 'orderNumber')
      .populate('product', 'name image')
      .populate('answer.answeredBy', 'name email')
      .lean();

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInquiries,
  getAllInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  answerInquiry,
};

