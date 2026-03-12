import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import {
  Cpu, Play, Loader2, AlertCircle, CheckCircle2, Search,
  Terminal, BookOpen, Code2, Sparkles, ChevronDown, ChevronUp,
  FileCode2, Zap, X
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';

// ─── Agent tools (same as before) ────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_documentation",
      description: "Read specific documentation or an article.",
      parameters: {
        type: "object",
        properties: { topic: { type: "string" } },
        required: ["topic"]
      }
    }
  }
];

// ─── Skills Library ────────────────────────────────────────────────────────────
// Each skill is a realistic SKILL.md that the model reads before generating code.
// These match the actual ACE codebase conventions (Tailwind, cn(), dark theme, etc.)

const SKILLS: Record<string, { name: string; description: string; triggerKeywords: string[]; content: string }> = {
  react_component: {
    name: 'react-component',
    description: 'Generates React components matching the ACE design system — Tailwind dark theme, cn() utility, emerald accent, consistent card/button patterns.',
    triggerKeywords: ['component', 'react', 'ui', 'card', 'button', 'form', 'input', 'modal'],
    content: `---
name: react-component
description: Create React components following the ACE project's design system.
triggers: [component, react, ui, card, button, form, input, modal]
---

# React Component Skill

## Project Context
This is the ACE (AI Coding Evolution) educational app. It uses:
- React + TypeScript
- Tailwind CSS (dark theme, bg-[#0a0a0a] / bg-[#121212])
- The \`cn()\` utility from \`./Layout\` for conditional classes
- Lucide React for icons
- Emerald (#10b981) as the primary accent color
- White/10, white/20 for borders

## Component Rules

### File structure
\`\`\`tsx
import React, { useState } from 'react';
import { SomeIcon } from 'lucide-react';
import { cn } from './Layout';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return ( ... );
}
\`\`\`

### Card pattern
\`\`\`tsx
<div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
  ...
</div>
\`\`\`

### Button patterns
Primary: \`className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"\`
Secondary: \`className="px-4 py-2 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"\`
Danger: \`className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-colors"\`

### Input pattern
\`\`\`tsx
<input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
\`\`\`

### Color palette
- Background: bg-[#0a0a0a] (page), bg-[#121212] (cards), bg-black/50 (inputs)
- Text: text-white (headings), text-gray-300 (body), text-gray-400 (secondary), text-gray-600 (placeholder)
- Accent: text-emerald-400, bg-emerald-600, border-emerald-500/20
- Status: text-red-400 (error), text-amber-400 (warning), text-blue-400 (info)
- Borders: border-white/10 (default), border-white/20 (hover)

### Section header pattern
\`\`\`tsx
<div className="flex items-center gap-4 mb-6">
  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
    <Icon className="w-5 h-5 text-emerald-400" />
  </div>
  <h3 className="text-xl font-semibold text-white">{title}</h3>
</div>
\`\`\`

## Output
Always output a single complete .tsx file. No explanatory prose. Start with imports, end with the export.`
  },

  api_service: {
    name: 'api-service',
    description: 'Creates TypeScript API service files using the project\'s fetch/error handling patterns, OpenRouter integration style, and async patterns.',
    triggerKeywords: ['api', 'fetch', 'service', 'request', 'endpoint', 'openrouter', 'http'],
    content: `---
name: api-service
description: Create TypeScript API service files following ACE project conventions.
triggers: [api, fetch, service, request, endpoint, openrouter, http]
---

# API Service Skill

## Project Context
ACE uses plain fetch() with async/await. API keys come from localStorage.
OpenRouter is the AI gateway. Services live in src/services/.

## Service File Pattern
\`\`\`typescript
const BASE_URL = 'https://api.example.com';

export interface ResponseType {
  id: string;
  data: string;
}

export async function fetchSomething(
  param: string,
  apiKey: string
): Promise<ResponseType> {
  const response = await fetch(\`\${BASE_URL}/endpoint\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({ param }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? \`HTTP \${response.status}\`);
  }

  return response.json();
}
\`\`\`

## Error Handling
- Always check response.ok and throw with a descriptive message
- Use .catch(() => ({})) when parsing error JSON to avoid double-throws
- Surface errors via err.message to the UI layer

## API Key Pattern
Always retrieve from localStorage:
\`\`\`typescript
const apiKey = localStorage.getItem('openrouter_api_key');
if (!apiKey) throw new Error('API key not configured');
\`\`\`

## Output
Single complete .ts file. Include all types. Export all public functions.`
  },

  supabase_integration: {
    name: 'supabase-integration',
    description: 'Generates Supabase database queries, RLS policies, and TypeScript client code following safe patterns.',
    triggerKeywords: ['supabase', 'database', 'query', 'rls', 'postgres', 'table', 'migration'],
    content: `---
name: supabase-integration
description: Write Supabase queries and RLS policies following security best practices.
triggers: [supabase, database, query, rls, postgres, table, migration]
---

# Supabase Integration Skill

## Client Setup
\`\`\`typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
\`\`\`

## Query Patterns
Always use typed returns and handle errors inline:
\`\`\`typescript
const { data, error } = await supabase
  .from('table_name')
  .select('id, title, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (error) throw new Error(error.message);
return data;
\`\`\`

## RLS Policy Pattern
Every table must have RLS enabled:
\`\`\`sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Users can only read their own rows
CREATE POLICY "Users read own rows" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert rows they own  
CREATE POLICY "Users insert own rows" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);
\`\`\`

## CRITICAL: authored_by pattern
When inserting, always set authored_by explicitly:
\`\`\`typescript
await supabase.from('proposals').insert({
  title,
  authored_by: user.id,   // explicit — never rely on trigger
  created_by: user.id,
});
\`\`\`

## Output
Single .ts file with typed client, all query functions exported, inline error handling.`
  }
};

