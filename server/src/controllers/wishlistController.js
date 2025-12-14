const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

// 사용자의 찜하기 목록 가져오기
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product');

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        items: [],
      });
      await wishlist.save();
    }

    // 상품 정보가 삭제된 경우 필터링
    wishlist.items = wishlist.items.filter((item) => item.product !== null);

    return res.json({ wishlist });
  } catch (error) {
    return res.status(500).json({ message: '찜하기 목록을 불러오지 못했습니다.', error: error.message });
  }
};

// 찜하기에 상품 추가
exports.addWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId는 필수 값입니다.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        items: [],
      });
    }

    // 이미 찜하기에 있는지 확인
    const existingItem = wishlist.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      return res.status(409).json({ message: '이미 찜하기에 추가된 상품입니다.', wishlist });
    }

    wishlist.items.push({
      product: productId,
      addedAt: new Date(),
    });

    await wishlist.save();
    await wishlist.populate('items.product');

    return res.status(201).json({ wishlist, message: '찜하기에 추가되었습니다.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 찜하기에 추가된 상품입니다.' });
    }
    return res.status(500).json({ message: '찜하기에 추가하지 못했습니다.', error: error.message });
  }
};

// 찜하기에서 상품 제거
exports.removeWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'productId는 필수 값입니다.' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ message: '찜하기 목록을 찾을 수 없습니다.' });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: '찜하기에서 상품을 찾을 수 없습니다.' });
    }

    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();
    await wishlist.populate('items.product');

    return res.json({ wishlist, message: '찜하기에서 제거되었습니다.' });
  } catch (error) {
    return res.status(500).json({ message: '찜하기에서 제거하지 못했습니다.', error: error.message });
  }
};

// 찜하기에서 여러 상품 제거
exports.removeWishlistItems = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'productIds 배열이 필요합니다.' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ message: '찜하기 목록을 찾을 수 없습니다.' });
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => !productIds.includes(item.product.toString())
    );

    if (wishlist.items.length === initialLength) {
      return res.status(404).json({ message: '제거할 상품을 찾을 수 없습니다.' });
    }

    await wishlist.save();
    await wishlist.populate('items.product');

    return res.json({
      wishlist,
      message: `${initialLength - wishlist.items.length}개의 상품이 찜하기에서 제거되었습니다.`,
    });
  } catch (error) {
    return res.status(500).json({ message: '찜하기에서 제거하지 못했습니다.', error: error.message });
  }
};

// 찜하기에 상품이 있는지 확인
exports.checkWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'productId는 필수 값입니다.' });
    }

    const wishlist = await Wishlist.findOne({
      user: req.user.id,
      'items.product': productId,
    });

    return res.json({ isWishlisted: !!wishlist });
  } catch (error) {
    return res.status(500).json({ message: '찜하기 상태를 확인하지 못했습니다.', error: error.message });
  }
};

// 여러 상품의 찜하기 상태 확인
exports.checkWishlistItems = async (req, res) => {
  try {
    const { productIds } = req.query;

    if (!productIds) {
      return res.json({ wishlistedItems: [] });
    }

    const ids = Array.isArray(productIds) ? productIds : productIds.split(',');

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.json({ wishlistedItems: [] });
    }

    const wishlistedItems = wishlist.items
      .filter((item) => ids.includes(item.product.toString()))
      .map((item) => item.product.toString());

    return res.json({ wishlistedItems });
  } catch (error) {
    return res.status(500).json({ message: '찜하기 상태를 확인하지 못했습니다.', error: error.message });
  }
};

