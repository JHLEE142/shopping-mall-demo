/**
 * Policy Safety Agent
 * Validates requests and actions against safety policies
 */

import { loadAgentSpec } from './mdLoader';
import { AIResponse, ToolCallResponse } from './types';

export interface SafetyCheckResult {
  verdict: 'ALLOW' | 'WARN' | 'BLOCK';
  reason: string;
  violatedPolicies?: string[];
  alternativeGuidance?: string;
}

export function checkPolicySafety(
  message: string,
  proposedActions: ToolCallResponse[],
  userContext: { isLoggedIn: boolean; userType?: 'consumer' | 'seller'; ageVerified?: boolean }
): SafetyCheckResult {
  const spec = loadAgentSpec('01_policy_safety');
  
  // Check for blocked keywords
  const blockedKeywords = [
    '주민번호', '계좌번호', '카드번호', '비밀번호',
    '마약', '무기', '불법',
  ];
  
  const messageLower = message.toLowerCase();
  for (const keyword of blockedKeywords) {
    if (messageLower.includes(keyword.toLowerCase())) {
      return {
        verdict: 'BLOCK',
        reason: `Request contains blocked keyword: ${keyword}. For privacy protection, sensitive information cannot be processed.`,
        violatedPolicies: ['PII_PROTECTION'],
        alternativeGuidance: 'Please use secure input forms for sensitive information. Contact customer service if needed.',
      };
    }
  }

  // Check for manipulation attempts
  const manipulationPatterns = [
    /지금\s*사지\s*않으면/i,
    /오늘만\s*특가/i,
    /후회한다/i,
  ];
  
  for (const pattern of manipulationPatterns) {
    if (pattern.test(message)) {
      return {
        verdict: 'WARN',
        reason: 'Request contains manipulative language that may pressure users into purchases.',
        violatedPolicies: ['FORCED_PURCHASE'],
        alternativeGuidance: 'Please provide objective product information without pressure.',
      };
    }
  }

  // Check actions
  for (const action of proposedActions) {
    if (action.tool === 'addToCart' || action.tool === 'goToCheckout') {
      const quantity = action.payload.quantity;
      if (quantity && quantity > 100) {
        return {
          verdict: 'WARN',
          reason: 'Large quantity detected. Bulk purchases may require special handling.',
          violatedPolicies: ['EXCESSIVE_QUANTITY'],
          alternativeGuidance: 'For bulk purchases, please contact customer service.',
        };
      }
    }
  }

  // Age-restricted products check
  if (!userContext.ageVerified && message.match(/담배|주류|성인용품/i)) {
    return {
      verdict: 'BLOCK',
      reason: 'Age-restricted products require age verification.',
      violatedPolicies: ['MINOR_PROTECTION', 'AGE_RESTRICTION'],
      alternativeGuidance: 'Age verification is required for tobacco, alcohol, and adult products. Please complete age verification.',
    };
  }

  return {
    verdict: 'ALLOW',
    reason: 'Request passes safety checks.',
  };
}

