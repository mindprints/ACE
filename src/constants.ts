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
    type: 'informational' 
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
    type: 'informational' 
  },
  { 
    id: 'agents', 
    title: '5. Agents & Skills', 
    description: 'Moving from single prompts to autonomous task execution.',
    type: 'interactive' 
  },
  { 
    id: 'cli', 
    title: '6. The CLI Renaissance', 
    description: 'Terminal-native AI tools and browser-use automation.',
    type: 'interactive' 
  },
  { 
    id: 'multi-agent', 
    title: '7. Multi-Agent Platforms', 
    description: 'Orchestrating multiple specialized agents to solve complex problems.',
    type: 'interactive' 
  },
];

export const POPULAR_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },
];
