/**
 * Orchestrator
 * Main coordinator for agent routing and response synthesis
 */

import { AgentContext, AIResponse, IntentResult } from './types';
import { buildSystemPrompt, buildUserPrompt } from './promptBuilder';
import { checkPolicySafety, SafetyCheckResult } from './policySafety';
import { validateToolCall } from './toolGateway';
import { executeMongoQuery, QueryExecutionResult } from './mongoQueryExecutor';
import { MongoQueryResponse } from './types';

// Intent to agent mapping
const INTENT_AGENT_MAP: Record<string, string> = {
  'search_product': '12_product_search',
  'get_recommendation': '13_reco_fit',
  'compare_price': '14_price_compare',
  'add_to_cart': '15_order_flow',
  'purchase': '15_order_flow',
  'cancel_order': '16_after_sales',
  'refund_request': '16_after_sales',
  'write_review': '17_review_assistant',
  'check_rewards': '18_account_rewards',
  'seller_analytics': '20_seller_analytics',
  'simulate_pricing': '21_pricing_simulator',
  'analyze_efficiency': '22_product_efficiency',
  'create_listing': '23_listing_assistant',
  'spend_analysis': '30_spend_behavior_analyst',
  'reflection': '31_reflection_coach',
};

export interface OrchestrationResult {
  response: AIResponse;
  selectedAgents: string[];
  confidence: number;
  requiresConfirmation: boolean;
}

/**
 * Main orchestration function
 */
export async function orchestrate(
  message: string,
  context: AgentContext
): Promise<OrchestrationResult> {
  // Step 1: Policy Safety Check
  const safetyCheck = checkPolicySafety(
    message,
    [],
    context.userContext
  );

  if (safetyCheck.verdict === 'BLOCK') {
    return {
      response: {
        type: 'ANSWER',
        content: safetyCheck.reason + (safetyCheck.alternativeGuidance ? ` ${safetyCheck.alternativeGuidance}` : ''),
      },
      selectedAgents: ['01_policy_safety'],
      confidence: 1.0,
      requiresConfirmation: false,
    };
  }

  // Step 2: Intent Routing (simplified - in production, use actual intent router)
  const intent = await routeIntent(message, context);
  
  if (intent.confidence < 0.7) {
    return {
      response: {
        type: 'NEED_MORE_INFO',
        questions: [
          'Could you provide more details about what you\'re looking for?',
          'What specific product or service are you interested in?',
        ],
      },
      selectedAgents: ['10_intent_router'],
      confidence: intent.confidence,
      requiresConfirmation: false,
    };
  }

  // Step 3: Route to appropriate agent
  const agentName = INTENT_AGENT_MAP[intent.primaryIntent] || '00_orchestrator';
  
  // Step 4: Generate response (simplified - in production, call LLM)
  const response = await generateAgentResponse(agentName, message, { ...context, intent });

  // Step 5: Handle MONGO_QUERY responses
  if (response.type === 'MONGO_QUERY') {
    const queryResult = await executeMongoQuery(response, context.userContext);
    
    if (!queryResult.success) {
      return {
        response: {
          type: 'ANSWER',
          content: `Query execution failed: ${queryResult.error}`,
        },
        selectedAgents: [agentName],
        confidence: 0.5,
        requiresConfirmation: false,
      };
    }

    // Generate answer from query results
    return {
      response: {
        type: 'ANSWER',
        content: formatQueryResults(queryResult, response.purpose),
      },
      selectedAgents: [agentName],
      confidence: intent.confidence,
      requiresConfirmation: false,
    };
  }

  // Step 6: Validate tool calls
  if (response.type === 'TOOL_CALL') {
    const validation = validateToolCall(response);
    
    if (!validation.isValid) {
      return {
        response: {
          type: 'ANSWER',
          content: `Tool call validation failed: ${validation.errors?.join(', ')}`,
        },
        selectedAgents: [agentName],
        confidence: intent.confidence,
        requiresConfirmation: true,
      };
    }
  }

  return {
    response,
    selectedAgents: [agentName],
    confidence: intent.confidence,
    requiresConfirmation: response.type === 'TOOL_CALL',
  };
}

/**
 * Simplified intent routing (in production, use actual intent router agent)
 */
async function routeIntent(message: string, context: AgentContext): Promise<IntentResult> {
  const messageLower = message.toLowerCase();
  
  // Simple keyword-based routing
  if (messageLower.match(/search|find|look for|찾아|검색/)) {
    return { primaryIntent: 'search_product', confidence: 0.85 };
  }
  if (messageLower.match(/recommend|suggest|추천/)) {
    return { primaryIntent: 'get_recommendation', confidence: 0.85 };
  }
  if (messageLower.match(/compare|비교/)) {
    return { primaryIntent: 'compare_price', confidence: 0.80 };
  }
  if (messageLower.match(/add.*cart|장바구니/)) {
    return { primaryIntent: 'add_to_cart', confidence: 0.90 };
  }
  if (messageLower.match(/buy|purchase|구매|결제/)) {
    return { primaryIntent: 'purchase', confidence: 0.90 };
  }
  if (messageLower.match(/cancel|취소/)) {
    return { primaryIntent: 'cancel_order', confidence: 0.85 };
  }
  if (messageLower.match(/refund|환불/)) {
    return { primaryIntent: 'refund_request', confidence: 0.85 };
  }
  if (messageLower.match(/review|리뷰/)) {
    return { primaryIntent: 'write_review', confidence: 0.80 };
  }
  if (messageLower.match(/reward|point|적립금|포인트/)) {
    return { primaryIntent: 'check_rewards', confidence: 0.85 };
  }
  if (messageLower.match(/analytics|매출|수익/)) {
    return { primaryIntent: 'seller_analytics', confidence: 0.80 };
  }
  if (messageLower.match(/spend|소비/)) {
    return { primaryIntent: 'spend_analysis', confidence: 0.75 };
  }

  return { primaryIntent: 'unknown', confidence: 0.5 };
}

/**
 * Generate agent response (simplified - in production, call LLM with agent prompt)
 */
async function generateAgentResponse(
  agentName: string,
  message: string,
  context: AgentContext
): Promise<AIResponse> {
  // This is a placeholder - in production, this would call OpenAI/LLM API
  // For now, return a simple response based on agent type
  
  if (agentName === '12_product_search') {
    return {
      type: 'MONGO_QUERY',
      collection: 'products',
      query: { name: { $regex: message, $options: 'i' } },
      options: { limit: 20 },
      purpose: 'Search products matching user query',
    };
  }

  if (agentName === '13_reco_fit') {
    return {
      type: 'BRIEFING_WITH_PRODUCTS',
      briefing: {
        title: 'Recommended Products',
        summary: 'Based on your preferences, here are some products we recommend.',
        reasons: [
          { label: 'Fit', text: 'Matches your usage patterns' },
          { label: 'Value', text: 'Good price-to-performance ratio' },
        ],
      },
      products: [],
    };
  }

  return {
    type: 'ANSWER',
    content: `I understand you're looking for: ${message}. How can I help you with that?`,
  };
}

/**
 * Format query results into human-readable answer
 */
function formatQueryResults(result: QueryExecutionResult, purpose: string): string {
  if (!result.data || result.data.length === 0) {
    return `No results found for: ${purpose}`;
  }

  const count = result.data.length;
  const total = result.count || count;
  
  return `Found ${count} result${count !== 1 ? 's' : ''}${total > count ? ` (out of ${total} total)` : ''} for: ${purpose}. ` +
    `Results: ${JSON.stringify(result.data.slice(0, 5), null, 2)}`;
}

