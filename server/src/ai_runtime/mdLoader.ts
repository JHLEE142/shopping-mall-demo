/**
 * Markdown Loader
 * Loads and parses agent specification markdown files
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolve agents/specs directory path safely
 * Returns null if directory doesn't exist
 */
function resolveAgentsSpecsDir(): string | null {
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
let AGENTS_DIR: string | null = null;

export interface AgentSpec {
  role: string;
  goals: string[];
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  guardrails: Record<string, any>;
  procedure: string[];
  examples: any[];
  failureTags: string[];
}

export function loadAgentSpec(agentName: string): AgentSpec | null {
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

export function parseMarkdownSpec(content: string): AgentSpec {
  const sections = content.split(/^##\s+/m);
  const spec: Partial<AgentSpec> = {
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
        spec.goals = body.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());
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
        spec.procedure = body.split('\n').filter(line => line.trim().startsWith(/\d+\./)).map(line => line.trim());
        break;
      case 'Examples':
        spec.examples = parseExamples(body);
        break;
      case 'Failure Tags':
        spec.failureTags = body.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());
        break;
    }
  }

  return spec as AgentSpec;
}

function parseInputsOutputs(content: string): Record<string, any> {
  const result: Record<string, any> = {};
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

function parseGuardrails(content: string): Record<string, any> {
  // Simple parsing - can be enhanced
  const result: Record<string, any> = {};
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

function parseExamples(content: string): any[] {
  // Extract JSON examples
  const examples: any[] = [];
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

export function getAllAgentNames(): string[] {
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