// ─── Skill Matcher (BM25-lite — same approach as RAG demo for consistency) ──

function matchSkill(task: string): string | null {
  const tokens = task.toLowerCase().split(/\s+/);
  let best: string | null = null;
  let bestScore = 0;

  for (const [key, skill] of Object.entries(SKILLS)) {
    const score = skill.triggerKeywords.reduce((acc, kw) => {
      return acc + tokens.filter(t => t.includes(kw)).length;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }

  return bestScore > 0 ? best : null;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AgentStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result' | 'skill_loaded';
  content: string;
  meta?: string;
}

// ─── Mock tool execution ───────────────────────────────────────────────────────

async function executeMockTool(name: string, args: any): Promise<string> {
  await new Promise(r => setTimeout(r, 700));
  if (name === 'search_web') {
    return `Search results for "${args.query}":\n` +
      `1. React 19 ships the React Compiler — automatic memoization, no more useMemo/useCallback.\n` +
      `2. New hooks: useActionState (replaces useReducer for forms), useFormStatus, useOptimistic.\n` +
      `3. Server Components are now stable in React 19.\n` +
      `4. ref is now a regular prop — no more forwardRef() wrapper needed.`;
  }
  if (name === 'read_documentation') {
    return `Documentation on "${args.topic}":\n` +
      `The React Compiler automatically memoizes components and hooks.\n` +
      `useActionState(action, initialState) replaces the common useReducer + form pattern.\n` +
      `useOptimistic() lets you show an optimistic UI update before the server responds.`;
  }
  return 'Tool not found.';
}

// ─── Single agent runner ───────────────────────────────────────────────────────

async function runAgent(
  goal: string,
  systemPromptExtra: string,
  apiKey: string,
  onStep: (step: Omit<AgentStep, 'id'>) => void
): Promise<void> {
  const systemPrompt = `You are an autonomous coding agent. Fulfill the user's request.
Think step by step. Use tools when you need information. 
When you have enough info, produce your final deliverable (code or a written answer).
Do NOT ask the user for permission. Just execute.
${systemPromptExtra}`;

  let messages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: goal }
  ];

  let iterations = 0;
  const MAX = 5;

  while (iterations < MAX) {
    iterations++;
    const response = await fetchOpenRouterChatFull(messages, 'openai/gpt-4o', apiKey, AGENT_TOOLS);
    messages.push(response);

    if (response.content) {
      const isFinal = !response.tool_calls || response.tool_calls.length === 0;
      onStep({ type: isFinal ? 'result' : 'thought', content: response.content });
      if (isFinal) break;
    }

    if (response.tool_calls?.length > 0) {
      const toolResults = [];
      for (const call of response.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        onStep({ type: 'action', content: call.function.name, meta: JSON.stringify(args) });
        const result = await executeMockTool(call.function.name, args);
        onStep({ type: 'observation', content: result });
        toolResults.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: result });
      }
      messages = [...messages, ...toolResults];
    }
  }
}

