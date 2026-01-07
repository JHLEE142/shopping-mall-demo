const Feedback = require('../models/feedback');

/**
 * 개선 의견/리서치 참여 목록 조회
 */
async function getFeedbacks(req, res, next) {
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

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate('response.respondedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Feedback.countDocuments(query),
    ]);

    res.json({
      items: feedbacks,
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
 * 개선 의견/리서치 참여 상세 조회
 */
async function getFeedbackById(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const feedback = await Feedback.findById(id)
      .populate('response.respondedBy', 'name email')
      .lean();

    if (!feedback) {
      return res.status(404).json({ message: '의견을 찾을 수 없습니다.' });
    }

    // 본인 의견인지 확인
    if (feedback.user?.toString() !== userId.toString() && req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    res.json(feedback);
  } catch (error) {
    next(error);
  }
}

/**
 * 개선 의견/리서치 참여 생성
 */
async function createFeedback(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { type, title, content, category, priority, attachments, researchData } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    const feedback = await Feedback.create({
      user: userId,
      type: type || 'suggestion',
      title,
      content,
      category: category || '',
      priority: priority || 'medium',
      attachments: attachments || [],
      researchData: researchData || {},
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('response.respondedBy', 'name email')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * 개선 의견/리서치 참여 수정
 */
async function updateFeedback(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const { title, content, category, priority, attachments, researchData } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: '의견을 찾을 수 없습니다.' });
    }

    // 본인 의견인지 확인
    if (feedback.user?.toString() !== userId.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 검토 중이거나 완료된 의견은 수정 불가
    if (feedback.status !== 'pending') {
      return res.status(400).json({ message: '검토 중이거나 완료된 의견은 수정할 수 없습니다.' });
    }

    if (title) feedback.title = title;
    if (content) feedback.content = content;
    if (category !== undefined) feedback.category = category;
    if (priority) feedback.priority = priority;
    if (attachments) feedback.attachments = attachments;
    if (researchData) feedback.researchData = researchData;

    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('response.respondedBy', 'name email')
      .lean();

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * 개선 의견/리서치 참여 삭제
 */
async function deleteFeedback(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ message: '의견을 찾을 수 없습니다.' });
    }

    // 본인 의견인지 확인
    if (feedback.user?.toString() !== userId.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await Feedback.findByIdAndDelete(id);
    res.json({ message: '의견이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

/**
 * 개선 의견/리서치 참여 응답 (관리자용)
 */
async function respondToFeedback(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 응답할 수 있습니다.' });
    }

    const { id } = req.params;
    const { content, status } = req.body;

    if (!content) {
      return res.status(400).json({ message: '응답 내용은 필수입니다.' });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: '의견을 찾을 수 없습니다.' });
    }

    feedback.response = {
      content,
      respondedBy: userId,
      respondedAt: new Date(),
    };

    if (status) {
      feedback.status = status;
    } else {
      feedback.status = 'reviewing';
    }

    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('response.respondedBy', 'name email')
      .lean();

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  respondToFeedback,
};

