# Action Schema Generator Prompt

This is a meta-prompt for generating/updating action_schema.json.

## Purpose

Define the complete schema for all tool/action calls in the AI Shopping Assistant.

## Schema Requirements

1. **Tool Enum**: List all allowed tools
2. **Tool-Specific Payloads**: Each tool has its own payload structure
3. **Common Metadata**: requestId, userId (optional), role
4. **Validation Rules**: Type, format, range constraints

## Current Tools

- `addToCart`: productId (string), quantity (1-100), options (object, optional)
- `toggleWishlist`: productId (string)
- `goToCheckout`: cartItems (array, optional)
- `requestCancel`: orderId (string), reason (string, optional)
- `requestRefund`: orderId (string), reason (string, required)
- `sellerProductRegister`: product data (object, flexible)

## Validation Rules

- All IDs must match pattern: `^[a-zA-Z0-9_-]+$`
- Quantities: 1-100 for addToCart
- Reasons: max 500 characters
- requestId: required for tracking
- userId: optional (extracted from auth)
- role: consumer or seller

## Update Process

1. Review agent specs for new tool requirements
2. Update action_schema.json
3. Update server/src/ai_runtime/schemas.js (Zod)
4. Add validation guard to ensure JSON and Zod match
5. Update toolGateway.js if needed

