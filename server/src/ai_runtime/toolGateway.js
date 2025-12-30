/**
 * Tool Gateway
 * Validates and processes tool calls
 */

const { z } = require('zod');

const ALLOWED_TOOLS = [
  'addToCart',
  'toggleWishlist',
  'goToCheckout',
  'requestCancel',
  'requestRefund',
  'sellerProductRegister',
];

const toolSchemas = {
  addToCart: z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(100),
    options: z.record(z.any()).optional(),
  }),
  toggleWishlist: z.object({
    productId: z.string(),
  }),
  goToCheckout: z.object({
    cartItems: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
    })).optional(),
  }),
  requestCancel: z.object({
    orderId: z.string(),
    reason: z.string().optional(),
  }),
  requestRefund: z.object({
    orderId: z.string(),
    reason: z.string(),
  }),
  sellerProductRegister: z.record(z.any()),
};

/**
 * Validate tool call
 * @param {Object} toolCall
 * @returns {{isValid: boolean, errors?: Array, warnings?: Array, sanitizedTool?: Object}}
 */
function validateToolCall(toolCall) {
  const errors = [];
  const warnings = [];

  // 1. Check tool name
  if (!ALLOWED_TOOLS.includes(toolCall.tool)) {
    errors.push(`Unknown tool: ${toolCall.tool}. Allowed tools: ${ALLOWED_TOOLS.join(', ')}`);
    return { isValid: false, errors };
  }

  // 2. Validate payload schema
  try {
    const schema = toolSchemas[toolCall.tool];
    if (schema) {
      schema.parse(toolCall.payload);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    } else {
      errors.push(`Validation error: ${error.message}`);
    }
  }

  // 3. Business logic validation
  if (toolCall.tool === 'addToCart') {
    const quantity = toolCall.payload.quantity;
    if (quantity > 10) {
      warnings.push('Large quantity detected. Consider bulk purchase options.');
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    sanitizedTool: toolCall,
  };
}

module.exports = {
  validateToolCall,
  ALLOWED_TOOLS,
};

