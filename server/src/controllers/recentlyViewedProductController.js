const RecentlyViewedProduct = require('../models/recentlyViewedProduct');
const Product = require('../models/product');

/**
 * 최근 본 상품 목록 조회
 */
async function getRecentlyViewedProducts(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [recentlyViewed, total] = await Promise.all([
      RecentlyViewedProduct.find({ user: userId })
        .populate('product')
        .sort({ viewedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      RecentlyViewedProduct.countDocuments({ user: userId }),
    ]);

    // 상품이 삭제된 경우 필터링
    const validProducts = recentlyViewed
      .filter((item) => item.product)
      .map((item) => ({
        _id: item._id,
        product: item.product,
        viewedAt: item.viewedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

    res.json({
      items: validProducts,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: validProducts.length,
        pages: Math.ceil(validProducts.length / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 상품 조회 기록 추가/업데이트
 */
async function addRecentlyViewedProduct(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: '상품 ID가 필요합니다.' });
    }

    // 상품 존재 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 조회 기록 추가 또는 업데이트
    const recentlyViewed = await RecentlyViewedProduct.addOrUpdate(userId, productId);

    // 최근 50개만 유지 (오래된 것 삭제)
    const allRecords = await RecentlyViewedProduct.find({ user: userId })
      .sort({ viewedAt: -1 })
      .select('_id');
    
    if (allRecords.length > 50) {
      const recordsToDelete = allRecords.slice(50);
      const idsToDelete = recordsToDelete.map((r) => r._id);
      await RecentlyViewedProduct.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.json({
      _id: recentlyViewed._id,
      product: product,
      viewedAt: recentlyViewed.viewedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 최근 본 상품 삭제
 */
async function deleteRecentlyViewedProduct(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { id } = req.params;

    const recentlyViewed = await RecentlyViewedProduct.findById(id);
    if (!recentlyViewed) {
      return res.status(404).json({ message: '조회 기록을 찾을 수 없습니다.' });
    }

    // 본인 기록인지 확인
    if (recentlyViewed.user?.toString() !== userId.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await RecentlyViewedProduct.findByIdAndDelete(id);
    res.json({ message: '조회 기록이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

/**
 * 최근 본 상품 전체 삭제
 */
async function deleteAllRecentlyViewedProducts(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    await RecentlyViewedProduct.deleteMany({ user: userId });
    res.json({ message: '모든 조회 기록이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRecentlyViewedProducts,
  addRecentlyViewedProduct,
  deleteRecentlyViewedProduct,
  deleteAllRecentlyViewedProducts,
};

