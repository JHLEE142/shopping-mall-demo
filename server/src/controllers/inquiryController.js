const Inquiry = require('../models/inquiry');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

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
      .populate('user', 'name email')
      .lean();

    // Slack 알림 전송 (비동기로 처리, 에러가 발생해도 문의 생성은 성공)
    sendSlackInquiryNotification(populated).catch((error) => {
      console.error('Slack 문의 알림 전송 실패:', error);
    });

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

/**
 * Slack 문의 알림 전송 (1:1 문의)
 */
async function sendSlackInquiryNotification(inquiry) {
  try {
    // Slack Webhook URL (환경변수에서만 가져오기)
    const SLACK_WEBHOOK_ADMIN = process.env.SLACK_WEBHOOK_ADMIN;
    
    // 환경변수가 없으면 알림 전송 건너뛰기
    if (!SLACK_WEBHOOK_ADMIN) {
      console.log('Slack Webhook URL이 설정되지 않아 문의 알림을 전송하지 않습니다.');
      return;
    }

    // 사용자 정보
    const userName = inquiry.user?.name || 'Unknown';
    const userEmail = inquiry.user?.email || 'N/A';
    
    // 문의 정보
    const inquiryId = inquiry._id?.toString() || 'N/A';
    const inquiryType = inquiry.type || '일반';
    const inquiryTitle = inquiry.title || '제목 없음';
    const inquiryContent = inquiry.content || '';
    const contentPreview = inquiryContent.length > 200 
      ? inquiryContent.substring(0, 200) + '...' 
      : inquiryContent;
    const isSecret = inquiry.isSecret ? '🔒 비밀글' : '';
    
    // 관련 정보
    const orderNumber = inquiry.order?.orderNumber || null;
    const productName = inquiry.product?.name || null;
    
    // 관리자 페이지 링크
    const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?nav=Inquiries&inquiryId=${inquiryId}`;
    
    // 메시지 구성
    let message = `📩 *새로운 1:1 문의가 등록되었습니다!*\n\n`;
    message += `*문의 ID:* ${inquiryId}\n`;
    message += `*유형:* ${inquiryType} ${isSecret}\n`;
    message += `*제목:* ${inquiryTitle}\n\n`;
    message += `*고객 정보:*\n`;
    message += `• 이름: ${userName}\n`;
    message += `• 이메일: ${userEmail}\n\n`;
    
    if (orderNumber) {
      message += `*관련 주문:* #${orderNumber}\n`;
    }
    if (productName) {
      message += `*관련 상품:* ${productName}\n`;
    }
    
    message += `\n*문의 내용:*\n${contentPreview}\n\n`;
    message += `*등록 시간:* ${new Date(inquiry.createdAt || Date.now()).toLocaleString('ko-KR')}\n\n`;
    message += `<${adminUrl}|관리자 페이지에서 확인하기>`;

    // Slack 메시지 전송 (#admin 채널)
    await fetch(SLACK_WEBHOOK_ADMIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
      }),
    });
  } catch (error) {
    // Slack 알림 실패는 로그만 남기고 문의 생성에는 영향 없음
    console.error('Slack 문의 알림 전송 중 오류:', error.message);
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

