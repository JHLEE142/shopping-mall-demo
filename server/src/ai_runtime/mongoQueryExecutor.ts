/**
 * MongoDB Query Executor
 * Safely executes validated MongoDB queries
 */

import mongoose from 'mongoose';
import { MongoQueryResponse } from './types';
import { validateMongoQuery } from './mongoQueryGate';

export interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  count?: number;
}

/**
 * Executes a validated MongoDB query
 */
export async function executeMongoQuery(
  query: MongoQueryResponse,
  userContext: { userId?: string; sellerId?: string; userType?: 'consumer' | 'seller' }
): Promise<QueryExecutionResult> {
  // Validate query first
  const validation = validateMongoQuery(query, userContext);
  if (!validation.isValid || !validation.sanitizedQuery) {
    return {
      success: false,
      error: validation.error || 'Query validation failed',
    };
  }

  const sanitized = validation.sanitizedQuery;

  try {
    // Get the model for the collection
    const model = mongoose.connection.models[sanitized.collection] || 
                  mongoose.connection.db?.collection(sanitized.collection);

    if (!model) {
      return {
        success: false,
        error: `Collection "${sanitized.collection}" not found`,
      };
    }

    // Build query options
    const options: any = {};
    if (sanitized.options?.limit) {
      options.limit = sanitized.options.limit;
    }
    if (sanitized.options?.skip) {
      options.skip = sanitized.options.skip;
    }
    if (sanitized.options?.sort) {
      options.sort = sanitized.options.sort;
    }

    // Execute query
    let data: any[];
    
    if (mongoose.connection.models[sanitized.collection]) {
      // Mongoose model
      const Model = mongoose.connection.models[sanitized.collection];
      let queryBuilder = Model.find(sanitized.query, sanitized.projection);
      
      if (options.sort) {
        queryBuilder = queryBuilder.sort(options.sort);
      }
      if (options.skip) {
        queryBuilder = queryBuilder.skip(options.skip);
      }
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }
      
      data = await queryBuilder.lean().exec();
    } else {
      // Native MongoDB collection
      const collection = mongoose.connection.db.collection(sanitized.collection);
      const cursor = collection.find(sanitized.query, {
        projection: sanitized.projection,
        ...options,
      });
      data = await cursor.toArray();
    }

    // Get count (if needed)
    let count: number | undefined;
    if (sanitized.options?.limit) {
      // Only count if limit is applied (performance optimization)
      if (mongoose.connection.models[sanitized.collection]) {
        count = await mongoose.connection.models[sanitized.collection].countDocuments(sanitized.query);
      } else {
        count = await mongoose.connection.db.collection(sanitized.collection).countDocuments(sanitized.query);
      }
    }

    // Mask sensitive data
    data = maskSensitiveData(data, sanitized.collection);

    return {
      success: true,
      data,
      count,
    };
  } catch (error: any) {
    console.error('MongoDB query execution error:', error);
    return {
      success: false,
      error: error.message || 'Query execution failed',
    };
  }
}

/**
 * Masks sensitive data in query results
 */
function maskSensitiveData(data: any[], collection: string): any[] {
  const sensitiveFields: Record<string, string[]> = {
    users: ['password', 'token', 'secret', 'apiKey'],
    orders: ['paymentInfo', 'cardNumber'],
  };

  const fieldsToMask = sensitiveFields[collection] || [];
  if (fieldsToMask.length === 0) {
    return data;
  }

  return data.map(item => {
    const masked = { ...item };
    for (const field of fieldsToMask) {
      if (masked[field]) {
        masked[field] = '[MASKED]';
      }
    }
    return masked;
  });
}

/**
 * Logs query execution (with sensitive data masked)
 */
export function logQuery(query: MongoQueryResponse, result: QueryExecutionResult): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    collection: query.collection,
    query: maskQueryForLogging(query.query),
    resultCount: result.data?.length || 0,
    success: result.success,
    error: result.error,
  };

  console.log('[MongoDB Query]', JSON.stringify(logEntry, null, 2));
}

function maskQueryForLogging(query: any): any {
  const masked = JSON.parse(JSON.stringify(query));
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'cardNumber'];
  
  function maskObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(maskObject);
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.includes(key)) {
        result[key] = '[MASKED]';
      } else if (typeof value === 'object') {
        result[key] = maskObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return maskObject(masked);
}

