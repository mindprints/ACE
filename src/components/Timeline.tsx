import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from './Layout';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Era = 'foundations' | 'ide' | 'agentic' | 'infrastructure' | 'now';

interface TimelineEvent {
  date: string;
  title: string;
  body: string;
  tags: string[];
  era: Era;
  landmark?: boolean; // renders slightly larger
}

const EVENTS: TimelineEvent[] = [
  // ── Foundations era ──────────────────────────────────────────────────
  {
    date: 'Jun 2020',
    title: 'GPT-3 launches',
    body: 'OpenAI releases GPT-3 with 175B parameters. Developers quickly discover it can write plausible code from prose descriptions — a capability that wasn\'t part of the marketing. The copy-paste era begins: generate in ChatGPT, paste into your editor.',
    tags: ['model', 'openai'],
    era: 'foundations',
  },
  {
    date: 'Jun 2021',
    title: 'GitHub Copilot preview',
    body: 'GitHub launches Copilot as a VS Code extension — the first mass-market AI autocomplete tool for developers. Built on Codex (a fine-tuned GPT-3), it transforms inline completion from a party trick into a daily workflow. The IDE becomes the first real AI surface.',
    tags: ['ide', 'github', 'openai'],
    era: 'foundations',
    landmark: true,
  },
  {
    date: 'Nov 2022',
    title: 'ChatGPT goes public',
    body: 'OpenAI\'s ChatGPT reaches 1 million users in 5 days. For developers, it\'s a better interface for code generation than raw Codex — conversational, iterative, shareable. Stack Overflow traffic dips noticeably within weeks.',
    tags: ['model', 'openai'],
    era: 'foundations',
  },
  // ── IDE era ──────────────────────────────────────────────────────────
  {
    date: 'Mar 2023',
    title: 'GPT-4 & 100K context windows',
    body: 'GPT-4 arrives alongside Claude\'s 100K context window from Anthropic. Suddenly, you can paste entire files — even small codebases — into a single prompt. This makes the "context problem" feel solvable and sets the stage for codebase-aware tooling.',
    tags: ['model', 'openai', 'anthropic'],
    era: 'ide',
  },
  {
    date: 'Mid 2023',
    title: 'VS Code forks: Cursor arrives',
    body: 'Cursor ships as the first serious VS Code fork built AI-first. Rather than adding a chat sidebar, it integrates AI into every editing action: inline edits, multi-file diffs, codebase Q&A. Windsurf (Codeium) and Continue.dev follow with competing approaches. The "AI-native IDE" category is born.',
    tags: ['ide', 'cursor', 'vscode'],
    era: 'ide',
    landmark: true,
  },
  {
    date: 'Late 2023',
    title: 'Function/tool calling matures',
    body: 'OpenAI and Anthropic stabilise their tool-calling APIs. Models can now emit structured JSON "requests" that the host application executes — weather lookups, database queries, code execution. This is the mechanical foundation of all agent behaviour that follows.',
    tags: ['api', 'tooling'],
    era: 'ide',
  },
  {
    date: 'Feb 2024',
    title: 'Devin — the first "AI software engineer"',
    body: 'Cognition launches Devin, framed as a fully autonomous software engineer that can plan, code, debug, and deploy end-to-end. The demo goes viral. The term "AI agent" enters mainstream developer vocabulary and triggers a wave of agent-focused startups and investment.',
    tags: ['agent', 'milestone'],
    era: 'ide',
  },
  // ── Agentic era ──────────────────────────────────────────────────────
  {
    date: 'Nov 2024',
    title: 'Anthropic launches MCP',
    body: 'Anthropic open-sources the Model Context Protocol — a standard client-server interface for connecting AI models to tools, files, and data sources. Framed as "USB-C for AI", it solves the M×N integration problem: build once, use with any MCP-compatible client. Ships with reference servers for GitHub, Slack, Google Drive, Postgres.',
    tags: ['protocol', 'anthropic', 'open-standard'],
    era: 'agentic',
    landmark: true,
  },
  {
    date: 'Feb 2025',
    title: 'Claude Code launches',
    body: 'Anthropic ships Claude Code — a terminal-first agentic coding tool. Unlike IDE plugins, it lives in the shell, reads the whole repo, runs bash commands, edits files, and integrates with git. Early users report it can implement non-trivial features end-to-end with minimal guidance. Triggers the "CLI renaissance".',
    tags: ['cli', 'anthropic', 'agent'],
    era: 'agentic',
    landmark: true,
  },
  {
    date: 'Mar 2025',
    title: 'OpenAI adopts MCP',
    body: 'Sam Altman posts: "People love MCP and we are excited to add support across our products." MCP support ships in the Agents SDK, Responses API, and ChatGPT desktop app. The moment MCP becomes a de-facto industry standard rather than one vendor\'s protocol.',
    tags: ['protocol', 'openai', 'mcp'],
    era: 'agentic',
  },
  {
    date: 'Apr 2025',
    title: 'OpenAI Codex CLI ships',
    body: 'OpenAI releases Codex CLI — a terminal agent powered by GPT-5. Positioned as a direct counterpart to Claude Code. Key differentiator: an "approval mode" where the model pauses for human confirmation before each destructive action. Google DeepMind simultaneously confirms MCP support in Gemini.',
    tags: ['cli', 'openai', 'agent'],
    era: 'agentic',
  },
  {
    date: 'May 2025',
    title: 'Claude 4 & reasoning convergence',
    body: 'Anthropic ships Claude 4 (Sonnet 4, Opus 4), dramatically improving tool use and multi-step reasoning. Across the industry, "reasoning" — the o1/o3 pattern of internal chain-of-thought before answering — converges into flagship model lines. Choosing between models shifts from "reasoning vs. chat" to "cost vs. quality".',
    tags: ['model', 'anthropic', 'reasoning'],
    era: 'agentic',
  },
  {
    date: 'Jun 2025',
    title: 'Gemini CLI (open-source)',
    body: 'Google releases Gemini CLI as fully open-source, powered by Gemini 2.5 Pro\'s 1M-token context window. Generous free tier and tight Google Search integration make it the lowest-friction entry point for students and solo developers. Becomes the third major terminal agent alongside Claude Code and Codex.',
    tags: ['cli', 'google', 'open-source'],
    era: 'agentic',
  },
  {
    date: 'Aug 2025',
    title: 'AGENTS.md open standard (OpenAI)',
    body: 'OpenAI releases AGENTS.md — a Markdown convention for giving AI coding agents project-specific instructions (build commands, conventions, boundaries). Analogous to README.md, but for agents. Reaches 60,000+ open-source projects within months and is adopted by Cursor, Gemini CLI, VS Code Copilot, and more.',
    tags: ['standard', 'openai', 'agents'],
    era: 'agentic',
    landmark: true,
  },
  {
    date: 'Oct 2025',
    title: 'Vibe coding goes mainstream',
    body: 'Andrej Karpathy coins "vibe coding" in February 2025, but by October its adoption is undeniable. Stack Overflow\'s 2025 Developer Survey: 65% of developers use AI tools weekly. A Stanford study notes employment among junior developers (22–25) fell ~20% from 2022–2025. The productivity debate intensifies.',
    tags: ['trend', 'culture'],
    era: 'agentic',
  },
  // ── Infrastructure era ───────────────────────────────────────────────
  {
    date: 'Dec 2025',
    title: 'Agentic AI Foundation (Linux Foundation)',
    body: 'Anthropic, OpenAI, and Block co-found the AAIF under the Linux Foundation and donate MCP, AGENTS.md, and Goose respectively. Platinum members include Google, Microsoft, AWS, Bloomberg, and Cloudflare. The tooling layer of the agent era goes officially vendor-neutral. Comparable to how HTTP and Docker became shared infrastructure.',
    tags: ['governance', 'open-standard', 'milestone'],
    era: 'infrastructure',
    landmark: true,
  },
  {
    date: 'Dec 2025',
    title: 'Multi-agent platforms mature',
    body: 'CrewAI, LangGraph, and AutoGen reach production maturity. Claude Code gains native sub-agent support for parallel workstreams. The developer mental model shifts from "one agent doing everything" to "orchestrated teams of specialists" — planner → coder → reviewer → tester pipelines become standard.',
    tags: ['multi-agent', 'frameworks'],
    era: 'infrastructure',
  },
  // ── Now ──────────────────────────────────────────────────────────────
  {
    date: 'Early 2026',
    title: 'Terminal agents dominate',
    body: 'Claude Code commits on GitHub grow explosively from Oct 2025 onward. By early 2026, "spec-driven development" — writing a spec, handing it to Claude Code or Codex — becomes viable for large, complex projects. Building a C compiler end-to-end via Claude Code is documented in February 2026. The question shifts from "can AI code?" to "how do we govern AI that codes?"',
    tags: ['cli', 'trend', '2026'],
    era: 'now',
    landmark: true,
  },
  {
    date: 'Mar 2026',
    title: 'Where we are today',
    body: 'MCP has 10,000+ published servers and 97M+ monthly SDK downloads. AGENTS.md is in 60,000+ repositories. Claude Code, Codex, and Gemini CLI are the three dominant terminal agents. 84% of developers use AI tools in their workflow. IDE plugins are a baseline expectation, not a differentiator. The next frontier: multi-agent orchestration at scale and AI governance.',
    tags: ['today', '2026'],
    era: 'now',
    landmark: true,
  },
];

