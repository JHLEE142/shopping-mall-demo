/**
 * AI Runtime Schemas
 * Zod schemas for validation
 */

import { z } from 'zod';

// Standard Response Schemas
export const AnswerResponseSchema = z.object({
  type: z.literal('ANSWER'),
  content: z.string(),
});

export const BriefingReasonSchema = z.object({
  label: z.enum(['Trend', 'Fit', 'Popularity', 'Value', 'Quality', 'Price', 'Shipping']),
  text: z.string(),
});

export const ProductCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  currency: z.literal('KRW'),
  imageUrl: z.string().optional(),
  badges: z.array(z.string()).optional(),
  reason: z.string(),
  detailUrl: z.string(),
});

export const BriefingWithProductsResponseSchema = z.object({
  type: z.literal('BRIEFING_WITH_PRODUCTS'),
  briefing: z.object({
    title: z.string(),
    summary: z.string(),
    reasons: z.array(BriefingReasonSchema),
    followUps: z.array(z.string()).optional(),
  }),
  products: z.array(ProductCardSchema),
});

export const MongoQueryResponseSchema = z.object({
  type: z.literal('MONGO_QUERY'),
  collection: z.string(),
  query: z.any(), // MongoDB query object
  projection: z.any().optional(),
  options: z.object({
    limit: z.number().max(500).default(100).optional(),
    sort: z.any().optional(),
    skip: z.number().optional(),
  }).optional(),
  purpose: z.string(),
});

export const ToolCallResponseSchema = z.object({
  type: z.literal('TOOL_CALL'),
  tool: z.string(),
  payload: z.record(z.any()),
});

export const NeedMoreInfoResponseSchema = z.object({
  type: z.literal('NEED_MORE_INFO'),
  questions: z.array(z.string()),
});

export const AIResponseSchema = z.discriminatedUnion('type', [
  AnswerResponseSchema,
  BriefingWithProductsResponseSchema,
  MongoQueryResponseSchema,
  ToolCallResponseSchema,
  NeedMoreInfoResponseSchema,
]);

// Request Schema
export const AIRequestSchema = z.object({
  message: z.string(),
  userContext: z.object({
    userId: z.string().optional(),
    sellerId: z.string().optional(),
    isLoggedIn: z.boolean().default(false),
    userType: z.enum(['consumer', 'seller']).optional(),
  }),
  uiMode: z.enum(['briefing', 'chat']).optional(),
  conversationHistory: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })),
  }).optional(),
});

// Tool Call Schemas
export const AddToCartToolSchema = z.object({
  tool: z.literal('addToCart'),
  payload: z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(100),
    options: z.record(z.any()).optional(),
  }),
});

export const ToggleWishlistToolSchema = z.object({
  tool: z.literal('toggleWishlist'),
  payload: z.object({
    productId: z.string(),
  }),
});

export const GoToCheckoutToolSchema = z.object({
  tool: z.literal('goToCheckout'),
  payload: z.object({
    cartItems: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
    })).optional(),
  }),
});

export const RequestCancelToolSchema = z.object({
  tool: z.literal('requestCancel'),
  payload: z.object({
    orderId: z.string(),
    reason: z.string().optional(),
  }),
});

export const RequestRefundToolSchema = z.object({
  tool: z.literal('requestRefund'),
  payload: z.object({
    orderId: z.string(),
    reason: z.string(),
  }),
});

export const SellerProductRegisterToolSchema = z.object({
  tool: z.literal('sellerProductRegister'),
  payload: z.record(z.any()),
});

export const ToolCallSchema = z.discriminatedUnion('tool', [
  AddToCartToolSchema,
  ToggleWishlistToolSchema,
  GoToCheckoutToolSchema,
  RequestCancelToolSchema,
  RequestRefundToolSchema,
  SellerProductRegisterToolSchema,
]);

