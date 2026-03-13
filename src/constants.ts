import { Chapter } from './types';

export const CURRICULUM: Chapter[] = [
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
    id: 'multi-agent',
    title: '8. Multi-Agent Platforms',
    description: 'Orchestrating multiple specialized agents to solve complex problems.',
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