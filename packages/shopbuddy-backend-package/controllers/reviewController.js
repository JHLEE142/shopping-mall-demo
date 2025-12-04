import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 상품 리뷰 목록 조회
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = 'createdAt' } = req.query;

    const query = { productId, status: 'approved' };
    if (rating) query.rating = parseInt(rating);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find(query)
      .populate('userId', 'name')
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // 평균 평점 계산
    const ratingStats = await Review.aggregate([
      { $match: { productId: productId, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const averageRating = ratingStats[0]?.averageRating || 0;
    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    if (ratingStats[0]?.ratingDistribution) {
      ratingStats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }

    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution
    }, pagination, '리뷰 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 리뷰 작성
export const createReview = async (req, res) => {
  try {
    const { orderId, productId, rating, title, content, images } = req.body;
    const userId = req.user._id;

    // 주문 확인 및 구매 확인
    const order = await Order.findOne({
      _id: orderId,
      userId,
      status: 'delivered'
    });

    if (!order) {
      return errorResponse(res, '구매 확인이 되지 않았습니다.', 400);
    }

    // 이미 리뷰를 작성했는지 확인
    const existingReview = await Review.findOne({ orderId, productId, userId });
    if (existingReview) {
      return errorResponse(res, '이미 리뷰를 작성하셨습니다.', 400);
    }

    // 상품 확인
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    const review = await Review.create({
      orderId,
      productId,
      userId,
      sellerId: product.sellerId,
      rating,
      title,
      content,
      images: images || [],
      status: 'pending', // 관리자 승인 필요
      isVerifiedPurchase: true
    });

    successResponse(res, { review }, '리뷰가 작성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 리뷰 상세 조회
export const getReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id)
      .populate('userId', 'name')
      .populate('productId', 'name slug')
      .populate('sellerId', 'businessName');

    if (!review) {
      return errorResponse(res, '리뷰를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { review }, '리뷰 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 리뷰 수정
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse(res, '리뷰를 찾을 수 없습니다.', 404);
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    const { rating, title, content, images } = req.body;
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (content) review.content = content;
    if (images) review.images = images;

    review.status = 'pending'; // 수정 시 재승인 필요
    await review.save();

    successResponse(res, { review }, '리뷰가 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 리뷰 삭제
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse(res, '리뷰를 찾을 수 없습니다.', 404);
    }

    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    await Review.findByIdAndDelete(id);

    successResponse(res, null, '리뷰가 삭제되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 리뷰 도움됨
export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse(res, '리뷰를 찾을 수 없습니다.', 404);
    }

    review.helpfulCount += 1;
    await review.save();

    successResponse(res, { review }, '도움됨으로 표시되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 판매자: 리뷰 답변
export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, '리뷰를 찾을 수 없습니다.', 404);
    }

    // 판매자 확인
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || review.sellerId?.toString() !== seller._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    review.sellerReply = {
      content,
      repliedAt: new Date()
    };
    await review.save();

    successResponse(res, { review }, '답변이 작성되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

