/**
 * MongoDB Query Gate
 * Validates and sanitizes MongoDB queries (replaces SQL gate for MongoDB)
 */

import { MongoQueryResponse } from './types';

export interface QueryValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedQuery?: MongoQueryResponse;
}

/**
 * Validates MongoDB query to ensure it's read-only and safe
 */
export function validateMongoQuery(
  query: MongoQueryResponse,
  userContext: { userId?: string; sellerId?: string; userType?: 'consumer' | 'seller' }
): QueryValidationResult {
  // 1. Collection validation
  const allowedCollections = [
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

  if (!allowedCollections.includes(query.collection)) {
    return {
      isValid: false,
      error: `Collection "${query.collection}" is not allowed. Allowed collections: ${allowedCollections.join(', ')}`,
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
        sanitizedQuery.query.userId = userContext.userId;
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
        sanitizedQuery.query.sellerId = userContext.sellerId;
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

/**
 * Converts a SQL-like query string to MongoDB query (for compatibility)
 * Note: This is a simplified converter - in practice, LLM should generate MongoDB queries directly
 */
export function sqlToMongoQuery(sql: string): MongoQueryResponse | null {
  // This is a placeholder - in real implementation, use a proper SQL parser
  // For now, we expect LLM to generate MongoDB queries directly
  
  try {
    // Simple pattern matching for SELECT statements
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
    if (!selectMatch) {
      return null;
    }

    const fields = selectMatch[1].trim();
    const collection = selectMatch[2].trim().toLowerCase();

    // Extract WHERE clause if present
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    const query: any = {};
    if (whereMatch) {
      // Simple WHERE parsing - in production, use proper SQL parser
      const conditions = whereMatch[1].trim();
      // This is very simplified - real implementation needs proper SQL parsing
    }

    // Extract LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 100;

    // Extract ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s+(ASC|DESC)?/i);
    const sort: any = {};
    if (orderMatch) {
      const field = orderMatch[1].trim();
      const direction = orderMatch[2]?.toUpperCase() === 'DESC' ? -1 : 1;
      sort[field] = direction;
    }

    return {
      type: 'MONGO_QUERY',
      collection,
      query,
      projection: fields === '*' ? undefined : fields.split(',').reduce((acc, f) => {
        acc[f.trim()] = 1;
        return acc;
      }, {} as any),
      options: {
        limit: Math.min(limit, 500),
        sort: Object.keys(sort).length > 0 ? sort : undefined,
      },
      purpose: 'Query data from database',
    };
  } catch (error) {
    return null;
  }
}

