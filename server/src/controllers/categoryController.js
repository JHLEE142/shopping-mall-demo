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
        try {
          // category 필드가 문자열인 경우 (카테고리 이름으로 매칭)
          const productCount = await Product.countDocuments({ 
            category: category.name
          });
          category.productCount = productCount;
        } catch (countError) {
          // 상품 수 계산 실패 시 0으로 설정
          console.error(`카테고리 ${category.name}의 상품 수 계산 실패:`, countError);
          category.productCount = 0;
        }
      }
    }

    successResponse(res, { categories }, '카테고리 목록 조회 성공');
  } catch (error) {
    console.error('카테고리 목록 조회 중 오류:', error);
    errorResponse(res, error.message || '카테고리 목록 조회에 실패했습니다.', 500);
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
    const { name, slug, code, description, color, image, icon, parentId, level, order, commissionRate } = req.body;

    if (!name || !slug || !code) {
      return errorResponse(res, '이름, 슬러그, 코드는 필수 입력 항목입니다.', 400);
    }

    // level 자동 설정 (parentId가 있으면 부모의 level + 1)
    let categoryLevel = level;
    if (!categoryLevel && parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return errorResponse(res, '부모 카테고리를 찾을 수 없습니다.', 404);
      }
      categoryLevel = parentCategory.level + 1;
      if (categoryLevel > 3) {
        return errorResponse(res, '카테고리는 최대 3단계까지만 생성할 수 있습니다.', 400);
      }
    } else if (!categoryLevel) {
      categoryLevel = 1; // 기본값: 대분류
    }

    // level 검증
    if (categoryLevel < 1 || categoryLevel > 3) {
      return errorResponse(res, '카테고리 레벨은 1(대분류), 2(중분류), 3(소분류)만 가능합니다.', 400);
    }

    // 중복 확인
    const existingCategory = await Category.findOne({ 
      $or: [{ slug }, { code }] 
    });

    if (existingCategory) {
      return errorResponse(res, '이미 존재하는 슬러그 또는 코드입니다.', 400);
    }

    // pathIds와 pathNames 계산
    let pathIds = [];
    let pathNames = [];
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (parentCategory) {
        pathIds = [...(parentCategory.pathIds || []), parentCategory._id];
        pathNames = [...(parentCategory.pathNames || []), parentCategory.name];
      }
    }

    // isLeaf 계산: 소분류(level=3)이거나 자식이 없는 경우
    const isLeaf = categoryLevel === 3;

    const category = await Category.create({
      name,
      slug,
      code,
      description,
      color: color || '#333333',
      image,
      icon,
      parentId: parentId || null,
      level: categoryLevel,
      pathIds,
      pathNames,
      isLeaf,
      order: order || 0,
      commissionRate: commissionRate || 0
    });

    // 부모 카테고리의 isLeaf 업데이트 (자식이 생겼으므로 false로 변경)
    if (parentId) {
      await Category.findByIdAndUpdate(parentId, { isLeaf: false });
    }

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
    const { name, slug, code, description, color, image, icon, parentId, level, order, isActive, commissionRate } = req.body;

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

    // level 자동 설정 (parentId가 변경되는 경우)
    let categoryLevel = level;
    if (parentId !== undefined && parentId !== null) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return errorResponse(res, '부모 카테고리를 찾을 수 없습니다.', 404);
      }
      categoryLevel = parentCategory.level + 1;
      if (categoryLevel > 3) {
        return errorResponse(res, '카테고리는 최대 3단계까지만 생성할 수 있습니다.', 400);
      }
    } else if (parentId === null) {
      categoryLevel = 1; // 부모가 없으면 대분류
    }

    // level 검증
    if (categoryLevel !== undefined && (categoryLevel < 1 || categoryLevel > 3)) {
      return errorResponse(res, '카테고리 레벨은 1(대분류), 2(중분류), 3(소분류)만 가능합니다.', 400);
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
    if (categoryLevel !== undefined) category.level = categoryLevel;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;
    if (commissionRate !== undefined) category.commissionRate = commissionRate;

    // parentId나 level이 변경된 경우 pathIds와 pathNames 재계산
    if (parentId !== undefined || categoryLevel !== undefined) {
      let pathIds = [];
      let pathNames = [];
      const finalParentId = parentId !== undefined ? parentId : category.parentId;
      if (finalParentId) {
        const parentCategory = await Category.findById(finalParentId);
        if (parentCategory) {
          pathIds = [...(parentCategory.pathIds || []), parentCategory._id];
          pathNames = [...(parentCategory.pathNames || []), parentCategory.name];
        }
      }
      category.pathIds = pathIds;
      category.pathNames = pathNames;
    }

    // isLeaf 계산: 소분류(level=3)이거나 자식이 없는 경우
    const finalLevel = categoryLevel !== undefined ? categoryLevel : category.level;
    const childCount = await Category.countDocuments({ parentId: category._id, isActive: true });
    category.isLeaf = finalLevel === 3 || childCount === 0;

    await category.save();

    // 부모 카테고리의 isLeaf 업데이트
    const finalParentId = parentId !== undefined ? parentId : category.parentId;
    if (finalParentId) {
      await Category.findByIdAndUpdate(finalParentId, { isLeaf: false });
    }

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

// 계층 구조 조회 (대분류 > 중분류 > 소분류)
const getCategoryHierarchy = async (req, res) => {
  try {
    const { includeProductCount } = req.query;

    // 모든 활성 카테고리 조회
    const allCategories = await Category.find({ 
      isActive: { $ne: false }
    }).sort({ order: 1, createdAt: 1 });

    // level 필드가 없는 경우 parentId를 기준으로 level 자동 설정
    const categoriesWithLevel = allCategories.map(cat => {
      const catObj = cat.toObject();
      if (!catObj.level) {
        // parentId가 null이면 대분류 (level 1)
        if (!catObj.parentId) {
          catObj.level = 1;
        } else {
          // parentId가 있으면 부모의 level + 1
          const parent = allCategories.find(c => c._id.toString() === catObj.parentId?.toString());
          if (parent) {
            const parentLevel = parent.level || (!parent.parentId ? 1 : 2);
            catObj.level = Math.min(parentLevel + 1, 3); // 최대 3단계
          } else {
            catObj.level = 2; // 부모를 찾을 수 없으면 중분류로 간주
          }
        }
      }
      return catObj;
    });

    // level별로 분류
    const mainCategories = categoriesWithLevel.filter(cat => cat.level === 1);
    const midCategories = categoriesWithLevel.filter(cat => cat.level === 2);
    const subCategories = categoriesWithLevel.filter(cat => cat.level === 3);

    // 상품 수 포함 여부
    if (includeProductCount === 'true') {
      for (const category of [...mainCategories, ...midCategories, ...subCategories]) {
        try {
          const productCount = await Product.countDocuments({ 
            category: category.name
          });
          category.productCount = productCount;
        } catch (countError) {
          console.error(`카테고리 ${category.name}의 상품 수 계산 실패:`, countError);
          category.productCount = 0;
        }
      }
    }

    // 계층 구조로 구성 (children 사용)
    const hierarchy = mainCategories.map(mainCat => {
      const mainIdStr = mainCat._id?.toString() || mainCat._id;
      const midCats = midCategories
        .filter(midCat => {
          const parentId = midCat.parentId?.toString() || midCat.parentId;
          return parentId === mainIdStr;
        })
        .map(midCat => {
          const midIdStr = midCat._id?.toString() || midCat._id;
          const subCats = subCategories
            .filter(subCat => {
              const parentId = subCat.parentId?.toString() || subCat.parentId;
              return parentId === midIdStr;
            });
          return {
            ...midCat,
            children: subCats  // subCategories -> children으로 변경
          };
        });

      return {
        ...mainCat,
        children: midCats  // midCategories -> children으로 변경
      };
    });

    successResponse(res, { hierarchy }, '계층 구조 카테고리 조회 성공');
  } catch (error) {
    console.error('계층 구조 카테고리 조회 중 오류:', error);
    errorResponse(res, error.message || '계층 구조 카테고리 조회에 실패했습니다.', 500);
  }
};

// 대량 카테고리 저장 (대분류 > 중분류 > 소분류 형식)
const bulkCreateCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return errorResponse(res, '카테고리 배열이 필요합니다.', 400);
    }

    const results = {
      created: [],
      errors: [],
      skipped: []
    };

    // 코드 중복 체크를 위한 Set
    const existingCodes = new Set();
    const newCodes = new Set();

    // 기존 코드 조회
    const existingCategories = await Category.find({}, { code: 1 });
    existingCategories.forEach(cat => existingCodes.add(cat.code.toLowerCase()));

    // 1단계: 대분류 생성
    const mainCategoryMap = new Map(); // name -> category object
    const midCategoryMap = new Map(); // "대분류-중분류" -> category object
    const subCategoryMap = new Map(); // "대분류-중분류-소분류" -> category object

    for (const item of categories) {
      const { 대분류, 중분류, 소분류 } = item;

      if (!대분류) {
        results.errors.push({ item, error: '대분류가 없습니다.' });
        continue;
      }

      // 대분류가 아직 생성되지 않았다면 생성
      if (!mainCategoryMap.has(대분류)) {
        const mainCode = 대분류.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const mainSlug = mainCode;

        if (existingCodes.has(mainCode) || newCodes.has(mainCode)) {
          // 이미 존재하는 경우 조회
          const existing = await Category.findOne({ code: mainCode });
          if (existing) {
            mainCategoryMap.set(대분류, existing);
          } else {
            results.errors.push({ item, error: `대분류 코드 중복: ${mainCode}` });
            continue;
          }
        } else {
          try {
            const mainCategory = await Category.create({
              name: 대분류,
              slug: mainSlug,
              code: mainCode,
              level: 1,
              parentId: null,
              order: 0
            });
            mainCategoryMap.set(대분류, mainCategory);
            newCodes.add(mainCode);
            results.created.push({ level: 1, name: 대분류, code: mainCode });
          } catch (error) {
            results.errors.push({ item, error: `대분류 생성 실패: ${error.message}` });
            continue;
          }
        }
      }

      const mainCategory = mainCategoryMap.get(대분류);

      // 2단계: 중분류 생성
      if (중분류) {
        const midKey = `${대분류}-${중분류}`;
        const midCode = `${mainCategory.code}-${중분류.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        const midSlug = midCode;

        if (!midCategoryMap.has(midKey)) {
          let midCategory;
          if (existingCodes.has(midCode) || newCodes.has(midCode)) {
            midCategory = await Category.findOne({ code: midCode });
            if (!midCategory) {
              results.errors.push({ item, error: `중분류 코드 중복: ${midCode}` });
              continue;
            }
          } else {
            try {
              midCategory = await Category.create({
                name: 중분류,
                slug: midSlug,
                code: midCode,
                level: 2,
                parentId: mainCategory._id,
                order: 0
              });
              newCodes.add(midCode);
              results.created.push({ level: 2, name: 중분류, code: midCode, parent: 대분류 });
            } catch (error) {
              results.errors.push({ item, error: `중분류 생성 실패: ${error.message}` });
              continue;
            }
          }
          midCategoryMap.set(midKey, midCategory);
        }

        const midCategory = midCategoryMap.get(midKey);

        // 3단계: 소분류 생성
        if (소분류) {
          const subKey = `${대분류}-${중분류}-${소분류}`;
          const subCode = `${midCategory.code}-${소분류.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
          const subSlug = subCode;

          if (!subCategoryMap.has(subKey)) {
            if (existingCodes.has(subCode) || newCodes.has(subCode)) {
              results.skipped.push({ level: 3, name: 소분류, code: subCode, reason: '이미 존재함' });
            } else {
              try {
                await Category.create({
                  name: 소분류,
                  slug: subSlug,
                  code: subCode,
                  level: 3,
                  parentId: midCategory._id,
                  order: 0
                });
                newCodes.add(subCode);
                results.created.push({ level: 3, name: 소분류, code: subCode, parent: 중분류 });
              } catch (error) {
                results.errors.push({ item, error: `소분류 생성 실패: ${error.message}` });
              }
            }
            subCategoryMap.set(subKey, true); // 중복 방지용
          }
        }
      }
    }

    successResponse(res, { 
      summary: {
        total: categories.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    }, '대량 카테고리 저장 완료', 201);
  } catch (error) {
    console.error('대량 카테고리 저장 중 오류:', error);
    errorResponse(res, error.message || '대량 카테고리 저장에 실패했습니다.', 500);
  }
};

