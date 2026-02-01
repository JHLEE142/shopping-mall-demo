const Review = require('../models/review');
const Order = require('../models/order');
const Product = require('../models/product');

/**
 * 리뷰 작성
 */
async function createReview(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const { productId, rating, title, body, region, fit, purchaseSize, images, gender, purpose } = req.body;

    if (!productId || !rating || !title || !body) {
      return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: '평점은 1~5 사이여야 합니다.' });
    }

    // 이미 작성한 리뷰가 있는지 확인
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ message: '이미 이 상품에 대한 리뷰를 작성하셨습니다.' });
    }

    // 주문 완료된 상품인지 확인 (구매 확인)
    const hasOrdered = await Order.findOne({
      user: userId,
      status: { $in: ['paid', 'fulfilled'] },
      'items.product': productId,
    });

    const review = await Review.create({
      productId,
      userId,
      rating,
      title: title.trim(),
      body: body.trim(),
      region: region?.trim() || '',
      fit: fit?.trim() || '',
      purchaseSize: purchaseSize?.trim() || '',
      images: images || [],
      gender: gender || '',
      purpose: purpose?.trim() || '',
      isVerified: !!hasOrdered,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('productId', 'name image')
      .populate('userId', 'name email')
      .lean();

    res.status(201).json(populatedReview);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 이 상품에 대한 리뷰를 작성하셨습니다.' });
    }
    next(error);
  }
}

/**
 * 상품별 리뷰 목록 조회
 */
async function getReviewsByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20, sort = 'createdAt' } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortOption = sort === 'rating' ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

    const [reviews, total] = await Promise.all([
      Review.find({ productId })
        .populate('userId', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Review.countDocuments({ productId }),
    ]);

    res.json({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalItems: total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      items: reviews,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 리뷰 통계 조회
 */
async function getReviewStats(req, res, next) {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId }).lean();

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating]++;
      }
    });

    // 고객 이미지 수집 (리뷰에 이미지가 있는 경우)
    const customerImages = reviews
      .filter((r) => r.images && r.images.length > 0)
      .flatMap((r) => r.images)
      .slice(0, 20);

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      customerImages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 리뷰 수정
 */
async function updateReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 리뷰 수정 가능, 일반 사용자는 본인 리뷰만 수정 가능
    const isAdmin = req.user?.user_type === 'admin';
    if (!isAdmin && review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: '본인의 리뷰만 수정할 수 있습니다.' });
    }

    const { rating, title, body, region, fit, purchaseSize, images, gender, purpose } = req.body;

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: '평점은 1~5 사이여야 합니다.' });
      }
      review.rating = rating;
    }
    if (title !== undefined) review.title = title.trim();
    if (body !== undefined) review.body = body.trim();
    if (region !== undefined) review.region = region?.trim() || '';
    if (fit !== undefined) review.fit = fit?.trim() || '';
    if (purchaseSize !== undefined) review.purchaseSize = purchaseSize?.trim() || '';
    if (images !== undefined) review.images = images || [];
    if (gender !== undefined) review.gender = gender || '';
    if (purpose !== undefined) review.purpose = purpose?.trim() || '';

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('productId', 'name image')
      .populate('userId', 'name email')
      .lean();

    res.json(populatedReview);
  } catch (error) {
    next(error);
  }
}

/**
 * 리뷰 삭제
 */
async function deleteReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 리뷰 삭제 가능, 일반 사용자는 본인 리뷰만 삭제 가능
    const isAdmin = req.user?.user_type === 'admin';
    if (!isAdmin && review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: '본인의 리뷰만 삭제할 수 있습니다.' });
    }

    await Review.findByIdAndDelete(reviewId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

/**
 * 리뷰 조회 (단일)
 */
async function getReviewById(req, res, next) {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('productId', 'name image')
      .populate('userId', 'name email')
      .lean();

    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자의 리뷰 미작성 주문 상품 목록 조회
 */
async function getUnreviewedProducts(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    // 주문 완료된 상품 조회 (paid, fulfilled 상태)
    const completedOrders = await Order.find({
      user: userId,
      status: { $in: ['paid', 'fulfilled'] },
    })
      .select('items placedAt')
      .sort({ placedAt: -1 })
      .lean();

    // 모든 주문 상품 수집
    const orderedProducts = [];
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        orderedProducts.push({
          productId: item.product,
          productName: item.name,
          productImage: item.thumbnail,
          orderNumber: order.orderNumber,
          orderedAt: order.placedAt,
          quantity: item.quantity,
        });
      });
    });

    // 작성된 리뷰 조회
    const reviewedProductIds = await Review.find({ userId })
      .select('productId')
      .lean()
      .then((reviews) => reviews.map((r) => r.productId.toString()));

    // 리뷰 미작성 상품 필터링
    const unreviewedProducts = orderedProducts.filter(
      (item) => !reviewedProductIds.includes(item.productId.toString())
    );

    // 중복 제거 (같은 상품은 가장 최근 주문 정보만)
    const uniqueProducts = new Map();
    unreviewedProducts.forEach((item) => {
      const productIdStr = item.productId.toString();
      if (!uniqueProducts.has(productIdStr) || 
          new Date(item.orderedAt) > new Date(uniqueProducts.get(productIdStr).orderedAt)) {
        uniqueProducts.set(productIdStr, item);
      }
    });

    const result = Array.from(uniqueProducts.values())
      .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt))
      .slice(0, 20); // 최대 20개

    // 상품 상세 정보 조회
    const productIds = result.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name image images')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const finalResult = result
      .map((item) => {
        const product = productMap.get(item.productId.toString());
        // 삭제된 상품은 제외 (product가 없으면 null 반환)
        if (!product) {
          return null;
        }
        return {
          productId: item.productId,
          productName: product.name || item.productName,
          productImage: product.images?.[0] || product.image || item.productImage,
          orderNumber: item.orderNumber,
          orderedAt: item.orderedAt,
          quantity: item.quantity,
        };
      })
      .filter(item => item !== null); // null 항목 제거

    res.json({
      count: finalResult.length,
      items: finalResult,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getReviewsByProduct,
  getReviewStats,
  updateReview,
  deleteReview,
  getReviewById,
  getUnreviewedProducts,
};
