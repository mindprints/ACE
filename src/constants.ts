import { Chapter } from './types';

export const DEVELOPER_CURRICULUM: Chapter[] = [
  {
    id: 'timeline',
    title: 'The Ecosystem Timeline',
    description: 'A timeline of the AI coding ecosystem.',
    type: 'interactive'
  },
  {
    id: 'setup',
    title: 'Setup & Configuration',
    description: 'Configure your OpenRouter API key to enable live demos.',
    type: 'config'
  },
  {
    id: 'basics',
    title: '1. Basic Capabilities',
    description: 'Compare raw model outputs across different open and closed-weight models.',
    type: 'interactive'
  },
  {
    id: 'scaffolds',
    title: '2. Scaffolds & Harnesses',
    description: 'Understanding how IDE forks like Cursor and Windsurf integrate AI into the editor.',
    type: 'interactive'
  },
  {
    id: 'tools',
    title: '3. Tool Calling & Search',
    description: 'How models interact with the outside world using tools and web search.',
    type: 'interactive'
  },
  {
    id: 'mcps',
    title: '4. Model Context Protocol (MCP)',
    description: 'Standardizing how models access context and local resources.',
    type: 'interactive'
  },
  {
    id: 'skills',
    title: '5. Skills',
    description: 'Reusable SKILL.md files that teach agents domain-specific expertise and project conventions.',
    type: 'interactive'
  },
  {
    id: 'agents-md',
    title: '6. Agents & AGENTS.md',
    description: 'The open standard for briefing AI coding agents on your project — build commands, conventions, and boundaries.',
    type: 'interactive'
  },
  {
    id: 'cli',
    title: '7. The CLI Renaissance',
    description: 'Terminal-native AI tools and browser-use automation.',
    type: 'interactive'
  },
  {
    id: 'browser-use',
    title: '8. Browser & Computer Use',
    description: 'Agents that can see and act in the world',
    type: 'interactive'
  },
  {
    id: 'multi-agent',
    title: '9. Multi-Agent Platforms',
    description: 'Orchestrating multiple specialized agents to solve complex problems.',
    type: 'interactive'
  },
  {
    id: 'ide-evolution',
    title: '10. IDE Evolution',
    description: 'The progression of AI in the editor, from autocomplete to agents.',
    type: 'interactive'
  },
];

// Alias kept for any legacy imports
export const CURRICULUM = DEVELOPER_CURRICULUM;

export const GENERALIST_CURRICULUM: Chapter[] = [
  {
    id: 'timeline',
    title: 'The Ecosystem Timeline',
    description: 'How AI evolved from a coder\'s tool into an assistant for everyone.',
    type: 'interactive'
  },
  {
    id: 'g-setup',
    title: 'Setup',
    description: 'Configure your API key to enable live demonstrations.',
    type: 'config'
  },
  {
    id: 'g-basics',
    title: '1. Your AI Advisors',
    description: 'Different AI models have different strengths. Compare them on real everyday tasks.',
    type: 'interactive'
  },
  {
    id: 'g-tools',
    title: '2. AI That Looks Things Up',
    description: 'How AI moves beyond stored knowledge to find, calculate, and verify in real time.',
    type: 'interactive'
  },
  {
    id: 'g-connectors',
    title: '3. Connect Your World',
    description: 'How AI plugs into the apps and data sources you already use.',
    type: 'interactive'
  },
  {
    id: 'g-teach',
    title: '4. Teach It Your Way',
    description: 'Give AI the context of your domain so it becomes an expert in your world.',
    type: 'interactive'
  },
  {
    id: 'g-brief',
    title: '5. Brief Your Assistant',
    description: 'How to set up an AI agent with the right goals, guardrails, and expectations.',
    type: 'interactive'
  },
  {
    id: 'g-delegate',
    title: '6. Just Say It',
    description: 'Natural language is the new interface. Describe what you want — AI handles the how.',
    type: 'interactive'
  },
  {
    id: 'g-research',
    title: '7. AI Does the Legwork',
    description: 'Agents that browse, gather, compare, and synthesize information on your behalf.',
    type: 'interactive'
  },
  {
    id: 'g-teams',
    title: '8. AI Teams at Work',
    description: 'Specialist agents working in parallel — each doing what it does best.',
    type: 'interactive'
  },
  {
    id: 'g-evolution',
    title: '9. The New Way of Working',
    description: 'How workflows are evolving — from manual to AI-augmented to fully delegated.',
    type: 'interactive'
  },
];

export const POPULAR_MODELS = [
  { id: 'openai/gpt-4o',                          name: 'GPT-4o',           provider: 'OpenAI'    },
  { id: 'anthropic/claude-3.5-sonnet',            name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'meta-llama/llama-3.3-70b-instruct',      name: 'Llama 3.3 70B',    provider: 'Meta'      },
  { id: 'google/gemini-2.5-pro',                  name: 'Gemini 2.5 Pro',   provider: 'Google'    },
  { id: 'z-ai/glm-5',                             name: 'GLM 5',   provider: 'Z.ai'  },
  { id: 'qwen/qwen3.5-plus-02-15',                name: 'Qwen 3.5',   provider: 'Alibaba'  },
  { id: 'moonshotai/kimi-k2-thinking',            name: 'Kimi K2',   provider: 'Moonshot AI'  },
  { id: 'minimax/minimax-m2.5',                   name: 'MiniMax',   provider: 'MiniBax'  },
  { id: 'deepseek/deepseek-v3.2-speciale',        name: 'DeepSeek V3.2',   provider: 'DeepSeek'  },
];