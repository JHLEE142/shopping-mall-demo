const Notice = require('../models/notice');

/**
 * 공지사항 목록 조회
 */
async function getNotices(req, res, next) {
  try {
    const { page = 1, limit = 20, type, isImportant, search } = req.query;
    const query = { status: 'published' };

    if (type) {
      query.type = type;
    }
    if (isImportant === 'true') {
      query.isImportant = true;
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate('author', 'name email')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Notice.countDocuments(query),
    ]);

    res.json({
      items: notices,
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
 * 공지사항 상세 조회
 */
async function getNoticeById(req, res, next) {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id)
      .populate('author', 'name email')
      .lean();

    if (!notice) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    // 조회수 증가
    await Notice.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.json(notice);
  } catch (error) {
    next(error);
  }
}

/**
 * 공지사항 생성 (관리자용)
 */
async function createNotice(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 공지사항을 작성할 수 있습니다.' });
    }

    const { title, content, type, isImportant, isPinned, attachments, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    const notice = await Notice.create({
      title,
      content,
      type: type || 'general',
      isImportant: isImportant || false,
      isPinned: isPinned || false,
      author: userId,
      attachments: attachments || [],
      expiresAt: expiresAt || null,
      status: 'published',
    });

    const populated = await Notice.findById(notice._id)
      .populate('author', 'name email')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * 공지사항 수정 (관리자용)
 */
async function updateNotice(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 공지사항을 수정할 수 있습니다.' });
    }

    const { id } = req.params;
    const { title, content, type, isImportant, isPinned, attachments, expiresAt, status } = req.body;

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (type) notice.type = type;
    if (typeof isImportant !== 'undefined') notice.isImportant = isImportant;
    if (typeof isPinned !== 'undefined') notice.isPinned = isPinned;
    if (attachments) notice.attachments = attachments;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;
    if (status) notice.status = status;

    await notice.save();

    const populated = await Notice.findById(notice._id)
      .populate('author', 'name email')
      .lean();

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * 공지사항 삭제 (관리자용)
 */
async function deleteNotice(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ message: '관리자만 공지사항을 삭제할 수 있습니다.' });
    }

    const { id } = req.params;
    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    await Notice.findByIdAndDelete(id);
    res.json({ message: '공지사항이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
};

