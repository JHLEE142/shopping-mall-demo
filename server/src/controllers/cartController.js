const Cart = require('../models/cart');
const Product = require('../models/product');

// 회원/비회원 장바구니 조회 헬퍼 함수
async function getOrCreateCart(req) {
  let cart;
  
  if (req.user) {
    // 회원 장바구니
    cart = await Cart.findOne({ 
      user: req.user._id, 
      status: 'active' 
    });
  } else {
    // 비회원 장바구니
    const guestSessionId = req.headers['x-guest-session-id'] || 
                          req.body.guestSessionId || 
                          req.query.guestSessionId;
    
    if (!guestSessionId) {
      return null; // guestSessionId가 없으면 null 반환
    }
    
    // deviceId와 IP 주소로도 조회 시도 (같은 기기/IP 식별)
    const deviceId = req.headers['x-device-id'] || req.body.deviceId;
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     '';
    
    // IP 주소 정규화 (첫 번째 IP만 사용, 프록시 환경 대응)
    const normalizedIp = ipAddress.split(',')[0].trim();
    
    // 우선순위: guestSessionId > deviceId + IP
    const query = {
      isGuest: true,
      status: 'active',
      $or: [
        { guestSessionId: guestSessionId },
        ...(deviceId && normalizedIp ? [{
          'guestInfo.deviceId': deviceId,
          'guestInfo.ipAddress': normalizedIp
        }] : [])
      ]
    };
    
    cart = await Cart.findOne(query);
    
    if (cart) {
      // 마지막 접속 시간 업데이트
      cart.guestInfo.lastAccessedAt = new Date();
      if (deviceId && !cart.guestInfo.deviceId) {
        cart.guestInfo.deviceId = deviceId;
      }
      if (normalizedIp && !cart.guestInfo.ipAddress) {
        cart.guestInfo.ipAddress = normalizedIp;
      }
      await cart.save();
    }
  }
  
  return cart;
}

// 회원 장바구니 조회 (기존 함수 유지)
async function getActiveCart(userId) {
  return Cart.findOne({ user: userId, status: 'active' }).populate('items.product', 'name price image sku');
}

exports.getCart = async (req, res) => {
  try {
    let cart;
    
    if (req.user) {
      // 회원 장바구니
      cart = await getActiveCart(req.user._id);
    } else {
      // 비회원 장바구니
      cart = await getOrCreateCart(req);
      if (cart) {
        cart = await cart.populate('items.product', 'name price image sku');
      }
    }

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

    let cart = await getOrCreateCart(req);

    if (!cart) {
      // 새 장바구니 생성
      if (req.user) {
        // 회원 장바구니
        cart = new Cart({
          user: req.user._id,
          items: [],
          status: 'active',
        });
      } else {
        // 비회원 장바구니
        const guestSessionId = req.headers['x-guest-session-id'] || req.body.guestSessionId;
        const deviceId = req.headers['x-device-id'] || req.body.deviceId;
        const ipAddress = req.ip || 
                         req.headers['x-forwarded-for'] || 
                         req.connection.remoteAddress ||
                         req.socket.remoteAddress ||
                         '';
        const userAgent = req.headers['user-agent'] || '';
        
        const normalizedIp = ipAddress.split(',')[0].trim();
        
        if (!guestSessionId) {
          return res.status(400).json({ 
            message: '비회원 장바구니를 사용하려면 guestSessionId가 필요합니다.' 
          });
        }
        
        cart = new Cart({
          user: null,
          isGuest: true,
          guestSessionId: guestSessionId,
          guestInfo: {
            deviceId: deviceId || '',
            ipAddress: normalizedIp,
            userAgent: userAgent,
            sessionCreatedAt: new Date(),
            lastAccessedAt: new Date(),
          },
          items: [],
          status: 'active',
        });
      }
    }

    // 같은 상품과 옵션을 가진 아이템 찾기
    const existingItem = cart.items.find((item) => {
      const productMatch = item.product.toString() === productId;
      const optionsMatch = JSON.stringify(item.selectedOptions || {}) === JSON.stringify(selectedOptions || {});
      return productMatch && optionsMatch;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceSnapshot = product.priceSale || product.price;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceSnapshot: product.priceSale || product.price,
        selectedOptions,
      });
    }

    cart.summary.subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0
    );

    // 비회원 장바구니인 경우 마지막 접속 시간 업데이트
    if (cart.isGuest) {
      cart.guestInfo.lastAccessedAt = new Date();
    }

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

    const cart = await getOrCreateCart(req);

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

    if (selectedOptions !== undefined) {
      item.selectedOptions = selectedOptions;
    }

    cart.summary.subtotal = cart.items.reduce(
      (sum, cartItem) => sum + cartItem.quantity * cartItem.priceSnapshot,
      0
    );

    // 비회원 장바구니인 경우 마지막 접속 시간 업데이트
    if (cart.isGuest) {
      cart.guestInfo.lastAccessedAt = new Date();
    }

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
    const cart = await getOrCreateCart(req);

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

    // 비회원 장바구니인 경우 마지막 접속 시간 업데이트
    if (cart.isGuest) {
      cart.guestInfo.lastAccessedAt = new Date();
    }

    await cart.save();

    const populatedCart = await cart.populate('items.product', 'name price image sku');

    return res.json({ cart: populatedCart });
  } catch (error) {
    return res.status(500).json({ message: '장바구니 상품을 삭제하지 못했습니다.', error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req);
    
    if (cart) {
      await Cart.deleteOne({ _id: cart._id });
    }
    
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: '장바구니를 비우지 못했습니다.', error: error.message });
  }
};

// 비회원 장바구니를 회원 장바구니로 병합하는 함수
exports.mergeGuestCartToUser = async (userId, guestSessionId, deviceId, ipAddress) => {
  try {
    const normalizedIp = ipAddress ? ipAddress.split(',')[0].trim() : '';
    
    // 비회원 장바구니 찾기
    const guestCart = await Cart.findOne({
      isGuest: true,
      status: 'active',
      $or: [
        { guestSessionId: guestSessionId },
        ...(deviceId && normalizedIp ? [{
          'guestInfo.deviceId': deviceId,
          'guestInfo.ipAddress': normalizedIp
        }] : [])
      ]
    });
    
    if (!guestCart || guestCart.items.length === 0) {
      return null;
    }
    
    // 회원 장바구니 찾기 또는 생성
    let userCart = await Cart.findOne({ 
      user: userId, 
      status: 'active' 
    });
    
    if (!userCart) {
      userCart = new Cart({
        user: userId,
        items: [],
        status: 'active',
      });
    }
    
    // 비회원 장바구니의 상품들을 회원 장바구니에 병합
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        item => item.product.toString() === guestItem.product.toString() &&
                JSON.stringify(item.selectedOptions || {}) === JSON.stringify(guestItem.selectedOptions || {})
      );
      
      if (existingItem) {
        // 같은 상품이 있으면 수량 합산
        existingItem.quantity += guestItem.quantity;
        existingItem.priceSnapshot = guestItem.priceSnapshot; // 최신 가격으로 업데이트
      } else {
        // 없으면 추가
        userCart.items.push(guestItem);
      }
    }
    
    // summary 재계산
    userCart.summary.subtotal = userCart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0
    );
    
    await userCart.save();
    
    // 비회원 장바구니 삭제 또는 상태 변경
    guestCart.status = 'abandoned';
    await guestCart.save();
    
    return await userCart.populate('items.product', 'name price image sku');
  } catch (error) {
    console.error('장바구니 병합 실패:', error);
    throw error;
  }
};
