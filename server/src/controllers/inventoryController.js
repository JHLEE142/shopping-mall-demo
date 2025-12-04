const Product = require('../models/product');

function computeInventoryStatus(stock, reorderPoint) {
  if (stock <= 0) {
    return 'out-of-stock';
  }
  if (stock <= Math.max(reorderPoint, 0)) {
    return stock <= Math.max(Math.ceil(reorderPoint / 2), 1) ? 'critical' : 'low-stock';
  }
  return 'in-stock';
}

async function listInventory(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter['inventory.status'] = req.query.status;
    }

    const [items, totalItems] = await Promise.all([
      Product.find(filter)
        .sort({ 'inventory.updatedAt': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
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
}

async function updateInventory(req, res, next) {
  try {
    const { id } = req.params;
    const { stock, reserved, reorderPoint, supplier, cost } = req.body || {};

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.inventory) {
      product.inventory = {};
    }

    if (stock !== undefined) {
      product.inventory.stock = Math.max(Number(stock) || 0, 0);
    }
    if (reserved !== undefined) {
      product.inventory.reserved = Math.max(Number(reserved) || 0, 0);
    }
    if (reorderPoint !== undefined) {
      product.inventory.reorderPoint = Math.max(Number(reorderPoint) || 0, 0);
    }
    if (supplier !== undefined) {
      product.inventory.supplier = supplier;
    }
    if (cost !== undefined) {
      product.inventory.cost = Math.max(Number(cost) || 0, 0);
    }

    const effectiveStock = Math.max(product.inventory.stock - product.inventory.reserved, 0);
    product.inventory.status = computeInventoryStatus(
      effectiveStock,
      product.inventory.reorderPoint
    );
    product.inventory.updatedAt = new Date();

    await product.save();

    res.json(product);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listInventory,
  updateInventory,
};














