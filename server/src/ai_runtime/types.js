/**
 * AI Runtime Types
 * Common type definitions for the AI shopping assistant runtime
 */

// Note: In JavaScript, we use JSDoc for type documentation
// Actual types are enforced at runtime via Zod schemas

/**
 * @typedef {Object} UserContext
 * @property {string} [userId]
 * @property {string} [sellerId]
 * @property {boolean} isLoggedIn
 * @property {'consumer'|'seller'} [userType]
 */

/**
 * @typedef {Object} AIMessage
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 */

/**
 * @typedef {Object} ConversationHistory
 * @property {AIMessage[]} messages
 * @property {Object} [metadata]
 */

/**
 * @typedef {AnswerResponse|BriefingWithProductsResponse|MongoQueryResponse|ToolCallResponse|NeedMoreInfoResponse} AIResponse
 */

/**
 * @typedef {Object} AnswerResponse
 * @property {'ANSWER'} type
 * @property {string} content
 */

/**
 * @typedef {Object} BriefingReason
 * @property {'Trend'|'Fit'|'Popularity'|'Value'|'Quality'|'Price'|'Shipping'} label
 * @property {string} text
 */

/**
 * @typedef {Object} ProductCard
 * @property {string} id
 * @property {string} title
 * @property {number} price
 * @property {'KRW'} currency
 * @property {string} [imageUrl]
 * @property {string[]} [badges]
 * @property {string} reason
 * @property {string} detailUrl
 */

/**
 * @typedef {Object} BriefingWithProductsResponse
 * @property {'BRIEFING_WITH_PRODUCTS'} type
 * @property {Object} briefing
 * @property {string} briefing.title
 * @property {string} briefing.summary
 * @property {BriefingReason[]} briefing.reasons
 * @property {string[]} [briefing.followUps]
 * @property {ProductCard[]} products
 */

/**
 * @typedef {Object} MongoQueryResponse
 * @property {'MONGO_QUERY'} type
 * @property {string} collection
 * @property {Object} query
 * @property {Object} [projection]
 * @property {Object} [options]
 * @property {number} [options.limit]
 * @property {Object} [options.sort]
 * @property {number} [options.skip]
 * @property {string} purpose
 */

/**
 * @typedef {Object} ToolCallResponse
 * @property {'TOOL_CALL'} type
 * @property {string} tool
 * @property {Object} payload
 */

/**
 * @typedef {Object} NeedMoreInfoResponse
 * @property {'NEED_MORE_INFO'} type
 * @property {string[]} questions
 */

module.exports = {};

