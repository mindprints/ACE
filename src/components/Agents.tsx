import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import {
  Cpu, Play, Loader2, AlertCircle, CheckCircle2, Search,
  Terminal, BookOpen, Code2, Sparkles, ChevronDown, ChevronUp,
  FileCode2, Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';
import { useContentPack } from '../context/ContentPackContext';
import type { SkillDef } from '../data/contentPack';

// ─── Agent tools ──────────────────────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The search query" } },
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
        properties: { topic: { type: "string", description: "The topic to read about" } },
        required: ["topic"]
      }
    }
  }
];

// ─── Skills Library ────────────────────────────────────────────────────────────

const SKILLS: Record<string, { name: string; description: string; triggerKeywords: string[]; content: string }> = {
  react_component: {
    name: 'react-component',
    description: 'Generates React components matching the ACE design system — Tailwind dark theme, cn() utility, emerald accent, consistent card/button patterns.',
    triggerKeywords: ['component', 'react', 'ui', 'card', 'button', 'form', 'input', 'modal', 'banner', 'badge', 'progress', 'copy'],
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
    description: "Creates TypeScript API service files using the project's fetch/error handling patterns and async conventions.",
    triggerKeywords: ['api', 'fetch', 'service', 'request', 'endpoint', 'openrouter', 'http', 'hook', 'localstorage'],
    content: `---
name: api-service
description: Create TypeScript API service files following ACE project conventions.
triggers: [api, fetch, service, request, endpoint, openrouter, http]
---

# API Service Skill

## Project Context
ACE uses plain fetch() with async/await. API keys come from localStorage.
Services live in src/services/. Custom hooks live in src/hooks/.

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
\`\`\`sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rows" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

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

// ─── BM25-lite skill matcher ───────────────────────────────────────────────────

function matchSkill(task: string, skills: Record<string, SkillDef>): string | null {
  const tokens = task.toLowerCase().split(/\s+/);
  let best: string | null = null;
  let bestScore = 0;
  for (const [key, skill] of Object.entries(skills)) {
    const score = skill.triggerKeywords.reduce((acc, kw) =>
      acc + tokens.filter(t => t.includes(kw)).length, 0);
    if (score > bestScore) { bestScore = score; best = key; }
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
      `2. New hooks: useActionState, useFormStatus, useOptimistic.\n` +
      `3. Server Components are now stable. ref is now a regular prop.`;
  }
  if (name === 'read_documentation') {
    return `Documentation on "${args.topic}":\n` +
      `The React Compiler automatically memoizes components and hooks.\n` +
      `useActionState(action, initialState) replaces the common useReducer + form pattern.\n` +
      `useOptimistic() lets you show an optimistic UI update before the server responds.`;
  }
  return 'Tool not found.';
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

async function runAgent(
  goal: string,
  systemExtra: string,
  apiKey: string,
  onStep: (step: Omit<AgentStep, 'id'>) => void
): Promise<void> {
  let messages: any[] = [
    {
      role: 'system',
      content: `You are an autonomous coding agent. Fulfill the user's request.
Think step by step. Use tools when you need information.
When you have enough info, produce your final deliverable (code or a written answer).
Do NOT ask the user for permission.${systemExtra}`
    },
    { role: 'user', content: goal }
  ];

  let iterations = 0;
  while (iterations < 5) {
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

// ─── Step list renderer ───────────────────────────────────────────────────────

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

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({ skillKey }: { skillKey: string }) {
  const { pack } = useContentPack();
  const [open, setOpen] = useState(false);
  const skill = pack.agents.skills[skillKey];
  if (!skill) return null;
  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-emerald-300 font-semibold flex-1">{skill.name}/SKILL.md</span>
        <span className="text-emerald-600 text-[10px] hidden sm:block truncate max-w-[240px]">{skill.description}</span>
        {open ? <ChevronUp className="w-3 h-3 text-gray-600 shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />}
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


// ─── Main export ──────────────────────────────────────────────────────────────

export function Agents() {
  const { pack, packId } = useContentPack();
  const [goal, setGoal] = useState(pack.agents.exampleTasks[0]);
  const [stepsNoSkill, setStepsNoSkill] = useState<AgentStep[]>([]);
  const [stepsWithSkill, setStepsWithSkill] = useState<AgentStep[]>([]);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedSkillKey, setMatchedSkillKey] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // Classic agent demo state
  const [agentGoal, setAgentGoal] = useState('Research the new features in React 19 and write a short summary.');
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [showAgentDemo, setShowAgentDemo] = useState(false);

  // Reset when pack changes
  useEffect(() => {
    setGoal(pack.agents.exampleTasks[0]);
    setStepsNoSkill([]);
    setStepsWithSkill([]);
    setMatchedSkillKey(null);
    setHasRun(false);
  }, [packId]); // eslint-disable-line react-hooks/exhaustive-deps

  const makeAdder = (setter: React.Dispatch<React.SetStateAction<AgentStep[]>>) =>
    (step: Omit<AgentStep, 'id'>) =>
      setter(prev => [...prev, { ...step, id: `${Date.now()}-${Math.random()}` }]);

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

    const skillKey = matchSkill(task, pack.agents.skills);
    setMatchedSkillKey(skillKey);

    const skillExtra = skillKey
      ? `\n\n# Loaded Skill: ${pack.agents.skills[skillKey].name}\n\n${pack.agents.skills[skillKey].content}`
      : '';

    if (skillKey) {
      makeAdder(setStepsWithSkill)({
        type: 'skill_loaded',
        content: pack.agents.skills[skillKey].name,
        meta: `Matched on: ${pack.agents.skills[skillKey].triggerKeywords.filter(kw => task.toLowerCase().includes(kw)).join(', ')}`
      });
    }

    await Promise.all([
      runAgent(task, '', apiKey, makeAdder(setStepsNoSkill)).finally(() => setLoadingLeft(false)),
      runAgent(task, skillExtra, apiKey, makeAdder(setStepsWithSkill)).finally(() => setLoadingRight(false)),
    ]).catch(err => setError(err.message));
  };

  const handleRunAgent = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setAgentError('Please configure your OpenRouter API key in the Setup section first.'); return; }
    setAgentError(null);
    setAgentSteps([]);
    setAgentRunning(true);
    makeAdder(setAgentSteps)({ type: 'thought', content: `Goal: "${agentGoal}". Planning...` });
    await runAgent(agentGoal, '', apiKey, makeAdder(setAgentSteps)).catch(err => setAgentError(err.message));
    setAgentRunning(false);
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-8 overflow-y-auto pb-12">

      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">Skills</h2>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          Even the most capable agent produces generic output without knowing <em>your</em> project's conventions.
          <strong className="text-gray-300"> Skills</strong> are reusable{' '}
          <code className="text-gray-300 bg-white/5 px-1 rounded text-xs">SKILL.md</code> files — discovered and loaded
          dynamically — that encode domain expertise and project patterns so agents write code that fits right in.
        </p>
      </div>

      {/* What are Skills */}
      <section className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">What are Skills?</h3>
            <p className="text-gray-500 text-xs">Introduced by Anthropic · October 2025</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          Skills are organized folders containing a <code className="text-gray-400 text-xs bg-white/5 px-1 rounded">SKILL.md</code> with
          YAML frontmatter (name, description, triggers) plus any supporting scripts or resources.
          At session start the agent scans available skills cheaply — full content only loads when the task matches.
          Think of writing a skill as onboarding a new developer: instead of re-explaining your conventions every session, you encode them once.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <FileCode2 className="w-4 h-4" />, title: 'SKILL.md', desc: 'Markdown with YAML frontmatter. Describes when to load, plus instructions and code examples the agent follows.' },
            { icon: <Zap className="w-4 h-4" />, title: 'Auto-discovery', desc: 'Agent scans available skills at session start. Each costs only a few tokens to scan — full content loads only when relevant.' },
            { icon: <Sparkles className="w-4 h-4" />, title: 'RAG vs Skills', desc: 'RAG injects your data (what your codebase contains). Skills inject your know-how (how your team writes code).' },
          ].map(c => (
            <div key={c.title} className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">{c.icon}<span className="font-mono text-xs font-semibold">{c.title}</span></div>
              <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-mono mb-3">Partner skills available in Claude</p>
          <div className="flex flex-wrap gap-2">
            {['Atlassian', 'Figma', 'Canva', 'Notion', 'Linear', 'Asana', 'Sentry', 'Datadog'].map(p => (
              <span key={p} className="text-xs font-mono text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Skills comparison demo */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-semibold text-white">Live Skills Demo</h3>
        </div>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          The same coding task runs twice in parallel — once with no skill, once with a matching{' '}
          <code className="text-gray-400 text-xs bg-white/5 px-1 rounded">SKILL.md</code> injected.
          Skills are matched via keyword scoring (same BM25 approach as the RAG demo).
          Expand the skill card to read exactly what was injected.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /><p className="text-sm">{error}</p>
          </div>
        )}

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
            {pack.agents.exampleTasks.map(t => (
              <button
                key={t}
                onClick={() => handleRunComparison(t)}
                disabled={loadingLeft || loadingRight}
                className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 font-mono truncate max-w-[280px]"
                title={t}
              >{t}</button>
            ))}
          </div>
        </div>

        {hasRun && (
          <div className="mb-4 space-y-2">
            {matchedSkillKey ? (
              <>
                <p className="text-xs text-gray-500 font-mono">
                  <span className="text-emerald-400">✓ Skill matched:</span>{' '}
                  <span className="text-emerald-300 font-semibold">{pack.agents.skills[matchedSkillKey]?.name}</span>
                  {' '}— keyword overlap triggered auto-load
                </p>
                <SkillCard skillKey={matchedSkillKey} />
              </>
            ) : (
              <p className="text-xs text-gray-600 font-mono italic">No skill matched — both agents run without extra context.</p>
            )}
          </div>
        )}

        {hasRun && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#121212] border border-red-500/20 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-500/20 bg-red-500/5 shrink-0">
                <span className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">✗</span>
                <span className="text-red-400 font-semibold text-sm">Without Skill</span>
                <span className="text-gray-600 text-xs ml-auto font-mono">generic output</span>
              </div>
              <StepList steps={stepsNoSkill} loading={loadingLeft} />
            </div>
            <div className="bg-[#121212] border border-emerald-500/20 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5 shrink-0">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">With Skill</span>
                <span className="text-gray-600 text-xs ml-auto font-mono">project-aware output</span>
              </div>
              <StepList steps={stepsWithSkill} loading={loadingRight} />
            </div>
          </div>
        )}
      </section>

      {/* Classic agent loop (collapsible) */}
      <section>
        <button
          onClick={() => setShowAgentDemo(o => !o)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm font-mono"
        >
          <Terminal className="w-4 h-4" />
          {showAgentDemo ? 'Hide' : 'Show'} classic ReAct agent loop demo
          {showAgentDemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showAgentDemo && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-500 text-sm">A basic ReAct-style agent: think → use tools → observe → repeat until done.</p>
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
              <div className="p-3 border-b border-white/10 bg-black/20 flex items-center gap-2 shrink-0">
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