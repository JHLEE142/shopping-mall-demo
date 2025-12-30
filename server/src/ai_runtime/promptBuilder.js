/**
 * Prompt Builder
 * Builds system prompts from agent specifications
 */

const { loadAgentSpec } = require('./mdLoader');

/**
 * Build system prompt for an agent
 * @param {string} agentName
 * @param {Object} [context]
 * @returns {string}
 */
function buildSystemPrompt(agentName, context) {
  const spec = loadAgentSpec(agentName);
  if (!spec) {
    return `You are an AI assistant. Help the user with their request.`;
  }

  let prompt = `# Role\n${spec.role}\n\n`;

  if (spec.goals && spec.goals.length > 0) {
    prompt += `# Goals\n`;
    spec.goals.forEach(goal => {
      prompt += `- ${goal}\n`;
    });
    prompt += `\n`;
  }

  if (spec.guardrails && Object.keys(spec.guardrails).length > 0) {
    prompt += `# Guardrails\n`;
    Object.entries(spec.guardrails).forEach(([key, value]) => {
      prompt += `## ${key}\n${value}\n\n`;
    });
  }

  // Add context-specific instructions
  if (context) {
    if (context.userContext && context.userContext.isLoggedIn) {
      prompt += `\n# User Context\n`;
      if (context.userContext.userId) {
        prompt += `- User ID: ${context.userContext.userId}\n`;
      }
      if (context.userContext.userType) {
        prompt += `- User Type: ${context.userContext.userType}\n`;
      }
    }
  }

  prompt += `\n# Important Rules\n`;
  prompt += `- All responses must be in English.\n`;
  prompt += `- For database queries, use MongoDB query format (not SQL).\n`;
  prompt += `- Never modify data directly - use tool calls for all state changes.\n`;
  prompt += `- Always validate user permissions before executing queries or tools.\n`;

  return prompt;
}

/**
 * Build user prompt with context
 * @param {string} message
 * @param {Object} [context]
 * @returns {string}
 */
function buildUserPrompt(message, context) {
  let prompt = message;

  if (context && context.intent) {
    prompt += `\n\n[Detected Intent: ${context.intent.primaryIntent}, Confidence: ${context.intent.confidence}]`;
  }

  if (context && context.slots && !context.slots.isComplete) {
    prompt += `\n\n[Missing Information: ${context.slots.missingSlots.join(', ')}]`;
  }

  return prompt;
}

/**
 * Get agent instructions
 * @param {string} agentName
 * @returns {string}
 */
function getAgentInstructions(agentName) {
  const spec = loadAgentSpec(agentName);
  if (!spec) return '';

  let instructions = spec.role + '\n\n';
  
  if (spec.procedure && spec.procedure.length > 0) {
    instructions += 'Procedure:\n';
    spec.procedure.forEach((step, idx) => {
      instructions += `${idx + 1}. ${step}\n`;
    });
  }

  return instructions;
}

module.exports = {
  buildSystemPrompt,
  buildUserPrompt,
  getAgentInstructions,
};

