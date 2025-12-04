import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 카테고리 목록 조회
export const getCategories = async (req, res) => {
  try {
    const { parentId, includeProductCount } = req.query;
    const query = { isActive: true };
    
    if (parentId) {
      query.parentId = parentId;
    } else {
      query.parentId = null; // 최상위 카테고리
    }

    const categories = await Category.find(query)
      .sort({ order: 1, createdAt: 1 });

    // 상품 수 포함 여부
    if (includeProductCount === 'true') {
      for (const category of categories) {
        const productCount = await Product.countDocuments({ 
          categoryId: category._id,
          status: 'active'
        });
        category.productCount = productCount;
      }
    }

    successResponse(res, { categories }, '카테고리 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 카테고리 상세 조회 (ID 또는 code로 조회)
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ObjectId 형식인지 확인
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let category;
    
    if (isObjectId) {
      category = await Category.findById(id);
    } else {
      // code로 조회
      category = await Category.findOne({ code: id });
    }

    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    // 상품 수 계산
    const productCount = await Product.countDocuments({ 
      categoryId: category._id,
      status: 'active'
    });
    category.productCount = productCount;

    successResponse(res, { category }, '카테고리 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 카테고리 생성
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    successResponse(res, { category }, '카테고리가 생성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 카테고리 수정
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });

    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { category }, '카테고리가 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 카테고리 삭제
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { category }, '카테고리가 삭제되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 카테고리별 상품 수 업데이트
export const updateCategoryProductCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let category;
    
    if (isObjectId) {
      category = await Category.findById(id);
    } else {
      category = await Category.findOne({ code: id });
    }

    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    const productCount = await Product.countDocuments({ 
      categoryId: category._id,
      status: 'active'
    });

    category.productCount = productCount;
    await category.save();

    successResponse(res, { category }, '카테고리 상품 수가 업데이트되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 모든 카테고리의 상품 수 업데이트
export const updateAllCategoryProductCounts = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    
    for (const category of categories) {
      const productCount = await Product.countDocuments({ 
        categoryId: category._id,
        status: 'active'
      });
      category.productCount = productCount;
      await category.save();
    }

    successResponse(res, { 
      updated: categories.length 
    }, '모든 카테고리의 상품 수가 업데이트되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

