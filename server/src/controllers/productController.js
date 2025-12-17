const Product = require('../models/product');

// 재고 상태 계산 헬퍼 함수
function calculateInventoryStatus(inventory) {
  if (!inventory) {
    return 'in-stock';
  }
  
  const stock = inventory.stock ?? 0;
  const reserved = inventory.reserved ?? 0;
  let reorderPoint = inventory.reorderPoint ?? 0;
  const available = Math.max(stock - reserved, 0);
  
  // reorderPoint가 0이거나 재고보다 크면 합리적인 기본값 설정
  // 기본값: 재고 수량의 20% (최소 10개)
  if (reorderPoint <= 0 || reorderPoint > stock) {
    reorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
  }
  
  // 재고 상태 계산
  if (available <= 0) {
    return 'out-of-stock';
  } else if (available <= reorderPoint * 0.3) {
    return 'critical';
  } else if (available <= reorderPoint) {
    return 'low-stock';
  } else {
    return 'in-stock';
  }
}

async function createProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    
    // 카테고리 정보 처리
    // categoryId가 있으면 우선 사용 (새로운 방식)
    if (payload.categoryId) {
      // categoryId, categoryPathIds, categoryPathText는 그대로 사용
      // categoryPathIds는 배열로 변환 (문자열 배열이 올 수 있음)
      if (payload.categoryPathIds && Array.isArray(payload.categoryPathIds)) {
        payload.categoryPathIds = payload.categoryPathIds.map(id => 
          typeof id === 'string' ? id : id.toString()
        );
      }
      
      // 하위 호환성을 위해 categoryMain, categoryMid, categorySub도 설정
      if (!payload.categoryMain && payload.categoryPathText) {
        // categoryPathText에서 파싱
        const pathParts = payload.categoryPathText.split(' > ').map(p => p.trim());
        if (pathParts.length >= 1) payload.categoryMain = pathParts[0];
        if (pathParts.length >= 2) payload.categoryMid = pathParts[1];
        if (pathParts.length >= 3) payload.categorySub = pathParts[2];
      }
      
      // category 필드는 최종 선택된 카테고리 (categoryPathText의 마지막 또는 categorySub/categoryMid/categoryMain)
      if (!payload.category) {
        payload.category = payload.categorySub || payload.categoryMid || payload.categoryMain || '';
      }
    } else if (payload.categoryMain) {
      // categoryMain이 있으면 계층 구조 카테고리 사용 (하위 호환성)
      payload.categoryMain = payload.categoryMain.trim();
      payload.categoryMid = payload.categoryMid ? payload.categoryMid.trim() : null;
      payload.categorySub = payload.categorySub ? payload.categorySub.trim() : null;
      // category 필드는 최종 선택된 카테고리 (소분류 > 중분류 > 대분류)
      if (!payload.category) {
        payload.category = payload.categorySub || payload.categoryMid || payload.categoryMain;
      }
    } else if (payload.category) {
      // 하위 호환성: category만 있으면 categoryMain으로 설정
      payload.categoryMain = payload.category.trim();
      payload.categoryMid = null;
      payload.categorySub = null;
    }
    
    if (payload.inventory) {
      payload.inventory.updatedAt = new Date();
      // 재고 상태 자동 계산
      if (!payload.inventory.status) {
        payload.inventory.status = calculateInventoryStatus(payload.inventory);
      }
      // reorderPoint 자동 설정 (0이거나 재고보다 크면)
      const stock = payload.inventory.stock ?? 0;
      const reorderPoint = payload.inventory.reorderPoint ?? 0;
      if (reorderPoint <= 0 || reorderPoint > stock) {
        payload.inventory.reorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
      }
    }
    const newProduct = await Product.create(payload);
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    
    // 카테고리 필터
    const categoryFilter = req.query.category;
    // 검색 쿼리
    const searchQuery = req.query.search;
    const query = {};
    
    if (categoryFilter) {
      // 카테고리 이름으로 필터링 (category 필드가 문자열인 경우)
      query.category = categoryFilter;
    }
    
    // 검색 기능: 상품 이름 또는 설명에서 검색
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i'); // 대소문자 구분 없이 검색
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // 각 상품의 재고 상태를 계산하여 업데이트
    const itemsWithStatus = await Promise.all(
      items.map(async (item) => {
        if (item.inventory) {
          const stock = item.inventory.stock ?? 0;
          let reorderPoint = item.inventory.reorderPoint ?? 0;
          let needsUpdate = false;
          
          // reorderPoint가 0이거나 재고보다 크면 합리적인 기본값 계산
          // 기본값: 재고 수량의 20% (최소 10개)
          if (reorderPoint <= 0 || reorderPoint > stock) {
            const calculatedReorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
            // 응답에 계산된 reorderPoint 반영
            item.inventory.reorderPoint = calculatedReorderPoint;
            reorderPoint = calculatedReorderPoint;
            needsUpdate = true;
          }
          
          // 재고 상태 계산
          const calculatedStatus = calculateInventoryStatus(item.inventory);
          // 상태가 다르면 업데이트 필요
          if (item.inventory.status !== calculatedStatus) {
            item.inventory.status = calculatedStatus;
            needsUpdate = true;
          }
          
          // 데이터베이스에 업데이트가 필요하면 저장
          if (needsUpdate && item._id) {
            try {
              await Product.findByIdAndUpdate(
                item._id,
                {
                  $set: {
                    'inventory.reorderPoint': reorderPoint,
                    'inventory.status': calculatedStatus,
                    'inventory.updatedAt': new Date(),
                  },
                },
                { new: true }
              );
            } catch (error) {
              // 업데이트 실패해도 응답은 계속 진행
              console.error(`Failed to update inventory for product ${item._id}:`, error);
            }
          }
        }
        return item;
      })
    );

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items: itemsWithStatus,
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    const updateQuery = {};
    
    // 카테고리 정보 처리
    // categoryId가 있으면 우선 사용 (새로운 방식)
    if (payload.categoryId) {
      // categoryId, categoryPathIds, categoryPathText 업데이트
      updateQuery.categoryId = payload.categoryId;
      
      if (payload.categoryPathIds && Array.isArray(payload.categoryPathIds)) {
        updateQuery.categoryPathIds = payload.categoryPathIds.map(id => 
          typeof id === 'string' ? id : id.toString()
        );
      } else if (payload.categoryPathIds === null || payload.categoryPathIds === undefined) {
        updateQuery.categoryPathIds = [];
      }
      
      if (payload.categoryPathText !== undefined) {
        updateQuery.categoryPathText = payload.categoryPathText || '';
      }
      
      // 하위 호환성을 위해 categoryMain, categoryMid, categorySub도 설정
      if (payload.categoryPathText) {
        const pathParts = payload.categoryPathText.split(' > ').map(p => p.trim());
        if (pathParts.length >= 1) updateQuery.categoryMain = pathParts[0];
        if (pathParts.length >= 2) updateQuery.categoryMid = pathParts[1];
        if (pathParts.length >= 3) updateQuery.categorySub = pathParts[2];
      } else if (payload.categoryMain) {
        updateQuery.categoryMain = payload.categoryMain.trim();
        updateQuery.categoryMid = payload.categoryMid ? payload.categoryMid.trim() : null;
        updateQuery.categorySub = payload.categorySub ? payload.categorySub.trim() : null;
      }
      
      // category 필드는 최종 선택된 카테고리
      updateQuery.category = payload.category || (payload.categorySub || payload.categoryMid || payload.categoryMain || '');
    } else if (payload.categoryMain) {
      // categoryMain이 있으면 계층 구조 카테고리 사용 (하위 호환성)
      updateQuery.categoryMain = payload.categoryMain.trim();
      updateQuery.categoryMid = payload.categoryMid ? payload.categoryMid.trim() : null;
      updateQuery.categorySub = payload.categorySub ? payload.categorySub.trim() : null;
      // category 필드는 최종 선택된 카테고리 (소분류 > 중분류 > 대분류)
      updateQuery.category = payload.category || (payload.categorySub || payload.categoryMid || payload.categoryMain);
    } else if (payload.category) {
      // 하위 호환성: category만 있으면 categoryMain으로 설정
      updateQuery.categoryMain = payload.category.trim();
      updateQuery.categoryMid = null;
      updateQuery.categorySub = null;
      updateQuery.category = payload.category.trim();
    }
    
    // inventory 필드가 있으면 nested object 업데이트 처리
    if (payload.inventory) {
      const inventory = { ...payload.inventory };
      
      // inventory.updatedAt 자동 설정
      inventory.updatedAt = new Date();
      
      // 재고 상태 자동 계산
      const stock = inventory.stock ?? 0;
      const reserved = inventory.reserved ?? 0;
      let reorderPoint = inventory.reorderPoint ?? 0;
      const available = Math.max(stock - reserved, 0);
      
      // reorderPoint가 0이거나 재고보다 크면 합리적인 기본값 설정
      // 기본값: 재고 수량의 20% (최소 10개)
      if (reorderPoint <= 0 || reorderPoint > stock) {
        reorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
        inventory.reorderPoint = reorderPoint;
      }
      
      // 재고 상태 계산 (헬퍼 함수 사용)
      inventory.status = calculateInventoryStatus(inventory);
      
      // MongoDB에서 nested object 업데이트는 dot notation 사용
      updateQuery['inventory.stock'] = inventory.stock;
      updateQuery['inventory.reserved'] = inventory.reserved;
      updateQuery['inventory.reorderPoint'] = inventory.reorderPoint;
      updateQuery['inventory.supplier'] = inventory.supplier || '';
      updateQuery['inventory.cost'] = inventory.cost || 0;
      updateQuery['inventory.status'] = inventory.status;
      updateQuery['inventory.updatedAt'] = inventory.updatedAt;
    }
    
    // 다른 필드들도 업데이트 (inventory 제외)
    Object.keys(payload).forEach((key) => {
      if (key !== 'inventory' && key !== '_id' && key !== '__v') {
        updateQuery[key] = payload[key];
      }
    });
    
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateQuery },
      {
        new: true,
        runValidators: true,
      }
    ).lean();
    
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};


