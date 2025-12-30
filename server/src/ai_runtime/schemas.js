/**
 * AI Runtime Schemas
 * Zod schemas for validation
 * 
 * IMPORTANT: These schemas must match agents/schemas/*.json exactly
 * schemaSyncCheck.js validates consistency at server startup (fail-fast)
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');

/**
 * Load JSON schema from agents/schemas/
 */
function loadJsonSchema(schemaName) {
  try {
    const repoRoot = process.cwd();
    const schemaPath = path.join(repoRoot, 'agents', 'schemas', `${schemaName}.json`);
    if (fs.existsSync(schemaPath)) {
      return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    }
  } catch (error) {
    console.warn(`Failed to load JSON schema: ${schemaName}`, error);
  }
  return null;
}

// UUID pattern for requestId
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Standard Response Schemas
// Note: These must match agents/schemas/response_schema.json exactly

const AnswerResponseSchema = z.object({
  type: z.literal('ANSWER'),
  content: z.string().min(1).max(5000),
  requestId: z.string().regex(UUID_PATTERN),
});

const BriefingReasonSchema = z.object({
  label: z.enum(['Trend', 'Fit', 'Popularity', 'Value', 'Quality', 'Price', 'Shipping']),
  text: z.string().min(1).max(200),
});

const ProductCardSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().min(1).max(200),
  price: z.number().min(0),
  currency: z.literal('KRW'),
  imageUrl: z.string().url().optional(),
  reason: z.string().min(1).max(200),
  detailUrl: z.string().regex(/^\/products\/[a-zA-Z0-9_-]+$/),
});

const BriefingWithProductsResponseSchema = z.object({
  type: z.literal('BRIEFING_WITH_PRODUCTS'),
  briefing: z.object({
    title: z.string().min(1).max(200),
    summary: z.string().min(1).max(1000),
    reasons: z.array(BriefingReasonSchema).min(1),
    followUps: z.array(z.string().min(1).max(200)).optional(),
  }),
  products: z.array(ProductCardSchema).min(1).max(20),
  requestId: z.string().regex(UUID_PATTERN),
});

const MongoQueryResponseSchema = z.object({
  type: z.literal('MONGO_QUERY'),
  collection: z.enum([
    'products',
    'categories',
    'orders',
    'reviews',
    'users',
    'carts',
    'wishlists',
    'coupons',
    'points',
  ]),
  query: z.any(), // MongoDB query object (read-only validated by mongoQueryGate)
  projection: z.any().optional(),
  options: z.object({
    limit: z.number().int().min(1).max(100).default(20).optional(),
    sort: z.any().optional(),
    skip: z.number().int().min(0).optional(),
  }).optional(),
  purpose: z.string().min(1).max(200),
  requestId: z.string().regex(UUID_PATTERN),
});

const ToolCallResponseSchema = z.object({
  type: z.literal('TOOL_CALL'),
  tool: z.enum([
    'addToCart',
    'toggleWishlist',
    'goToCheckout',
    'requestCancel',
    'requestRefund',
    'sellerProductRegister',
  ]),
  payload: z.record(z.any()),
  userFacingSummary: z.string().min(1).max(200),
  requestId: z.string().regex(UUID_PATTERN),
});

const NeedMoreInfoResponseSchema = z.object({
  type: z.literal('NEED_MORE_INFO'),
  questions: z.array(z.string().min(1).max(300)).min(1).max(3),
  missingSlots: z.array(z.string()).optional(),
  requestId: z.string().regex(UUID_PATTERN),
});

const AIResponseSchema = z.discriminatedUnion('type', [
  AnswerResponseSchema,
  BriefingWithProductsResponseSchema,
  MongoQueryResponseSchema,
  ToolCallResponseSchema,
  NeedMoreInfoResponseSchema,
]);

// Request Schema
const AIRequestSchema = z.object({
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
// Note: These must match agents/schemas/action_schema.json exactly

const AddToCartToolSchema = z.object({
  tool: z.literal('addToCart'),
  payload: z.object({
    productId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    quantity: z.number().int().min(1).max(20), // Updated: max 20 (was 100)
    options: z.record(z.any()).optional(),
  }),
  requestId: z.string().regex(UUID_PATTERN),
  actorRole: z.enum(['consumer', 'seller']),
  timestamp: z.string().datetime(),
});

const ToggleWishlistToolSchema = z.object({
  tool: z.literal('toggleWishlist'),
  payload: z.object({
    productId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  }),
  requestId: z.string().regex(UUID_PATTERN),
  actorRole: z.enum(['consumer', 'seller']),
  timestamp: z.string().datetime(),
});

const GoToCheckoutToolSchema = z.object({
  tool: z.literal('goToCheckout'),
  payload: z.union([
    z.object({
      cartId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    }),
    z.object({
      items: z.array(z.object({
        productId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
        quantity: z.number().int().min(1).max(20),
      })),
    }),
  ]),
  requestId: z.string().regex(UUID_PATTERN),
  actorRole: z.enum(['consumer', 'seller']),
  timestamp: z.string().datetime(),
});

const RequestCancelToolSchema = z.object({
  tool: z.literal('requestCancel'),
  payload: z.object({
    orderId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    reason: z.string().max(500).optional(),
  }),
  requestId: z.string().regex(UUID_PATTERN),
  actorRole: z.enum(['consumer', 'seller']),
  timestamp: z.string().datetime(),
});

const RequestRefundToolSchema = z.object({
  tool: z.literal('requestRefund'),
  payload: z.object({
    orderId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    reason: z.string().min(1).max(500),
    evidenceUrls: z.array(z.string().url()).max(5).optional(),
  }),
  requestId: z.string().regex(UUID_PATTERN),
  actorRole: z.enum(['consumer', 'seller']),
  timestamp: z.string().datetime(),
});

const SellerProductRegisterToolSchema = z.object({
  tool: z.literal('sellerProductRegister'),
  payload: z.object({
    sellerId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    product: z.object({
      name: z.string().min(1).max(200),
      price: z.number().min(0),
      category: z.string(),
      description: z.string().optional(),
      stock: z.number().int().min(0).optional(),
    }).passthrough(), // Allow additional fields
  }),
  requestId: z.string().regex(UUID_PATTERN),
  actorRole: z.enum(['consumer', 'seller']),
  timestamp: z.string().datetime(),
});

const ToolCallSchema = z.discriminatedUnion('tool', [
  AddToCartToolSchema,
  ToggleWishlistToolSchema,
  GoToCheckoutToolSchema,
  RequestCancelToolSchema,
  RequestRefundToolSchema,
  SellerProductRegisterToolSchema,
]);

module.exports = {
  AIRequestSchema,
  AIResponseSchema,
  AnswerResponseSchema,
  BriefingWithProductsResponseSchema,
  MongoQueryResponseSchema,
  ToolCallResponseSchema,
  NeedMoreInfoResponseSchema,
  ToolCallSchema,
  loadJsonSchema,
  UUID_PATTERN,
};
