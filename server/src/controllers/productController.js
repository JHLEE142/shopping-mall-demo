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

    const [items, totalItems] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(),
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


