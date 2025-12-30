/**
 * Schema Synchronization Tests
 * 
 * Tests that validate schema consistency between JSON and Zod schemas
 */

const { validateAllSchemas } = require('../schemaSyncCheck');
const { ToolCallSchema, AIResponseSchema } = require('../schemas');
const { z } = require('zod');

describe('Schema Synchronization', () => {
  test('should pass schema validation at startup', () => {
    expect(() => validateAllSchemas()).not.toThrow();
  });

  test('should accept valid TOOL_CALL payload', () => {
    const validPayload = {
      tool: 'addToCart',
      payload: {
        productId: 'prod_123',
        quantity: 2,
      },
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      actorRole: 'consumer',
      timestamp: '2024-12-30T12:00:00Z',
    };

    expect(() => ToolCallSchema.parse(validPayload)).not.toThrow();
  });

  test('should reject invalid TOOL_CALL payload (quantity=0)', () => {
    const invalidPayload = {
      tool: 'addToCart',
      payload: {
        productId: 'prod_123',
        quantity: 0, // Invalid: must be >= 1
      },
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      actorRole: 'consumer',
      timestamp: '2024-12-30T12:00:00Z',
    };

    expect(() => ToolCallSchema.parse(invalidPayload)).toThrow();
  });

  test('should reject invalid TOOL_CALL payload (quantity>20)', () => {
    const invalidPayload = {
      tool: 'addToCart',
      payload: {
        productId: 'prod_123',
        quantity: 21, // Invalid: must be <= 20
      },
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      actorRole: 'consumer',
      timestamp: '2024-12-30T12:00:00Z',
    };

    expect(() => ToolCallSchema.parse(invalidPayload)).toThrow();
  });

  test('should reject response type with missing required field (requestId)', () => {
    const invalidResponse = {
      type: 'ANSWER',
      content: 'Test response',
      // Missing requestId
    };

    expect(() => AIResponseSchema.parse(invalidResponse)).toThrow();
  });

  test('should accept valid ANSWER response', () => {
    const validResponse = {
      type: 'ANSWER',
      content: 'Test response',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => AIResponseSchema.parse(validResponse)).not.toThrow();
  });

  test('should accept valid BRIEFING_WITH_PRODUCTS response', () => {
    const validResponse = {
      type: 'BRIEFING_WITH_PRODUCTS',
      briefing: {
        title: 'Recommended Products',
        summary: 'Here are some products we recommend',
        reasons: [
          { label: 'Fit', text: 'Matches your needs' },
        ],
      },
      products: [
        {
          id: 'prod_123',
          title: 'Test Product',
          price: 10000,
          currency: 'KRW',
          reason: 'Good value',
          detailUrl: '/products/prod_123',
        },
      ],
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => AIResponseSchema.parse(validResponse)).not.toThrow();
  });

  test('should accept valid NEED_MORE_INFO response with missingSlots', () => {
    const validResponse = {
      type: 'NEED_MORE_INFO',
      questions: ['What is your budget?'],
      missingSlots: ['budget'],
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => AIResponseSchema.parse(validResponse)).not.toThrow();
  });

  test('should reject NEED_MORE_INFO with too many questions (>3)', () => {
    const invalidResponse = {
      type: 'NEED_MORE_INFO',
      questions: ['Q1', 'Q2', 'Q3', 'Q4'], // Max 3
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => AIResponseSchema.parse(invalidResponse)).toThrow();
  });

  test('should accept valid TOOL_CALL response with userFacingSummary', () => {
    const validResponse = {
      type: 'TOOL_CALL',
      tool: 'addToCart',
      payload: {
        productId: 'prod_123',
        quantity: 2,
      },
      userFacingSummary: 'Added product to cart',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => AIResponseSchema.parse(validResponse)).not.toThrow();
  });

  test('should reject TOOL_CALL response without userFacingSummary', () => {
    const invalidResponse = {
      type: 'TOOL_CALL',
      tool: 'addToCart',
      payload: {
        productId: 'prod_123',
        quantity: 2,
      },
      // Missing userFacingSummary
      requestId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => AIResponseSchema.parse(invalidResponse)).toThrow();
  });

  test('should accept valid MONGO_QUERY with limit <= 100', () => {
    const validResponse = {
      type: 'MONGO_QUERY',
      collection: 'products',
      query: { name: 'test' },
      purpose: 'Search products',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      options: {
        limit: 100,
      },
    };

    expect(() => AIResponseSchema.parse(validResponse)).not.toThrow();
  });

  test('should reject MONGO_QUERY with limit > 100', () => {
    const invalidResponse = {
      type: 'MONGO_QUERY',
      collection: 'products',
      query: { name: 'test' },
      purpose: 'Search products',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      options: {
        limit: 101, // Max is 100
      },
    };

    expect(() => AIResponseSchema.parse(invalidResponse)).toThrow();
  });
});

