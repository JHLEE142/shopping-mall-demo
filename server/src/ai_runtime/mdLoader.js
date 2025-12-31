/**
 * Markdown Loader
 * Loads and parses agent specification markdown files
 */

const fs = require('fs');
const path = require('path');

/**
 * Resolve agents/specs directory path safely
 * Works from any location (process.cwd() or __dirname)
 * Returns null if directory doesn't exist
 */
function resolveAgentsSpecsDir() {
  // Try multiple strategies to find repo root
  let repoRoot = process.cwd();
  
  // If running from server/src/ai_runtime, go up 3 levels to repo root
  if (__dirname.includes('server/src/ai_runtime')) {
    repoRoot = path.resolve(__dirname, '../../..');
  }
  // If running from server/src/, go up 2 levels
  else if (__dirname.includes('server/src')) {
    repoRoot = path.resolve(__dirname, '../..');
  }
  // If running from server/, go up 1 level
  else if (__dirname.includes('server')) {
    repoRoot = path.resolve(__dirname, '..');
  }
  
  const agentsSpecsPath = path.join(repoRoot, 'agents', 'specs');
  
  // Return path if it exists, otherwise return null
  if (!fs.existsSync(agentsSpecsPath)) {
    return null;
  }
  
  return agentsSpecsPath;
}

// Lazy initialization - will be resolved when first used
let AGENTS_DIR = null;

/**
 * @typedef {Object} AgentSpec
 * @property {string} role
 * @property {string[]} goals
 * @property {Object} inputs
 * @property {Object} outputs
 * @property {Object} guardrails
 * @property {string[]} procedure
 * @property {Array} examples
 * @property {string[]} failureTags
 */

/**
 * Load agent specification from markdown file
 * @param {string} agentName
 * @returns {AgentSpec|null}
 */
function loadAgentSpec(agentName) {
  // Lazy initialize AGENTS_DIR
  if (AGENTS_DIR === null) {
    AGENTS_DIR = resolveAgentsSpecsDir();
  }
  
  // If agents directory doesn't exist, return null
  if (!AGENTS_DIR) {
    return null;
  }
  
  try {
    const filePath = path.join(AGENTS_DIR, `${agentName}.md`);
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseMarkdownSpec(content);
  } catch (error) {
    console.error(`Failed to load agent spec: ${agentName}`, error);
    return null;
  }
}

/**
 * Parse markdown specification into structured object
 * @param {string} content
 * @returns {AgentSpec}
 */
function parseMarkdownSpec(content) {
  const sections = content.split(/^##\s+/m);
  const spec = {
    goals: [],
    procedure: [],
    examples: [],
    failureTags: [],
    inputs: {},
    outputs: {},
    guardrails: {},
  };

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim();
    const body = lines.slice(1).join('\n').trim();

    switch (title) {
      case 'Role':
        spec.role = body;
        break;
      case 'Goals':
        spec.goals = body
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim());
        break;
      case 'Inputs':
        spec.inputs = parseInputsOutputs(body);
        break;
      case 'Outputs':
        spec.outputs = parseInputsOutputs(body);
        break;
      case 'Guardrails':
        spec.guardrails = parseGuardrails(body);
        break;
      case 'Procedure':
        spec.procedure = body
          .split('\n')
          .filter(line => /^\d+\./.test(line.trim()))
          .map(line => line.trim());
        break;
      case 'Examples':
        spec.examples = parseExamples(body);
        break;
      case 'Failure Tags':
        spec.failureTags = body
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim());
        break;
    }
  }

  return spec;
}

function parseInputsOutputs(content) {
  const result = {};
  const lines = content.split('\n');
  let currentKey = '';
  let currentDesc = '';

  for (const line of lines) {
    if (line.trim().startsWith('- `')) {
      if (currentKey) {
        result[currentKey] = currentDesc.trim();
      }
      const match = line.match(/`(\w+)`:\s*(.+)/);
      if (match) {
        currentKey = match[1];
        currentDesc = match[2];
      }
    } else if (line.trim() && currentKey) {
      currentDesc += ' ' + line.trim();
    }
  }
  if (currentKey) {
    result[currentKey] = currentDesc.trim();
  }
  return result;
}

function parseGuardrails(content) {
  const result = {};
  const sections = content.split(/^\d+\.\s+\*\*/m);
  for (const section of sections.slice(1)) {
    const match = section.match(/\*\*(.+?)\*\*/);
    if (match) {
      const key = match[1];
      result[key] = section.replace(/\*\*.+?\*\*/, '').trim();
    }
  }
  return result;
}

function parseExamples(content) {
  const examples = [];
  const jsonBlocks = content.match(/```json\n([\s\S]*?)\n```/g);
  if (jsonBlocks) {
    for (const block of jsonBlocks) {
      try {
        const jsonStr = block.replace(/```json\n/, '').replace(/\n```/, '');
        const parsed = JSON.parse(jsonStr);
        examples.push(parsed);
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  return examples;
}

/**
 * Get all agent names from specs directory
 * @returns {string[]}
 */
function getAllAgentNames() {
  // Lazy initialize AGENTS_DIR
  if (AGENTS_DIR === null) {
    AGENTS_DIR = resolveAgentsSpecsDir();
  }
  
  // If agents directory doesn't exist, return empty array
  if (!AGENTS_DIR) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(AGENTS_DIR);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch (error) {
    console.error('Failed to list agent files', error);
    return [];
  }
}

module.exports = {
  loadAgentSpec,
  parseMarkdownSpec,
  getAllAgentNames,
};

