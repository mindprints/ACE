// ─── Content Pack Types ────────────────────────────────────────────────────────
// All audience-specific content is typed here. Both developer and generalist
// packs implement this interface — components consume whichever is active.

export type PackId = 'developer' | 'generalist'

export interface SkillDef {
  name: string
  description: string
  triggerKeywords: string[]
  content: string // markdown SKILL.md body
}

export interface MockFile {
  filename: string
  language: string
  content: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: object
  exampleArgs: object
  mockResult: string
}

export interface MCPResource {
  uri: string
  name: string
  mimeType: string
}

export interface MCPServer {
  id: string
  name: string
  color: 'amber' | 'blue' | 'emerald'
  description: string
  version?: string
  resources?: MCPResource[]
  tools: MCPTool[]
}

export interface ContentPack {
  id: PackId
  label: string
  description: string

  modelComparison: {
    defaultPrompt: string
  }

  scaffolds: {
    /** Label for the indexed corpus, e.g. "Codebase" or "Knowledge Base" */
    domainLabel: string
    codebase: MockFile[]
    exampleQueries: string[]
  }

  agents: {
    skills: Record<string, SkillDef>
    exampleTasks: string[]
  }

  agentsMD: {
    defaultTemplate: string
    exampleTasks: string[]
  }

  cli: {
    /** Short description shown in the terminal header */
    envLabel: string
    simulatedEnv: string
    examples: string[]
  }

  browserUse: {
    exampleTasks: string[]
  }

  multiAgent: {
    defaultTask: string
    agentALabel: string
    agentBLabel: string
    agentAPrompt: string
    agentBPrompt: string
  }

  mcp: {
    servers: MCPServer[]
  }

  toolCalling: {
    examplePrompts: string[]
    initialMessage: string
  }
}
