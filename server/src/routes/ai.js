/**
 * AI Shopping Assistant API Route
 * Main endpoint for AI shopping assistant interactions
 */

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { orchestrate } = require('../ai_runtime/orchestrator');
const { AIRequestSchema } = require('../ai_runtime/schemas');
const { z } = require('zod');
// Models will be loaded dynamically to avoid circular dependencies
const getModel = (modelName) => {
  try {
    return require(`../models/${modelName}`);
  } catch (e) {
    console.error(`Failed to load model: ${modelName}`, e);
    return null;
  }
};

const router = Router();

/**
 * POST /api/ai
 * Main AI shopping assistant endpoint
 */
router.post('/', authenticate, async (req, res) => {
  try {
    // Validate request
    const requestData = AIRequestSchema.parse({
      message: req.body.message,
      userContext: {
        userId: req.user?.id,
        sellerId: req.user?.sellerId,
        isLoggedIn: !!req.user,
        userType: req.user?.role === 'seller' ? 'seller' : 'consumer',
      },
      uiMode: req.body.uiMode || 'chat',
      conversationHistory: req.body.conversationHistory || { messages: [] },
    });

    // Orchestrate response
    const result = await orchestrate(requestData.message, {
      userContext: requestData.userContext,
      conversationHistory: requestData.conversationHistory,
    });

    // Return response
    res.json({
      success: true,
      response: result.response,
      metadata: {
        selectedAgents: result.selectedAgents,
        confidence: result.confidence,
        requiresConfirmation: result.requiresConfirmation,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }

    console.error('AI API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai/tools/:toolName
 * Execute tool calls
 */
router.post('/tools/:toolName', authenticate, async (req, res) => {
  try {
    const { toolName } = req.params;
    const payload = req.body;

    // Route to appropriate tool handler
    switch (toolName) {
      case 'addToCart': {
        const { productId, quantity, options } = payload;
        const userId = req.user.id;
        
        const Cart = getModel('cart');
        const Product = getModel('product');
        if (!Cart || !Product) {
          return res.status(500).json({ success: false, error: 'Models not available' });
        }
        
        // Get product to get price
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        // Find or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
          cart = new Cart({ user: userId, items: [] });
        }
        
        // Add or update item
        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.items.push({
            product: productId,
            quantity,
            priceSnapshot: product.price,
            selectedOptions: options || {},
          });
        }
        
        await cart.save();
        return res.json({ success: true, message: 'Item added to cart', cart });
      }

      case 'toggleWishlist': {
        const { productId } = payload;
        const userId = req.user.id;
        
        const Wishlist = getModel('wishlist');
        if (!Wishlist) {
          return res.status(500).json({ success: false, error: 'Wishlist model not available' });
        }
        
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
          wishlist = new Wishlist({ user: userId, items: [] });
        }
        
        const index = wishlist.items.findIndex(item => item.product.toString() === productId);
        if (index >= 0) {
          wishlist.items.splice(index, 1);
        } else {
          wishlist.items.push({ product: productId });
        }
        
        await wishlist.save();
        return res.json({ 
          success: true, 
          message: index >= 0 ? 'Removed from wishlist' : 'Added to wishlist',
          wishlist 
        });
      }

      case 'goToCheckout': {
        const userId = req.user.id;
        const Cart = getModel('cart');
        if (!Cart) {
          return res.status(500).json({ success: false, error: 'Cart model not available' });
        }
        
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Cart is empty',
          });
        }
        
        return res.json({ 
          success: true, 
          redirectUrl: '/order',
          cartItems: cart.items 
        });
      }

      case 'requestCancel': {
        const { orderId, reason } = payload;
        const userId = req.user.id;
        
        const Order = getModel('order');
        if (!Order) {
          return res.status(500).json({ success: false, error: 'Order model not available' });
        }
        
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
          return res.status(404).json({
            success: false,
            error: 'Order not found',
          });
        }
        
        // Check if cancellation is allowed
        if (order.status === 'shipped' || order.status === 'delivered') {
          return res.status(400).json({
            success: false,
            error: 'Order cannot be cancelled at this stage',
          });
        }
        
        order.status = 'cancelled';
        if (reason) {
          order.cancellationReason = reason;
        }
        await order.save();
        
        return res.json({ success: true, message: 'Order cancelled', order });
      }

      case 'requestRefund': {
        const { orderId, reason } = payload;
        const userId = req.user.id;
        
        const Order = getModel('order');
        if (!Order) {
          return res.status(500).json({ success: false, error: 'Order model not available' });
        }
        
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
          return res.status(404).json({
            success: false,
            error: 'Order not found',
          });
        }
        
        if (order.status !== 'delivered') {
          return res.status(400).json({
            success: false,
            error: 'Refund can only be requested for delivered orders',
          });
        }
        
        // Create refund request (simplified - in production, use ExchangeReturn model)
        if (reason) {
          order.refundReason = reason;
        }
        order.status = 'refund_requested';
        await order.save();
        
        return res.json({ success: true, message: 'Refund request submitted', order });
      }

      case 'sellerProductRegister': {
        if (req.user.role !== 'seller') {
          return res.status(403).json({
            success: false,
            error: 'Only sellers can register products',
          });
        }
        
        const Product = getModel('product');
        if (!Product) {
          return res.status(500).json({ success: false, error: 'Product model not available' });
        }
        
        const productData = {
          ...payload,
          sellerId: req.user.sellerId || req.user.id,
        };
        
        const product = new Product(productData);
        await product.save();
        
        return res.json({ success: true, message: 'Product registered', product });
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown tool: ${toolName}`,
        });
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Tool execution failed',
      message: error.message,
    });
  }
});

module.exports = router;

