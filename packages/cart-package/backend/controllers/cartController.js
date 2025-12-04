const Cart = require('../models/cart');
const Product = require('../models/product');

async function getActiveCart(userId) {
  return Cart.findOne({ user: userId, status: 'active' }).populate('items.product', 'name price image sku');
}

exports.getCart = async (req, res) => {
  try {
    const cart = await getActiveCart(req.user.id);

    if (!cart) {
      return res.status(200).json({ cart: null, message: '장바구니가 비어 있습니다.' });
    }

    return res.json({ cart });
  } catch (error) {
    return res.status(500).json({ message: '장바구니를 불러오지 못했습니다.', error: error.message });
  }
};

exports.addCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedOptions = {} } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId는 필수 값입니다.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    let cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceSnapshot = product.price;
      existingItem.selectedOptions = selectedOptions;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceSnapshot: product.price,
        selectedOptions,
      });
    }

    cart.summary.subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0
    );

    await cart.save();

    const populatedCart = await cart.populate('items.product', 'name price image sku');

    return res.status(201).json({ cart: populatedCart });
  } catch (error) {
    return res.status(500).json({ message: '장바구니에 상품을 추가하지 못했습니다.', error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, selectedOptions } = req.body;

    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }

    const item = cart.items.find((it) => it.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: '장바구니에 해당 상품이 없습니다.' });
    }

    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({ message: '수량은 1 이상이어야 합니다.' });
      }
      item.quantity = quantity;
    }

    if (selectedOptions) {
      item.selectedOptions = selectedOptions;
    }

    cart.summary.subtotal = cart.items.reduce(
      (sum, cartItem) => sum + cartItem.quantity * cartItem.priceSnapshot,
      0
    );

    await cart.save();

    const populatedCart = await cart.populate('items.product', 'name price image sku');

    return res.json({ cart: populatedCart });
  } catch (error) {
    return res.status(500).json({ message: '장바구니 상품을 수정하지 못했습니다.', error: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    if (!cart.items.length) {
      await Cart.deleteOne({ _id: cart._id });
      return res.json({ cart: null });
    }

    cart.summary.subtotal = cart.items.reduce(
      (sum, cartItem) => sum + cartItem.quantity * cartItem.priceSnapshot,
      0
    );

    await cart.save();

    const populatedCart = await cart.populate('items.product', 'name price image sku');

    return res.json({ cart: populatedCart });
  } catch (error) {
    return res.status(500).json({ message: '장바구니 상품을 삭제하지 못했습니다.', error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id, status: 'active' });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: '장바구니를 비우지 못했습니다.', error: error.message });
  }
};