// ─── Era config ───────────────────────────────────────────────────────────────

const ERA_CONFIG: Record<Era, { label: string; color: string; dotColor: string; bgColor: string }> = {
  foundations:    { label: 'Foundations',    color: 'text-gray-400',   dotColor: 'bg-gray-500',   bgColor: 'bg-gray-500/10 border-gray-500/20' },
  ide:            { label: 'IDE Era',         color: 'text-blue-400',   dotColor: 'bg-blue-500',   bgColor: 'bg-blue-500/10 border-blue-500/20' },
  agentic:        { label: 'Agentic Era',     color: 'text-purple-400', dotColor: 'bg-purple-500', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  infrastructure: { label: 'Infrastructure', color: 'text-amber-400',  dotColor: 'bg-amber-500',  bgColor: 'bg-amber-500/10 border-amber-500/20' },
  now:            { label: 'Now',             color: 'text-emerald-400',dotColor: 'bg-emerald-500',bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
};

const ERA_ORDER: Era[] = ['foundations', 'ide', 'agentic', 'infrastructure', 'now'];

// ─── Tag pill ─────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  model:          'bg-sky-500/10 text-sky-400 border-sky-500/20',
  ide:            'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cli:            'bg-violet-500/10 text-violet-400 border-violet-500/20',
  agent:          'bg-purple-500/10 text-purple-400 border-purple-500/20',
  protocol:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  standard:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'open-standard':'bg-amber-500/10 text-amber-400 border-amber-500/20',
  governance:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  milestone:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  today:          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trend:          'bg-gray-500/10 text-gray-400 border-gray-500/20',
  reasoning:      'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'multi-agent':  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

function Tag({ label }: { label: string }) {
  const cls = TAG_COLORS[label] ?? 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  return (
    <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-md border', cls)}>
      {label}
    </span>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event, eraCfg }: { event: TimelineEvent; eraCfg: typeof ERA_CONFIG[Era] }) {
  const [open, setOpen] = useState(event.landmark ?? false);

  return (
    <div className="relative pl-8">
      {/* Dot on the line */}
      <div className={cn(
        'absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-[#0a0a0a] z-10',
        event.landmark ? eraCfg.dotColor + ' scale-125' : eraCfg.dotColor + ' opacity-70',
      )} />

      <div
        className={cn(
          'rounded-xl border transition-all duration-200',
          open ? 'bg-[#141414] border-white/10' : 'bg-[#0e0e0e] border-white/5 hover:border-white/10',
          event.landmark && open ? 'border-white/15' : '',
        )}
      >
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-start gap-3 px-4 py-3 text-left"
        >
          <span className={cn('text-xs font-mono shrink-0 mt-0.5 w-16', eraCfg.color)}>
            {event.date}
          </span>
          <span className={cn(
            'flex-1 text-sm font-medium leading-snug',
            event.landmark ? 'text-white' : 'text-gray-300',
          )}>
            {event.title}
          </span>
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
          }
        </button>

        {open && (
          <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-3">
            <p className="text-sm text-gray-400 leading-relaxed">{event.body}</p>
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map(t => <Tag key={t} label={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Era section ─────────────────────────────────────────────────────────────

function EraSection({ era, events }: { era: Era; events: TimelineEvent[] }) {
  const cfg = ERA_CONFIG[era];
  return (
    <div className="relative">
      {/* Era label */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn('text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border', cfg.bgColor, cfg.color)}>
          {cfg.label}
        </span>
        <div className="flex-1 border-t border-white/5" />
      </div>

      {/* Vertical line + events */}
      <div className="relative">
        {/* The continuous vertical line */}
        <div className={cn('absolute left-[5px] top-0 bottom-0 w-px', cfg.dotColor + '/30')} />
        <div className="space-y-3">
          {events.map(ev => (
            <EventCard key={ev.title} event={ev} eraCfg={cfg} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Timeline() {
  const eventsByEra = ERA_ORDER.reduce<Record<Era, TimelineEvent[]>>((acc, era) => {
    acc[era] = EVENTS.filter(e => e.era === era);
    return acc;
  }, {} as Record<Era, TimelineEvent[]>);

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto w-full space-y-12 pb-12">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">The Ecosystem Timeline</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            AI coding tools didn't appear from nowhere — each wave solved a specific frustration left by the last.
            Understanding <em>why</em> each tool was built helps you see the field as a living, evolving practice
            rather than a fixed stack to memorise.
          </p>
        </div>

        {/* Key insight */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            <span className="text-white font-semibold">The pattern repeats:</span>{' '}
            A new capability arrives (big models, tool calling, MCP, terminal agents) and initially feels like a toy.
            Within 12–18 months it becomes load-bearing infrastructure that the next wave depends on.
            From 2020 to 2026, each layer has compressed that cycle further.
          </p>
        </div>

        {/* Era filter legend */}
        <div className="flex flex-wrap gap-2">
          {ERA_ORDER.map(era => {
            const cfg = ERA_CONFIG[era];
            return (
              <span key={era} className={cn('text-[11px] font-mono px-3 py-1 rounded-full border', cfg.bgColor, cfg.color)}>
                {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="space-y-10">
          {ERA_ORDER.map(era => (
            <EraSection key={era} era={era} events={eventsByEra[era]} />
          ))}
        </div>

        {/* Footer note */}
        <div className="flex items-start gap-3 bg-black/40 border border-white/10 rounded-xl px-5 py-4">
          <Calendar className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 font-mono leading-relaxed">
            Timeline last updated March 2026. Landmark events (larger dots) are the ones most worth understanding deeply —
            they represent genuine phase transitions, not incremental improvements.
          </p>
        </div>

      </div>
    </div>
  );
}