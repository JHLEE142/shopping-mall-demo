import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/response.js';

// 장바구니 조회
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // 상품 정보 populate
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId)
          .populate('categoryId', 'name')
          .select('name slug basePrice salePrice images');
        return {
          ...item.toObject(),
          product
        };
      })
    );

    successResponse(res, {
      cart: {
        ...cart.toObject(),
        items: itemsWithProducts
      }
    }, '장바구니 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 장바구니에 상품 추가
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, selectedOptions } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return errorResponse(res, '상품을 찾을 수 없거나 판매 중이 아닙니다.', 404);
    }

    // 재고 확인
    if (product.stockManagement === 'track' && product.totalStock < quantity) {
      return errorResponse(res, '재고가 부족합니다.', 400);
    }

    const price = product.salePrice || product.basePrice;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // 이미 같은 상품/옵션이 있는지 확인
    const existingItemIndex = cart.items.findIndex(item => {
      if (item.productId.toString() !== productId) return false;
      const itemOptions = item.selectedOptions || new Map();
      const newOptions = selectedOptions || {};
      
      // 옵션 비교
      const itemOptionsObj = Object.fromEntries(itemOptions);
      return JSON.stringify(itemOptionsObj) === JSON.stringify(newOptions);
    });

    if (existingItemIndex >= 0) {
      // 기존 항목 수량 증가
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // 새 항목 추가
      cart.items.push({
        productId,
        quantity,
        selectedOptions: selectedOptions || {},
        price,
        addedAt: new Date()
      });
    }

    await cart.save();

    successResponse(res, { cart }, '장바구니에 추가되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 장바구니 항목 수정
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, selectedOptions } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return errorResponse(res, '장바구니를 찾을 수 없습니다.', 404);
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return errorResponse(res, '장바구니 항목을 찾을 수 없습니다.', 404);
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        cart.items.pull(itemId);
      } else {
        item.quantity = quantity;
      }
    }

    if (selectedOptions) {
      item.selectedOptions = selectedOptions;
    }

    await cart.save();

    successResponse(res, { cart }, '장바구니 항목이 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 장바구니 항목 삭제
export const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return errorResponse(res, '장바구니를 찾을 수 없습니다.', 404);
    }

    cart.items.pull(itemId);
    await cart.save();

    successResponse(res, { cart }, '장바구니 항목이 삭제되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 장바구니 비우기
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    successResponse(res, { cart: cart || { items: [] } }, '장바구니가 비워졌습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

