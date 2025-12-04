const Category = require('../models/category');
const Product = require('../models/product');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { calculatePagination } = require('../utils/helpers');

// 카테고리 목록 조회
const getCategories = async (req, res) => {
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
const getCategory = async (req, res) => {
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

    // 하위 카테고리 조회
    const subCategories = await Category.find({ 
      parentId: category._id,
      isActive: true 
    }).sort({ order: 1 });

    // 상품 수 조회
    const productCount = await Product.countDocuments({ 
      categoryId: category._id,
      status: 'active'
    });

    successResponse(res, { 
      category: {
        ...category.toObject(),
        subCategories,
        productCount
      }
    }, '카테고리 상세 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 카테고리 생성
const createCategory = async (req, res) => {
  try {
    const { name, slug, code, description, color, image, icon, parentId, order, commissionRate } = req.body;

    if (!name || !slug || !code) {
      return errorResponse(res, '이름, 슬러그, 코드는 필수 입력 항목입니다.', 400);
    }

    // 중복 확인
    const existingCategory = await Category.findOne({ 
      $or: [{ slug }, { code }] 
    });

    if (existingCategory) {
      return errorResponse(res, '이미 존재하는 슬러그 또는 코드입니다.', 400);
    }

    const category = await Category.create({
      name,
      slug,
      code,
      description,
      color: color || '#333333',
      image,
      icon,
      parentId: parentId || null,
      order: order || 0,
      commissionRate: commissionRate || 0
    });

    successResponse(res, { category }, '카테고리가 생성되었습니다.', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, '이미 존재하는 슬러그 또는 코드입니다.', 400);
    }
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 카테고리 수정
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, code, description, color, image, icon, parentId, order, isActive, commissionRate } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    // 중복 확인 (자기 자신 제외)
    if (slug || code) {
      const existingCategory = await Category.findOne({ 
        $or: [
          slug ? { slug, _id: { $ne: id } } : {},
          code ? { code, _id: { $ne: id } } : {}
        ].filter(obj => Object.keys(obj).length > 0)
      });

      if (existingCategory) {
        return errorResponse(res, '이미 존재하는 슬러그 또는 코드입니다.', 400);
      }
    }

    // 업데이트
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (code) category.code = code;
    if (description !== undefined) category.description = description;
    if (color) category.color = color;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (parentId !== undefined) category.parentId = parentId;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;
    if (commissionRate !== undefined) category.commissionRate = commissionRate;

    await category.save();

    successResponse(res, { category }, '카테고리가 수정되었습니다.');
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, '이미 존재하는 슬러그 또는 코드입니다.', 400);
    }
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 카테고리 삭제
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    // 하위 카테고리 확인
    const subCategories = await Category.countDocuments({ parentId: id });
    if (subCategories > 0) {
      return errorResponse(res, '하위 카테고리가 있어 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하세요.', 400);
    }

    // 상품이 있는지 확인
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return errorResponse(res, '이 카테고리에 속한 상품이 있어 삭제할 수 없습니다.', 400);
    }

    await Category.findByIdAndDelete(id);

    successResponse(res, null, '카테고리가 삭제되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 카테고리별 상품 수 업데이트
const updateCategoryProductCount = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, '카테고리를 찾을 수 없습니다.', 404);
    }

    const productCount = await Product.countDocuments({ 
      categoryId: id,
      status: 'active'
    });

    category.productCount = productCount;
    await category.save();

    successResponse(res, { category }, '상품 수가 업데이트되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 모든 카테고리의 상품 수 업데이트
const updateAllCategoryProductCounts = async (req, res) => {
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

    successResponse(res, { updatedCount: categories.length }, '모든 카테고리의 상품 수가 업데이트되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryProductCount,
  updateAllCategoryProductCounts
};

