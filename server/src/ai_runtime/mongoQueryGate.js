/**
 * MongoDB Query Gate
 * Validates and sanitizes MongoDB queries (replaces SQL gate for MongoDB)
 */

const ALLOWED_COLLECTIONS = [
  'products',
  'categories',
  'orders',
  'reviews',
  'users',
  'carts',
  'wishlists',
  'coupons',
  'points',
];

/**
 * Validate MongoDB query
 * @param {Object} query - MongoQueryResponse object
 * @param {Object} userContext
 * @returns {{isValid: boolean, error?: string, sanitizedQuery?: Object}}
 */
function validateMongoQuery(query, userContext) {
  // 1. Collection validation
  if (!ALLOWED_COLLECTIONS.includes(query.collection)) {
    return {
      isValid: false,
      error: `Collection "${query.collection}" is not allowed. Allowed collections: ${ALLOWED_COLLECTIONS.join(', ')}`,
    };
  }

  // 2. Ensure query object doesn't contain dangerous operations
  const queryStr = JSON.stringify(query.query);
  const dangerousPatterns = [
    /\$where/i,
    /\$eval/i,
    /\$function/i,
    /\$mapReduce/i,
    /\$group.*\$accumulator/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(queryStr)) {
      return {
        isValid: false,
        error: 'Query contains dangerous operations that are not allowed',
      };
    }
  }

  // 3. Enforce LIMIT (max 500, default 100)
  const limit = query.options?.limit || 100;
  if (limit > 500) {
    return {
      isValid: false,
      error: 'Query limit cannot exceed 500',
    };
  }

  // 4. Apply user scope restrictions
  const sanitizedQuery = { ...query };
  
  // Consumer queries: restrict to user's own data
  if (userContext.userType === 'consumer' && userContext.userId) {
    if (['orders', 'carts', 'wishlists', 'reviews', 'points'].includes(query.collection)) {
      if (!sanitizedQuery.query.userId) {
        sanitizedQuery.query = { ...sanitizedQuery.query, userId: userContext.userId };
      } else if (sanitizedQuery.query.userId !== userContext.userId) {
        return {
          isValid: false,
          error: 'Cannot access other users\' data',
        };
      }
    }
  }

  // Seller queries: restrict to seller's own data
  if (userContext.userType === 'seller' && userContext.sellerId) {
    if (['products', 'orders'].includes(query.collection)) {
      if (!sanitizedQuery.query.sellerId) {
        sanitizedQuery.query = { ...sanitizedQuery.query, sellerId: userContext.sellerId };
      } else if (sanitizedQuery.query.sellerId !== userContext.sellerId) {
        return {
          isValid: false,
          error: 'Cannot access other sellers\' data',
        };
      }
    }
  }

  // 5. Ensure projection doesn't expose sensitive fields
  if (sanitizedQuery.projection) {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    for (const field of sensitiveFields) {
      if (sanitizedQuery.projection[field] !== 0) {
        sanitizedQuery.projection[field] = 0;
      }
    }
  }

  return {
    isValid: true,
    sanitizedQuery,
  };
}

module.exports = {
  validateMongoQuery,
  ALLOWED_COLLECTIONS,
};

