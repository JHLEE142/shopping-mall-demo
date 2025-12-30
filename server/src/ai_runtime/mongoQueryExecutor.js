/**
 * MongoDB Query Executor
 * Safely executes validated MongoDB queries
 */

const mongoose = require('mongoose');
const { validateMongoQuery } = require('./mongoQueryGate');

/**
 * Execute validated MongoDB query
 * @param {Object} query - MongoQueryResponse object
 * @param {Object} userContext
 * @returns {Promise<{success: boolean, data?: Array, error?: string, count?: number}>}
 */
async function executeMongoQuery(query, userContext) {
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
    const options = {};
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
    let data = [];
    
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
    let count;
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
  } catch (error) {
    console.error('MongoDB query execution error:', error);
    return {
      success: false,
      error: error.message || 'Query execution failed',
    };
  }
}

/**
 * Mask sensitive data in query results
 * @param {Array} data
 * @param {string} collection
 * @returns {Array}
 */
function maskSensitiveData(data, collection) {
  const sensitiveFields = {
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
 * Log query execution (with sensitive data masked)
 * @param {Object} query
 * @param {Object} result
 */
function logQuery(query, result) {
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

function maskQueryForLogging(query) {
  const masked = JSON.parse(JSON.stringify(query));
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'cardNumber'];
  
  function maskObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(maskObject);
    }
    
    const result = {};
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

module.exports = {
  executeMongoQuery,
  logQuery,
};