// 대량 카테고리 저장 (">" 구분자 형식: "대분류 > 중분류 > 소분류")
const bulkCreateCategoriesFromString = async (req, res) => {
  try {
    const { items } = req.body; // 문자열 배열 또는 단일 문자열

    if (!items) {
      return errorResponse(res, '카테고리 데이터가 필요합니다.', 400);
    }

    // 문자열 배열로 변환
    let categoryStrings = [];
    if (typeof items === 'string') {
      // 단일 문자열인 경우 줄바꿈으로 분리
      categoryStrings = items.split('\n').map(s => s.trim()).filter(s => s);
    } else if (Array.isArray(items)) {
      categoryStrings = items.map(item => {
        if (typeof item === 'string') {
          return item.trim();
        } else if (item && typeof item === 'object' && item.category) {
          return item.category.trim();
        }
        return null;
      }).filter(Boolean);
    } else {
      return errorResponse(res, '카테고리 데이터는 문자열 배열이어야 합니다.', 400);
    }

    if (categoryStrings.length === 0) {
      return errorResponse(res, '카테고리 데이터가 없습니다.', 400);
    }

    // ">" 구분자로 파싱하여 객체 배열로 변환
    const categories = categoryStrings.map((str, index) => {
      const parts = str.split('>').map(p => p.trim()).filter(p => p);
      
      if (parts.length === 0) {
        return { error: `줄 ${index + 1}: 빈 데이터`, original: str };
      }
      
      if (parts.length === 1) {
        return { 대분류: parts[0], 중분류: null, 소분류: null, original: str };
      } else if (parts.length === 2) {
        return { 대분류: parts[0], 중분류: parts[1], 소분류: null, original: str };
      } else if (parts.length >= 3) {
        // 3개 이상이면 처음 3개만 사용
        return { 대분류: parts[0], 중분류: parts[1], 소분류: parts[2], original: str };
      }
    }).filter(item => !item.error || item.대분류); // 에러가 있어도 대분류가 있으면 처리

    // 기존 bulkCreateCategories 함수 재사용
    const results = {
      created: [],
      errors: [],
      skipped: []
    };

    const existingCodes = new Set();
    const newCodes = new Set();
    const existingCategories = await Category.find({}, { code: 1 });
    existingCategories.forEach(cat => existingCodes.add(cat.code.toLowerCase()));

    const mainCategoryMap = new Map();
    const midCategoryMap = new Map();
    const subCategoryMap = new Map();

    for (const item of categories) {
      if (item.error) {
        results.errors.push({ item, error: item.error });
        continue;
      }

      const { 대분류, 중분류, 소분류 } = item;

      if (!대분류) {
        results.errors.push({ item, error: '대분류가 없습니다.', original: item.original });
        continue;
      }

      // 대분류 생성
      if (!mainCategoryMap.has(대분류)) {
        const mainCode = 대분류.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '');
        const mainSlug = mainCode;

        if (existingCodes.has(mainCode) || newCodes.has(mainCode)) {
          const existing = await Category.findOne({ code: mainCode });
          if (existing) {
            mainCategoryMap.set(대분류, existing);
          } else {
            results.errors.push({ item, error: `대분류 코드 중복: ${mainCode}`, original: item.original });
            continue;
          }
        } else {
          try {
            const mainCategory = await Category.create({
              name: 대분류,
              slug: mainSlug,
              code: mainCode,
              level: 1,
              parentId: null,
              order: 0
            });
            mainCategoryMap.set(대분류, mainCategory);
            newCodes.add(mainCode);
            results.created.push({ level: 1, name: 대분류, code: mainCode });
          } catch (error) {
            results.errors.push({ item, error: `대분류 생성 실패: ${error.message}`, original: item.original });
            continue;
          }
        }
      }

      const mainCategory = mainCategoryMap.get(대분류);

      // 중분류 생성
      if (중분류) {
        const midKey = `${대분류}-${중분류}`;
        const midCode = `${mainCategory.code}-${중분류.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '')}`;
        const midSlug = midCode;

        if (!midCategoryMap.has(midKey)) {
          let midCategory;
          if (existingCodes.has(midCode) || newCodes.has(midCode)) {
            midCategory = await Category.findOne({ code: midCode });
            if (!midCategory) {
              results.errors.push({ item, error: `중분류 코드 중복: ${midCode}`, original: item.original });
              continue;
            }
          } else {
            try {
              midCategory = await Category.create({
                name: 중분류,
                slug: midSlug,
                code: midCode,
                level: 2,
                parentId: mainCategory._id,
                order: 0
              });
              newCodes.add(midCode);
              results.created.push({ level: 2, name: 중분류, code: midCode, parent: 대분류 });
            } catch (error) {
              results.errors.push({ item, error: `중분류 생성 실패: ${error.message}`, original: item.original });
              continue;
            }
          }
          midCategoryMap.set(midKey, midCategory);
        }

        const midCategory = midCategoryMap.get(midKey);

        // 소분류 생성
        if (소분류) {
          const subKey = `${대분류}-${중분류}-${소분류}`;
          const subCode = `${midCategory.code}-${소분류.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '')}`;
          const subSlug = subCode;

          if (!subCategoryMap.has(subKey)) {
            if (existingCodes.has(subCode) || newCodes.has(subCode)) {
              results.skipped.push({ level: 3, name: 소분류, code: subCode, reason: '이미 존재함', original: item.original });
            } else {
              try {
                await Category.create({
                  name: 소분류,
                  slug: subSlug,
                  code: subCode,
                  level: 3,
                  parentId: midCategory._id,
                  order: 0
                });
                newCodes.add(subCode);
                results.created.push({ level: 3, name: 소분류, code: subCode, parent: 중분류, original: item.original });
              } catch (error) {
                results.errors.push({ item, error: `소분류 생성 실패: ${error.message}`, original: item.original });
              }
            }
            subCategoryMap.set(subKey, true);
          }
        }
      }
    }

    successResponse(res, { 
      summary: {
        total: categoryStrings.length,
        parsed: categories.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    }, '대량 카테고리 저장 완료', 201);
  } catch (error) {
    console.error('대량 카테고리 저장 중 오류:', error);
    errorResponse(res, error.message || '대량 카테고리 저장에 실패했습니다.', 500);
  }
};