// ─── Step renderer ─────────────────────────────────────────────────────────────

function StepList({ steps, loading }: { steps: AgentStep[]; loading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [steps, loading]);

  if (steps.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm italic font-sans p-6">
        Run the agent to see its execution trace.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-3 font-mono text-sm">
      {steps.map(step => {
        if (step.type === 'skill_loaded') return (
          <div key={step.id} className="flex items-start gap-2 text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2.5">
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Skill loaded: </span>
              <span className="text-emerald-300">{step.content}</span>
              {step.meta && <div className="text-emerald-600 text-xs mt-0.5">{step.meta}</div>}
            </div>
          </div>
        );
        if (step.type === 'thought') return (
          <div key={step.id} className="flex gap-2 text-gray-400">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div><span className="text-purple-400 font-semibold mr-1">Thought:</span>{step.content}</div>
          </div>
        );
        if (step.type === 'action') return (
          <div key={step.id} className="flex gap-2 text-blue-400 ml-6">
            <Search className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold mr-1">Action:</span>{step.content}
              {step.meta && <div className="text-blue-500/60 text-xs mt-0.5">args: {step.meta}</div>}
            </div>
          </div>
        );
        if (step.type === 'observation') return (
          <div key={step.id} className="ml-6 border-l-2 border-emerald-500/20 pl-3 py-1 text-emerald-400/80 whitespace-pre-wrap">
            <span className="text-emerald-500 font-semibold mr-1">Obs:</span>{step.content}
          </div>
        );
        if (step.type === 'result') return (
          <div key={step.id} className="mt-4 pt-4 border-t border-white/10 font-sans">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-white font-semibold">Final Output</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none bg-black/30 p-5 rounded-xl border border-white/5">
              <Markdown>{step.content}</Markdown>
            </div>
          </div>
        );
        return null;
      })}
      {loading && (
        <div className="flex gap-2 text-gray-600 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Agent is working...</span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

// ─── Skill Card (expandable SKILL.md viewer) ───────────────────────────────────

function SkillCard({ skillKey }: { skillKey: string }) {
  const [open, setOpen] = useState(false);
  const skill = SKILLS[skillKey];
  if (!skill) return null;

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-emerald-300 font-semibold flex-1">{skill.name}/SKILL.md</span>
        <span className="text-emerald-600 text-[10px] hidden sm:block">{skill.description.slice(0, 60)}…</span>
        {open ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
      </button>
      {open && (
        <div className="border-t border-emerald-500/20 px-4 py-3">
          <pre className="text-gray-400 whitespace-pre-wrap break-all leading-relaxed text-[11px] max-h-64 overflow-y-auto">
            {skill.content}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Example tasks ─────────────────────────────────────────────────────────────

const EXAMPLE_TASKS = [
  { label: 'Build a notification banner component', skillKey: 'react_component' },
  { label: 'Create a stats card with trend indicator', skillKey: 'react_component' },
  { label: 'Write a service to fetch user profiles', skillKey: 'api_service' },
  { label: 'Add a Supabase query for user proposals', skillKey: 'supabase_integration' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Agents() {
  const [goal, setGoal] = useState('Build a notification banner component with title, message, and a dismiss button.');
  const [stepsNoSkill, setStepsNoSkill] = useState<AgentStep[]>([]);
  const [stepsWithSkill, setStepsWithSkill] = useState<AgentStep[]>([]);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedSkillKey, setMatchedSkillKey] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // Original agent section state
  const [agentGoal, setAgentGoal] = useState('Research the new features in React 19 and write a short summary.');
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [showAgentDemo, setShowAgentDemo] = useState(false);

  const addStep = useCallback((
    setter: React.Dispatch<React.SetStateAction<AgentStep[]>>
  ) => (step: Omit<AgentStep, 'id'>) => {
    setter(prev => [...prev, { ...step, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const handleRunComparison = async (taskText?: string) => {
    const task = (taskText ?? goal).trim();
    if (!task) return;
    if (taskText) setGoal(taskText);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setError('Please configure your OpenRouter API key in the Setup section first.'); return; }

    setError(null);
    setStepsNoSkill([]);
    setStepsWithSkill([]);
    setHasRun(true);
    setLoadingLeft(true);
    setLoadingRight(true);

    const skillKey = matchSkill(task);
    setMatchedSkillKey(skillKey);

    // Build skill system prompt addendum
    const skillPromptExtra = skillKey
      ? `\n\n# Loaded Skill: ${SKILLS[skillKey].name}\n\n${SKILLS[skillKey].content}`
      : '';

    // Show "skill loaded" step on right side
    if (skillKey) {
      addStep(setStepsWithSkill)({
        type: 'skill_loaded',
        content: SKILLS[skillKey].name,
        meta: `Matched on keywords: ${SKILLS[skillKey].triggerKeywords.filter(kw => task.toLowerCase().includes(kw)).join(', ')}`
      });
    }

    // Run both agents in parallel
    const leftPromise = runAgent(task, '', apiKey, addStep(setStepsNoSkill))
      .finally(() => setLoadingLeft(false));

    const rightPromise = runAgent(task, skillPromptExtra, apiKey, addStep(setStepsWithSkill))
      .finally(() => setLoadingRight(false));

    await Promise.all([leftPromise, rightPromise]).catch(err => setError(err.message));
  };

  const handleRunAgent = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setAgentError('Please configure your OpenRouter API key in the Setup section first.'); return; }
    setAgentError(null);
    setAgentSteps([]);
    setAgentRunning(true);
    addStep(setAgentSteps)({ type: 'thought', content: `Goal received: "${agentGoal}". Planning execution...` });
    await runAgent(agentGoal, '', apiKey, addStep(setAgentSteps)).catch(err => setAgentError(err.message));
    setAgentRunning(false);
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-8 overflow-y-auto pb-12">

      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">Agents & Skills</h2>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          An <strong className="text-gray-300">Agent</strong> is a model in an autonomous loop — it thinks, calls tools, observes results, and repeats until done.
          But even the best agent produces generic output without knowing <em>your</em> conventions.
          That's where <strong className="text-gray-300">Skills</strong> come in.
        </p>
      </div>

      {/* ── Skills Concept ─────────────────────────────────────────────── */}
      <section className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">What are Skills?</h3>
            <p className="text-gray-500 text-xs">Introduced by Anthropic, October 2025</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          Skills are organized folders of instructions, scripts, and resources that agents discover and load dynamically to perform better at specific tasks. Think of building a skill as writing an onboarding guide for a new hire — instead of re-explaining your codebase conventions every time, you encode them once.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            { icon: <FileCode2 className="w-4 h-4" />, title: 'SKILL.md', desc: 'A markdown file with YAML frontmatter describing when to load it, plus instructions the agent follows.' },
            { icon: <Zap className="w-4 h-4" />, title: 'Auto-discovery', desc: 'The agent scans available skills at session start. Each skill costs only a few dozen tokens to scan — full content loads only when relevant.' },
            { icon: <Sparkles className="w-4 h-4" />, title: 'RAG vs Skills', desc: 'RAG injects your data. Skills inject your know-how — patterns, conventions, and procedural expertise.' },
          ].map(c => (
            <div key={c.title} className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">{c.icon}<span className="font-mono text-xs font-semibold">{c.title}</span></div>
              <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Skills Comparison Demo ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-semibold text-white">Live Skills Demo</h3>
        </div>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          Give the agent a coding task. The same task runs twice in parallel — once with no skill, once with a{' '}
          <span className="font-mono text-gray-400">SKILL.md</span> that encodes this project's conventions (Tailwind dark theme,{' '}
          <span className="font-mono text-gray-400">cn()</span>, emerald accent, component patterns). The skill is matched automatically via keyword scoring — the same BM25 approach used in the RAG demo.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /><p className="text-sm">{error}</p>
          </div>
        )}

        {/* Task input */}
        <div className="space-y-3 mb-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRunComparison(); }}
              placeholder="Describe a coding task..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
            <button
              onClick={() => handleRunComparison()}
              disabled={!goal.trim() || loadingLeft || loadingRight}
              className="px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {(loadingLeft || loadingRight) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Compare
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TASKS.map(t => (
              <button
                key={t.label}
                onClick={() => handleRunComparison(t.label)}
                disabled={loadingLeft || loadingRight}
                className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 font-mono truncate max-w-[280px]"
                title={t.label}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skill matched indicator + viewer */}
        {hasRun && (
          <div className="mb-4 space-y-2">
            {matchedSkillKey ? (
              <>
                <p className="text-xs text-gray-500 font-mono">
                  <span className="text-emerald-400">✓ Skill matched:</span> keyword overlap triggered{' '}
                  <span className="text-emerald-300 font-semibold">{SKILLS[matchedSkillKey].name}</span>
                </p>
                <SkillCard skillKey={matchedSkillKey} />
              </>
            ) : (
              <p className="text-xs text-gray-600 font-mono italic">No skill matched for this task — both agents run without extra context.</p>
            )}
          </div>
        )}

        {/* Side-by-side */}
        {hasRun && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Without skill */}
            <div className="bg-[#121212] border border-red-500/20 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-500/20 bg-red-500/5">
                <span className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xs">✗</span>
                <span className="text-red-400 font-semibold text-sm">Without Skill</span>
                <span className="text-gray-600 text-xs ml-auto font-mono">generic output</span>
              </div>
              <StepList steps={stepsNoSkill} loading={loadingLeft} />
            </div>

            {/* With skill */}
            <div className="bg-[#121212] border border-emerald-500/20 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">With Skill</span>
                <span className="text-gray-600 text-xs ml-auto font-mono">project-aware output</span>
              </div>
              <StepList steps={stepsWithSkill} loading={loadingRight} />
            </div>
          </div>
        )}
      </section>

      {/* ── Classic Agent Demo (collapsible) ────────────────────────────── */}
      <section>
        <button
          onClick={() => setShowAgentDemo(o => !o)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm font-mono"
        >
          <Terminal className="w-4 h-4" />
          {showAgentDemo ? 'Hide' : 'Show'} classic agent loop demo
          {showAgentDemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAgentDemo && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-500 text-sm">
              A basic ReAct-style agent: given a high-level goal it thinks, searches, observes, and synthesises — no human in the loop.
            </p>
            {agentError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" /><p className="text-sm">{agentError}</p>
              </div>
            )}
            <div className="bg-[#121212] border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Agent Goal</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={agentGoal}
                  onChange={e => setAgentGoal(e.target.value)}
                  disabled={agentRunning}
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="e.g., Research React 19 features..."
                />
                <button
                  onClick={handleRunAgent}
                  disabled={agentRunning || !agentGoal.trim()}
                  className="px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {agentRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {agentRunning ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 300 }}>
              <div className="p-3 border-b border-white/10 bg-black/20 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Execution Trace</span>
              </div>
              <StepList steps={agentSteps} loading={agentRunning} />
            </div>
          </div>
        )}
      </section>

    </div>
  );
}