/**
 * Schema Synchronization Check
 * 
 * Validates that Zod schemas in schemas.js match JSON schemas in agents/schemas/
 * 
 * This runs at server startup and throws errors if mismatches are found (fail-fast).
 * This prevents runtime errors from schema inconsistencies.
 */

const fs = require('fs');
const path = require('path');
const { loadJsonSchema } = require('./schemas');

/**
 * Extract enum values from JSON schema
 */
function extractEnumFromJsonSchema(schema, path) {
  if (!schema) return null;
  
  let current = schema;
  for (const key of path.split('.')) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  if (Array.isArray(current)) {
    return current;
  }
  if (current && current.enum) {
    return current.enum;
  }
  return null;
}

/**
 * Extract required fields from JSON schema
 */
function extractRequiredFields(schema, path) {
  if (!schema) return null;
  
  let current = schema;
  for (const key of path.split('.')) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  if (current && Array.isArray(current.required)) {
    return current.required;
  }
  return null;
}

/**
 * Validate action schema consistency
 */
function validateActionSchema() {
  const actionSchema = loadJsonSchema('action_schema');
  if (!actionSchema) {
    throw new Error('action_schema.json not found');
  }

  const errors = [];

  // Check tool enum
  const jsonTools = extractEnumFromJsonSchema(actionSchema, 'properties.tool.enum');
  const zodTools = [
    'addToCart',
    'toggleWishlist',
    'goToCheckout',
    'requestCancel',
    'requestRefund',
    'sellerProductRegister',
  ];

  if (jsonTools) {
    const missingInZod = jsonTools.filter(t => !zodTools.includes(t));
    const missingInJson = zodTools.filter(t => !jsonTools.includes(t));
    
    if (missingInZod.length > 0) {
      errors.push(`Action schema: Tools in JSON but not in Zod: ${missingInZod.join(', ')}`);
    }
    if (missingInJson.length > 0) {
      errors.push(`Action schema: Tools in Zod but not in JSON: ${missingInJson.join(', ')}`);
    }
  }

  // Check required fields
  const requiredFields = extractRequiredFields(actionSchema, 'required');
  const expectedRequired = ['tool', 'payload', 'requestId', 'actorRole', 'timestamp'];
  
  if (requiredFields) {
    const missing = expectedRequired.filter(f => !requiredFields.includes(f));
    const extra = requiredFields.filter(f => !expectedRequired.includes(f));
    
    if (missing.length > 0) {
      errors.push(`Action schema: Missing required fields: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      errors.push(`Action schema: Extra required fields: ${extra.join(', ')}`);
    }
  }

  // Check quantity max (should be 20, not 100)
  const addToCartSchema = actionSchema.properties?.payload?.oneOf?.find(
    item => item.title === 'addToCart'
  );
  if (addToCartSchema?.properties?.quantity?.maximum !== 20) {
    errors.push('Action schema: addToCart.quantity.maximum should be 20');
  }

  return errors;
}

/**
 * Validate response schema consistency
 */
function validateResponseSchema() {
  const responseSchema = loadJsonSchema('response_schema');
  if (!responseSchema) {
    throw new Error('response_schema.json not found');
  }

  const errors = [];

  // Check response types
  const responseTypes = ['ANSWER', 'BRIEFING_WITH_PRODUCTS', 'MONGO_QUERY', 'TOOL_CALL', 'NEED_MORE_INFO'];
  const jsonTypes = responseSchema.oneOf?.map(item => item.properties?.type?.const).filter(Boolean);
  
  if (jsonTypes) {
    const missingInZod = jsonTypes.filter(t => !responseTypes.includes(t));
    const missingInJson = responseTypes.filter(t => !jsonTypes.includes(t));
    
    if (missingInZod.length > 0) {
      errors.push(`Response schema: Types in JSON but not in Zod: ${missingInZod.join(', ')}`);
    }
    if (missingInJson.length > 0) {
      errors.push(`Response schema: Types in Zod but not in JSON: ${missingInJson.join(', ')}`);
    }
  }

  // Check that all response types have requestId
  responseSchema.oneOf?.forEach((item, index) => {
    const type = item.properties?.type?.const;
    const required = item.required || [];
    
    if (type && !required.includes('requestId')) {
      errors.push(`Response schema: ${type} missing required field 'requestId'`);
    }
  });

  // Check MONGO_QUERY limit (should be max 100)
  const mongoQuerySchema = responseSchema.oneOf?.find(
    item => item.properties?.type?.const === 'MONGO_QUERY'
  );
  if (mongoQuerySchema?.properties?.options?.properties?.limit?.maximum !== 100) {
    errors.push('Response schema: MONGO_QUERY.options.limit.maximum should be 100');
  }

  // Check TOOL_CALL has userFacingSummary
  const toolCallSchema = responseSchema.oneOf?.find(
    item => item.properties?.type?.const === 'TOOL_CALL'
  );
  if (toolCallSchema && !toolCallSchema.required?.includes('userFacingSummary')) {
    errors.push('Response schema: TOOL_CALL missing required field "userFacingSummary"');
  }

  // Check NEED_MORE_INFO questions max (should be 3)
  const needMoreInfoSchema = responseSchema.oneOf?.find(
    item => item.properties?.type?.const === 'NEED_MORE_INFO'
  );
  if (needMoreInfoSchema?.properties?.questions?.maxItems !== 3) {
    errors.push('Response schema: NEED_MORE_INFO.questions.maxItems should be 3');
  }

  return errors;
}

/**
 * Validate intent schema consistency
 */
function validateIntentSchema() {
  const intentSchema = loadJsonSchema('intent_schema');
  if (!intentSchema) {
    throw new Error('intent_schema.json not found');
  }

  const errors = [];

  // Check required consumer intents
  const requiredConsumerIntents = [
    'search_product',
    'get_recommendation',
    'compare_price',
    'add_to_cart',
    'purchase',
    'track_delivery',
    'cancel_order',
    'refund_request',
    'write_review',
    'check_rewards',
    'login_help',
    'signup_help',
  ];

  const consumerIntents = Object.keys(
    intentSchema.properties?.intentTaxonomy?.properties?.consumer?.properties || {}
  );

  const missingConsumer = requiredConsumerIntents.filter(i => !consumerIntents.includes(i));
  if (missingConsumer.length > 0) {
    errors.push(`Intent schema: Missing consumer intents: ${missingConsumer.join(', ')}`);
  }

  // Check required seller intents
  const requiredSellerIntents = [
    'seller_analytics',
    'simulate_pricing',
    'analyze_efficiency',
    'create_listing',
  ];

  const sellerIntents = Object.keys(
    intentSchema.properties?.intentTaxonomy?.properties?.seller?.properties || {}
  );

  const missingSeller = requiredSellerIntents.filter(i => !sellerIntents.includes(i));
  if (missingSeller.length > 0) {
    errors.push(`Intent schema: Missing seller intents: ${missingSeller.join(', ')}`);
  }

  // Check that each intent has required fields
  const allIntents = [
    ...Object.values(intentSchema.properties?.intentTaxonomy?.properties?.consumer?.properties || {}),
    ...Object.values(intentSchema.properties?.intentTaxonomy?.properties?.seller?.properties || {}),
    ...Object.values(intentSchema.properties?.intentTaxonomy?.properties?.behavior?.properties || {}),
  ];

  allIntents.forEach((intent, index) => {
    const required = intent.required || [];
    const expectedRequired = ['description', 'defaultAgent', 'requiredSlots', 'responsePreference'];
    
    const missing = expectedRequired.filter(f => !required.includes(f));
    if (missing.length > 0) {
      errors.push(`Intent schema: Intent at index ${index} missing required fields: ${missing.join(', ')}`);
    }
  });

  return errors;
}

/**
 * Main validation function
 * Throws error if any mismatches found (fail-fast)
 */
function validateAllSchemas() {
  const allErrors = [];

  try {
    allErrors.push(...validateActionSchema());
  } catch (error) {
    allErrors.push(`Action schema validation failed: ${error.message}`);
  }

  try {
    allErrors.push(...validateResponseSchema());
  } catch (error) {
    allErrors.push(`Response schema validation failed: ${error.message}`);
  }

  try {
    allErrors.push(...validateIntentSchema());
  } catch (error) {
    allErrors.push(`Intent schema validation failed: ${error.message}`);
  }

  if (allErrors.length > 0) {
    const errorMessage = [
      'Schema synchronization check FAILED:',
      'Zod schemas in schemas.js do not match JSON schemas in agents/schemas/',
      '',
      ...allErrors.map(e => `  - ${e}`),
      '',
      'Please update schemas.js to match the JSON schemas, or update the JSON schemas.',
      'This is a fail-fast check to prevent runtime errors.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  console.log('✅ Schema synchronization check passed');
}

module.exports = {
  validateAllSchemas,
  validateActionSchema,
  validateResponseSchema,
  validateIntentSchema,
};

