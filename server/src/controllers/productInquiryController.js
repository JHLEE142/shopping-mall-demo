const ProductInquiry = require('../models/productInquiry');
const Product = require('../models/product');
const User = require('../models/user');
const nodemailer = require('nodemailer');

// 이메일 전송 설정 (환경 변수에서 읽기)
function createEmailTransporter() {
  // Gmail SMTP 설정 예시 (실제 사용 시 환경 변수로 설정)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Gmail 주소
      pass: process.env.EMAIL_PASS, // Gmail 앱 비밀번호
    },
  });
  return transporter;
}

// 판매자에게 문의 알림 이메일 전송
async function sendInquiryNotificationToSeller(productId, inquiryId, question) {
  try {
    // 상품 정보 조회
    const product = await Product.findById(productId).lean();
    if (!product) return;

    // 관리자/판매자 이메일 조회 (실제로는 상품에 판매자 정보가 있거나, 관리자 목록을 조회)
    const adminUsers = await User.find({ user_type: 'admin' }).select('email name').lean();
    
    if (adminUsers.length === 0) {
      console.warn('No admin users found for inquiry notification');
      return;
    }

    // 이메일 전송 설정이 있는 경우에만 전송
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not set. Skipping email notification.');
      return;
    }

    const transporter = createEmailTransporter();
    const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product-detail?productId=${productId}`;

    // 각 관리자에게 이메일 전송
    const emailPromises = adminUsers.map((admin) => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: admin.email,
        subject: `[상품 문의] ${product.name}`,
        html: `
          <h2>새로운 상품 문의가 등록되었습니다.</h2>
          <p><strong>상품명:</strong> ${product.name}</p>
          <p><strong>문의 내용:</strong></p>
          <p>${question}</p>
          <p><a href="${productUrl}">상품 페이지로 이동</a></p>
        `,
      });
    });

    await Promise.all(emailPromises);
    console.log('Inquiry notification emails sent to admins');
  } catch (error) {
    console.error('Failed to send inquiry notification email:', error);
    // 이메일 전송 실패해도 문의는 저장되도록 함
  }
}

/**
 * 사용자별 상품 문의 목록 조회
 */
async function getUserInquiries(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = { userId };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [inquiries, total] = await Promise.all([
      ProductInquiry.find(query)
        .populate('productId', 'name image')
        .populate('userId', 'name email')
        .populate('answer.answeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ProductInquiry.countDocuments(query),
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
 * 상품 문의 목록 조회 (관리자용 - 모든 문의)
 */
async function getAllInquiries(req, res, next) {
  try {
    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (search) {
      query.question = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [inquiries, total] = await Promise.all([
      ProductInquiry.find(query)
        .populate('userId', 'name email')
        .populate('productId', 'name image')
        .populate('answer.answeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ProductInquiry.countDocuments(query),
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
 * 상품별 문의 목록 조회
 */
async function getInquiriesByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20, search } = req.query;
    const userId = req.user?.id || req.user?._id;

    const query = { productId };

    // 검색 기능
    if (search && search.trim()) {
      query.question = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [inquiries, total] = await Promise.all([
      ProductInquiry.find(query)
        .populate('userId', 'name email')
        .populate('answer.answeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ProductInquiry.countDocuments(query),
    ]);

    // 비밀글 처리: 본인 문의이거나 관리자가 아니면 내용 숨김
    const processedInquiries = inquiries.map((inquiry) => {
      const isOwner = userId && inquiry.userId?._id?.toString() === userId.toString();
      const isAdmin = req.user?.user_type === 'admin';

      if (inquiry.isSecret && !isOwner && !isAdmin) {
        return {
          ...inquiry,
          question: '비밀글입니다.',
          answer: {
            content: '비밀글입니다.',
            answeredBy: null,
            answeredAt: null,
          },
        };
      }

      return inquiry;
    });

    res.json({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalItems: total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      items: processedInquiries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 문의 작성
 */
async function createInquiry(req, res, next) {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const { question, isSecret = false } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: '문의 내용을 입력해주세요.' });
    }

    // 상품 존재 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const inquiry = await ProductInquiry.create({
      productId,
      userId,
      question: question.trim(),
      isSecret: Boolean(isSecret),
      status: 'pending',
    });

    const populatedInquiry = await ProductInquiry.findById(inquiry._id)
      .populate('userId', 'name email')
      .populate('productId', 'name image')
      .lean();

    // 판매자에게 알림 이메일 전송 (비동기)
    sendInquiryNotificationToSeller(productId, inquiry._id, question.trim()).catch((err) => {
      console.error('Failed to send notification:', err);
    });

    // Slack 알림 전송 (비동기로 처리, 에러가 발생해도 문의 생성은 성공)
    sendSlackProductInquiryNotification(populatedInquiry).catch((error) => {
      console.error('Slack 상품 문의 알림 전송 실패:', error);
    });

    res.status(201).json(populatedInquiry);
  } catch (error) {
    next(error);
  }
}

/**
 * 문의 답변 작성 (관리자만)
 */
async function answerInquiry(req, res, next) {
  try {
    const { inquiryId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 관리자 권한 확인
    const user = await User.findById(userId);
    if (!user || user.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 답변할 수 있습니다.' });
    }

    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: '답변 내용을 입력해주세요.' });
    }

    const inquiry = await ProductInquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    inquiry.answer = {
      content: answer.trim(),
      answeredBy: userId,
      answeredAt: new Date(),
    };
    inquiry.status = 'answered';

    await inquiry.save();

    const populatedInquiry = await ProductInquiry.findById(inquiry._id)
      .populate('userId', 'name email')
      .populate('answer.answeredBy', 'name email')
      .lean();

    res.json(populatedInquiry);
  } catch (error) {
    next(error);
  }
}

/**
 * 문의 수정
 */
async function updateInquiry(req, res, next) {
  try {
    const { inquiryId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const inquiry = await ProductInquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 문의 수정 가능, 일반 사용자는 본인 문의만 수정 가능
    const user = await User.findById(userId);
    const isAdmin = user && user.user_type === 'admin';
    if (!isAdmin && inquiry.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: '본인의 문의만 수정할 수 있습니다.' });
    }

    // 답변이 있으면 수정 불가 (관리자도 동일)
    if (inquiry.answer && inquiry.answer.content) {
      return res.status(400).json({ message: '답변이 있는 문의는 수정할 수 없습니다.' });
    }

    const { question, isSecret } = req.body;

    if (question !== undefined) {
      inquiry.question = question.trim();
    }
    if (isSecret !== undefined) {
      inquiry.isSecret = Boolean(isSecret);
    }

    await inquiry.save();

    const populatedInquiry = await ProductInquiry.findById(inquiry._id)
      .populate('userId', 'name email')
      .populate('answer.answeredBy', 'name email')
      .lean();

    res.json(populatedInquiry);
  } catch (error) {
    next(error);
  }
}

/**
 * 문의 삭제
 */
async function deleteInquiry(req, res, next) {
  try {
    const { inquiryId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const inquiry = await ProductInquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' });
    }

    // 본인 문의 또는 관리자만 삭제 가능
    const user = await User.findById(userId);
    const isOwner = inquiry.userId.toString() === userId.toString();
    const isAdmin = user && user.user_type === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '문의를 삭제할 권한이 없습니다.' });
    }

    await ProductInquiry.findByIdAndDelete(inquiryId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

/**
 * Slack 상품 문의 알림 전송
 */
async function sendSlackProductInquiryNotification(inquiry) {
  try {
    // Slack Webhook URL (환경변수에서만 가져오기)
    const SLACK_WEBHOOK_ADMIN = process.env.SLACK_WEBHOOK_ADMIN;
    
    // 환경변수가 없으면 알림 전송 건너뛰기
    if (!SLACK_WEBHOOK_ADMIN) {
      console.log('Slack Webhook URL이 설정되지 않아 상품 문의 알림을 전송하지 않습니다.');
      return;
    }

    // 사용자 정보
    const userName = inquiry.userId?.name || 'Unknown';
    const userEmail = inquiry.userId?.email || 'N/A';
    
    // 문의 정보
    const inquiryId = inquiry._id?.toString() || 'N/A';
    const productName = inquiry.productId?.name || 'Unknown Product';
    const productImage = inquiry.productId?.image || null;
    const question = inquiry.question || '';
    const questionPreview = question.length > 200 
      ? question.substring(0, 200) + '...' 
      : question;
    const isSecret = inquiry.isSecret ? '🔒 비밀글' : '';
    
    // 관리자 페이지 링크
    const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?nav=Inquiries&inquiryType=product&inquiryId=${inquiryId}`;
    
    // 메시지 구성
    let message = `🛍️ *새로운 상품 문의가 등록되었습니다!*\n\n`;
    message += `*문의 ID:* ${inquiryId}\n`;
    message += `*상품명:* ${productName} ${isSecret}\n\n`;
    message += `*고객 정보:*\n`;
    message += `• 이름: ${userName}\n`;
    message += `• 이메일: ${userEmail}\n\n`;
    message += `*문의 내용:*\n${questionPreview}\n\n`;
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
    console.error('Slack 상품 문의 알림 전송 중 오류:', error.message);
  }
}

module.exports = {
  getUserInquiries,
  getAllInquiries,
  getInquiriesByProduct,
  createInquiry,
  answerInquiry,
  updateInquiry,
  deleteInquiry,
};

