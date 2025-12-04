import Product from '../models/Product.js';
import ProductOption from '../models/ProductOption.js';
import ProductImage from '../models/ProductImage.js';
import Category from '../models/Category.js';
import Seller from '../models/Seller.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 상품 목록 조회
export const getProducts = async (req, res) => {
  try {
    const {
      categoryId,
      category, // 카테고리 코드로 필터링
      sellerId,
      search,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = { status: 'active' };

    // 카테고리 필터링 (categoryId 또는 category 코드)
    if (categoryId) {
      query.categoryId = categoryId;
    } else if (category) {
      // 카테고리 코드로 카테고리 찾기
      if (category !== 'all') {
        const categoryDoc = await Category.findOne({ code: category, isActive: true });
        if (categoryDoc) {
          query.categoryId = categoryDoc._id;
        } else {
          // 카테고리를 찾을 수 없으면 빈 결과 반환
          return paginatedResponse(res, { products: [] }, calculatePagination(page, limit, 0), '상품 목록 조회 성공');
        }
      }
      // category === 'all'이면 필터링하지 않음
    }

    if (sellerId) query.sellerId = sellerId;
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseInt(minPrice);
      if (maxPrice) query.basePrice.$lte = parseInt(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = search ? { score: { $meta: 'textScore' } } : { [sort]: sortOrder };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate('categoryId', 'name slug code color')
      .populate('sellerId', 'businessName')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // 각 상품의 이미지 조회
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        // Primary 이미지 또는 첫 번째 이미지 조회
        const primaryImage = await ProductImage.findOne({ 
          productId: product._id, 
          isPrimary: true 
        }).sort({ order: 1 });
        
        if (!primaryImage) {
          // Primary 이미지가 없으면 첫 번째 이미지 조회
          const firstImage = await ProductImage.findOne({ 
            productId: product._id 
          }).sort({ order: 1 });
          productObj.imageUrl = firstImage?.url || null;
          productObj.images = firstImage ? [firstImage] : [];
        } else {
          productObj.imageUrl = primaryImage.url;
          productObj.images = [primaryImage];
        }
        
        return productObj;
      })
    );

    const total = await Product.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { products: productsWithImages }, pagination, '상품 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 상품 상세 조회
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('categoryId', 'name slug')
      .populate('sellerId', 'businessName')
      .populate('supplierId', 'name');

    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 조회수 증가
    product.viewCount += 1;
    await product.save();

    // 옵션 및 이미지 조회
    const [options, images] = await Promise.all([
      ProductOption.find({ productId: id }),
      ProductImage.find({ productId: id }).sort({ order: 1 })
    ]);

    successResponse(res, {
      product: {
        ...product.toObject(),
        options,
        images
      }
    }, '상품 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// AI 상품 설명 생성 (스켈레톤 - 실제 AI 연동 필요)
export const generateAIDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { keywords } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // TODO: 실제 AI API 연동
    // 여기서는 예시 응답만 반환
    const aiDescription = `이 상품은 ${keywords || product.name}에 대한 상세 설명입니다.`;
    const aiSummary = `${product.name}의 주요 특징과 장점을 요약한 내용입니다.`;

    product.aiDescription = aiDescription;
    product.aiSummary = aiSummary;
    await product.save();

    successResponse(res, {
      description: aiDescription,
      summary: aiSummary
    }, 'AI 설명이 생성되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 판매자/관리자: 상품 등록
export const createProduct = async (req, res) => {
  try {
    // 카테고리 검증
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category || !category.isActive) {
        return errorResponse(res, '유효하지 않은 카테고리입니다.', 400);
      }
    } else {
      return errorResponse(res, '카테고리는 필수 항목입니다.', 400);
    }

    // 관리자는 직접 등록 가능
    if (req.user.role === 'admin') {
      const productData = {
        ...req.body,
        ownershipType: req.body.ownershipType || 'platform'
      };

      const product = await Product.create(productData);
      return successResponse(res, { product }, '상품이 등록되었습니다.', 201);
    }

    // 판매자는 seller 검증 필요
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || seller.status !== 'approved') {
      return errorResponse(res, '판매자 권한이 없습니다.', 403);
    }

    // 카테고리 재검증 (판매자 경로)
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category || !category.isActive) {
        return errorResponse(res, '유효하지 않은 카테고리입니다.', 400);
      }
    }

    const productData = {
      ...req.body,
      sellerId: seller._id,
      ownershipType: 'seller'
    };

    const product = await Product.create(productData);

    successResponse(res, { product }, '상품이 등록되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 판매자/관리자: 상품 수정
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 관리자는 모든 상품 수정 가능
    if (req.user.role === 'admin') {
      // 카테고리 검증
      if (req.body.categoryId) {
        const category = await Category.findById(req.body.categoryId);
        if (!category || !category.isActive) {
          return errorResponse(res, '유효하지 않은 카테고리입니다.', 400);
        }
      }

      Object.assign(product, req.body);
      await product.save();
      return successResponse(res, { product }, '상품이 수정되었습니다.');
    }

    // 판매자는 자신의 상품만 수정 가능
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 권한이 없습니다.', 403);
    }

    if (product.sellerId?.toString() !== seller._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    // 카테고리 검증
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category || !category.isActive) {
        return errorResponse(res, '유효하지 않은 카테고리입니다.', 400);
      }
    }

    Object.assign(product, req.body);
    await product.save();

    successResponse(res, { product }, '상품이 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 판매자/관리자: 상품 삭제
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 관리자는 모든 상품 삭제 가능
    if (req.user.role === 'admin') {
      product.status = 'inactive';
      await product.save();
      return successResponse(res, { product }, '상품이 삭제되었습니다.');
    }

    // 판매자는 자신의 상품만 삭제 가능
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 권한이 없습니다.', 403);
    }

    if (product.sellerId?.toString() !== seller._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    product.status = 'inactive';
    await product.save();

    successResponse(res, { product }, '상품이 삭제되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 옵션 조회
export const getProductOptions = async (req, res) => {
  try {
    const { id } = req.params;
    const options = await ProductOption.find({ productId: id }).sort({ order: 1 });
    successResponse(res, { options }, '옵션 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 상품 이미지 조회
export const getProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const images = await ProductImage.find({ productId: id }).sort({ order: 1 });
    successResponse(res, { images }, '이미지 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 상품 이미지 추가
export const addProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, alt, order = 0, isPrimary = false } = req.body;

    if (!url) {
      return errorResponse(res, '이미지 URL이 필요합니다.', 400);
    }

    // 관리자 또는 해당 상품의 판매자만 이미지 추가 가능
    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 관리자는 모든 상품에 이미지 추가 가능
    if (req.user.role !== 'admin') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || product.sellerId?.toString() !== seller._id.toString()) {
        return errorResponse(res, '권한이 없습니다.', 403);
      }
    }

    // 기존 primary 이미지가 있으면 해제
    if (isPrimary) {
      await ProductImage.updateMany(
        { productId: id, isPrimary: true },
        { isPrimary: false }
      );
    }

    const image = await ProductImage.create({
      productId: id,
      url,
      alt: alt || product.name,
      order,
      isPrimary
    });

    successResponse(res, { image }, '이미지가 추가되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 이미지 수정
export const updateProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const { url, alt, order, isPrimary } = req.body;

    const image = await ProductImage.findById(imageId);
    if (!image) {
      return errorResponse(res, '이미지를 찾을 수 없습니다.', 404);
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 관리자는 모든 상품의 이미지 수정 가능
    if (req.user.role !== 'admin') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || product.sellerId?.toString() !== seller._id.toString()) {
        return errorResponse(res, '권한이 없습니다.', 403);
      }
    }

    // 기존 primary 이미지가 있으면 해제
    if (isPrimary && !image.isPrimary) {
      await ProductImage.updateMany(
        { productId: id, isPrimary: true },
        { isPrimary: false }
      );
    }

    if (url) image.url = url;
    if (alt !== undefined) image.alt = alt;
    if (order !== undefined) image.order = order;
    if (isPrimary !== undefined) image.isPrimary = isPrimary;

    await image.save();

    successResponse(res, { image }, '이미지가 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 상품 이미지 삭제
export const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const image = await ProductImage.findById(imageId);
    if (!image) {
      return errorResponse(res, '이미지를 찾을 수 없습니다.', 404);
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    // 관리자는 모든 상품의 이미지 삭제 가능
    if (req.user.role !== 'admin') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || product.sellerId?.toString() !== seller._id.toString()) {
        return errorResponse(res, '권한이 없습니다.', 403);
      }
    }

    await ProductImage.findByIdAndDelete(imageId);

    successResponse(res, null, '이미지가 삭제되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

