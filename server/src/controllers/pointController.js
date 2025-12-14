const User = require('../models/user');
const PointHistory = require('../models/point');

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
}

// 적립금 조회 (총 적립금, 사용가능 적립금, 사용된 적립금)
exports.getPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('points');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 총 적립금: type='earn'인 모든 amount의 합
    const totalEarned = await PointHistory.aggregate([
      { $match: { user: user._id, type: 'earn' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalEarnedAmount = totalEarned.length > 0 ? totalEarned[0].total : 0;

    // 사용된 적립금: type='use'인 모든 amount의 절댓값 합
    const totalUsed = await PointHistory.aggregate([
      { $match: { user: user._id, type: 'use' } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
    ]);
    const totalUsedAmount = totalUsed.length > 0 ? totalUsed[0].total : 0;

    // 사용가능 적립금: 현재 잔액
    const availablePoints = user.points || 0;

    res.json({
      totalEarned: totalEarnedAmount, // 총 적립금
      availablePoints: availablePoints, // 사용가능 적립금
      totalUsed: totalUsedAmount, // 사용된 적립금
    });
  } catch (error) {
    next(error);
  }
};

// 적립금 내역 조회
exports.getPointHistory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;
    const type = req.query.type; // 'earn', 'use', 또는 undefined (전체)

    // 필터 조건 구성
    const filter = { user: req.user.id };
    if (type && (type === 'earn' || type === 'use')) {
      filter.type = type;
    }

    const [items, totalItems] = await Promise.all([
      PointHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PointHistory.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// 적립금 적립
exports.earnPoints = async (req, res, next) => {
  try {
    const { amount, description, relatedOrder, relatedProduct } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: '유효한 적립금 금액을 입력해주세요.' });
    }

    if (!description) {
      return res.status(400).json({ message: '적립 사유를 입력해주세요.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const newBalance = (user.points || 0) + amount;

    // 사용자 적립금 업데이트
    user.points = newBalance;
    await user.save();

    // 적립금 내역 저장
    const history = await PointHistory.create({
      user: user._id,
      type: 'earn',
      amount,
      balance: newBalance,
      description,
      relatedOrder: relatedOrder || null,
      relatedProduct: relatedProduct || null,
    });

    res.json({
      message: '적립금이 적립되었습니다.',
      points: newBalance,
      history: history,
    });
  } catch (error) {
    next(error);
  }
};

// 적립금 사용
exports.usePoints = async (req, res, next) => {
  try {
    const { amount, description, relatedOrder } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: '유효한 사용 금액을 입력해주세요.' });
    }

    if (!description) {
      return res.status(400).json({ message: '사용 사유를 입력해주세요.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const currentPoints = user.points || 0;
    if (currentPoints < amount) {
      return res.status(400).json({ message: '보유 적립금이 부족합니다.' });
    }

    const newBalance = currentPoints - amount;

    // 사용자 적립금 업데이트
    user.points = newBalance;
    await user.save();

    // 적립금 내역 저장
    const history = await PointHistory.create({
      user: user._id,
      type: 'use',
      amount: -amount,
      balance: newBalance,
      description,
      relatedOrder: relatedOrder || null,
    });

    res.json({
      message: '적립금이 사용되었습니다.',
      points: newBalance,
      history: history,
    });
  } catch (error) {
    next(error);
  }
};