// 대분류에 중분류/소분류 자동 추가
const addDefaultSubCategories = async (req, res) => {
  try {
    // 대분류별 중분류/소분류 데이터
    const categoryData = {
      '의류': {
        midCategories: {
          '상의': ['티셔츠', '셔츠', '블라우스', '후드티', '맨투맨'],
          '하의': ['청바지', '슬랙스', '반바지', '치마', '레깅스'],
          '아우터': ['자켓', '코트', '패딩', '가디건', '후드집업'],
          '신발': ['운동화', '구두', '부츠', '샌들', '슬리퍼']
        }
      },
      '주방용품': {
        midCategories: {
          '조리도구': ['건지기/망', '냄비/솥', '프라이팬', '주전자', '칼/도마'],
          '식기': ['접시', '그릇', '컵/머그', '수저', '젓가락'],
          '보관용품': ['밀폐용기', '보관병', '랩/호일', '비닐봉지', '보관박스']
        }
      },
      '가전제품': {
        midCategories: {
          '주방가전': ['전자레인지', '에어프라이어', '믹서기', '토스터', '커피머신'],
          '생활가전': ['청소기', '선풍기', '가습기', '공기청정기', '다리미'],
          '냉장/냉동': ['냉장고', '냉동고', '김치냉장고', '와인셀러']
        }
      },
      '가구': {
        midCategories: {
          '침실가구': ['침대', '매트리스', '옷장', '화장대', '협탁'],
          '거실가구': ['소파', '테이블', 'TV장', '책장', '의자'],
          '주방가구': ['식탁', '의자', '수납장', '선반', '카운터']
        }
      },
      '전자제품': {
        midCategories: {
          '스마트폰': ['아이폰', '갤럭시', '기타 스마트폰', '액세서리'],
          '태블릿': ['아이패드', '갤럭시탭', '기타 태블릿'],
          '노트북': ['맥북', '윈도우 노트북', '크롬북', '액세서리']
        }
      },
      '화장품': {
        midCategories: {
          '스킨케어': ['토너', '에센스', '크림', '세럼', '마스크팩'],
          '메이크업': ['파운데이션', '립스틱', '아이섀도', '마스카라', '파우더'],
          '향수': ['여성향수', '남성향수', '바디미스트']
        }
      },
      '식품': {
        midCategories: {
          '과일/채소': ['과일', '채소', '냉동과일', '건조과일'],
          '육류/해산물': ['소고기', '돼지고기', '닭고기', '생선', '해산물'],
          '유제품': ['우유', '요구르트', '치즈', '버터', '아이스크림']
        }
      },
      '스포츠': {
        midCategories: {
          '운동용품': ['덤벨', '요가매트', '운동복', '운동화', '물병'],
          '야구': ['야구공', '야구배트', '글러브', '야구모자'],
          '축구': ['축구공', '축구화', '유니폼', '축구양말']
        }
      },
      '도서': {
        midCategories: {
          '소설': ['한국소설', '외국소설', '추리소설', '판타지소설'],
          '에세이': ['에세이', '시집', '수필'],
          '자기계발': ['자기계발서', '경영서', '인문학']
        }
      },
      '완구': {
        midCategories: {
          '인형': ['인형', '곰인형', '캐릭터인형'],
          '블록': ['레고', '블록', '퍼즐'],
          '보드게임': ['보드게임', '카드게임', '퍼즐게임']
        }
      },
      '반려동물용품': {
        midCategories: {
          '강아지용품': ['사료', '간식', '장난감', '목줄', '하우스'],
          '고양이용품': ['사료', '간식', '장난감', '캣타워', '화장실'],
          '기타용품': ['이동장', '의류', '미용용품']
        }
      },
      '건강용품': {
        midCategories: {
          '보조제': ['비타민', '오메가3', '프로틴', '콜라겐'],
          '운동용품': ['마사지기', '저항밴드', '요가매트', '폼롤러'],
          '측정기기': ['체중계', '혈압계', '혈당계']
        }
      },
      '문구/사무용품': {
        midCategories: {
          '필기구': ['펜', '연필', '마커', '형광펜'],
          '노트/다이어리': ['노트', '다이어리', '플래너', '스케줄러'],
          '파일/바인더': ['파일', '바인더', '클리어파일', '서류함']
        }
      },
      '악세서리': {
        midCategories: {
          '시계': ['손목시계', '벽시계', '알람시계'],
          '가방': ['백팩', '토트백', '크로스백', '지갑'],
          '모자': ['볼캡', '버킷햇', '비니', '야구모자']
        }
      },
      '홈데코': {
        midCategories: {
          '조명': ['스탠드', '펜던트', '무드등', 'LED조명'],
          '커튼': ['커튼', '블라인드', '롤스크린'],
          '인테리어소품': ['액자', '화분', '디퓨저', '캔들']
        }
      },
      '자동차용품': {
        midCategories: {
          '세차용품': ['세차용품', '왁스', '스펀지', '타월'],
          '내부용품': ['시트커버', '핸들커버', '매트', '방향제'],
          '안전용품': ['비상키트', '삼각대', '경고등', '안전벨트']
        }
      }
    };

    // 모든 대분류 조회
    const mainCategories = await Category.find({ 
      $or: [
        { level: 1 },
        { level: { $exists: false }, parentId: null }
      ],
      isActive: { $ne: false }
    }).lean();

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const mainCat of mainCategories) {
      const mainName = mainCat.name;
      const mainData = categoryData[mainName];

      if (!mainData) {
        continue;
      }

      for (const [midName, subNames] of Object.entries(mainData.midCategories)) {
        // 중분류 생성 또는 조회
        const midCode = `${mainCat.code || mainName.toLowerCase().replace(/\s+/g, '-')}-${midName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '')}`;
        
        let midCategory = await Category.findOne({ code: midCode });
        
        if (!midCategory) {
          try {
            midCategory = await Category.create({
              name: midName,
              slug: midCode,
              code: midCode,
              level: 2,
              parentId: mainCat._id,
              order: 0
            });
            results.created.push({ level: 2, name: midName, parent: mainName });
          } catch (error) {
            results.errors.push({ error: `중분류 "${midName}" 생성 실패: ${error.message}` });
            continue;
          }
        }

        // 소분류 생성
        for (const subName of subNames) {
          const subCode = `${midCategory.code}-${subName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '')}`;
          
          const existingSub = await Category.findOne({ code: subCode });
          
          if (!existingSub) {
            try {
              await Category.create({
                name: subName,
                slug: subCode,
                code: subCode,
                level: 3,
                parentId: midCategory._id,
                order: 0
              });
              results.created.push({ level: 3, name: subName, parent: midName });
            } catch (error) {
              results.errors.push({ error: `소분류 "${subName}" 생성 실패: ${error.message}` });
            }
          }
        }
      }
    }

    successResponse(res, { 
      summary: {
        mainCategories: mainCategories.length,
        created: results.created.length,
        errors: results.errors.length
      },
      details: results
    }, '중분류/소분류 추가 완료', 201);
  } catch (error) {
    console.error('중분류/소분류 추가 중 오류:', error);
    errorResponse(res, error.message || '중분류/소분류 추가에 실패했습니다.', 500);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryProductCount,
  updateAllCategoryProductCounts,
  getCategoryHierarchy,
  bulkCreateCategories,
  bulkCreateCategoriesFromString,
  addDefaultSubCategories
};

