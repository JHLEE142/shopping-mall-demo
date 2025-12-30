/**
 * AI Runtime Types
 * Common type definitions for the AI shopping assistant runtime
 */

export interface UserContext {
  userId?: string;
  sellerId?: string;
  isLoggedIn: boolean;
  userType?: 'consumer' | 'seller';
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ConversationHistory {
  messages: AIMessage[];
  metadata?: Record<string, any>;
}

// Standard Response Formats
export type AIResponse =
  | AnswerResponse
  | BriefingWithProductsResponse
  | MongoQueryResponse
  | ToolCallResponse
  | NeedMoreInfoResponse;

export interface AnswerResponse {
  type: 'ANSWER';
  content: string;
}

export interface BriefingWithProductsResponse {
  type: 'BRIEFING_WITH_PRODUCTS';
  briefing: {
    title: string;
    summary: string;
    reasons: Array<{
      label: 'Trend' | 'Fit' | 'Popularity' | 'Value' | 'Quality' | 'Price' | 'Shipping';
      text: string;
    }>;
    followUps?: string[];
  };
  products: Array<{
    id: string;
    title: string;
    price: number;
    currency: 'KRW';
    imageUrl?: string;
    badges?: string[];
    reason: string;
    detailUrl: string;
  }>;
}

export interface MongoQueryResponse {
  type: 'MONGO_QUERY';
  collection: string;
  query: any; // MongoDB query object
  projection?: any;
  options?: {
    limit?: number;
    sort?: any;
    skip?: number;
  };
  purpose: string;
}

export interface ToolCallResponse {
  type: 'TOOL_CALL';
  tool: string;
  payload: Record<string, any>;
}

export interface NeedMoreInfoResponse {
  type: 'NEED_MORE_INFO';
  questions: string[];
}

// Agent-specific types
export interface IntentResult {
  primaryIntent: string;
  confidence: number;
  alternativeIntents?: Array<{ intent: string; confidence: number }>;
  extractedSlots?: Record<string, any>;
}

export interface SlotCollectionResult {
  collectedSlots: Record<string, any>;
  missingSlots: string[];
  nextQuestion?: string;
  isComplete: boolean;
}

export interface ProductSearchResult {
  products: any[];
  totalCount: number;
  searchReasoning: string;
  appliedFilters?: string[];
}

export interface AgentContext {
  userContext: UserContext;
  conversationHistory: ConversationHistory;
  intent?: IntentResult;
  slots?: SlotCollectionResult;
  [key: string]: any;
}

