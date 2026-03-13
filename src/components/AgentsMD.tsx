import React, { useState, useCallback, useEffect } from 'react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import {
  FileText, Play, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Sparkles, GitBranch, Terminal,
  Shield, Wrench, BookOpen, Code2, Zap, Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';
import { useContentPack } from '../context/ContentPackContext';

// ─── Section annotations in the AGENTS.md editor ─────────────────────────────

const SECTION_HINTS: { heading: string; why: string }[] = [
  { heading: '## Build & Test', why: 'Exact commands — agents run these verbatim, so be precise.' },
  { heading: '## Project Structure', why: 'Agents use this to find files without scanning the whole tree.' },
  { heading: '## Tech Stack', why: 'Prevents agents from reaching for the wrong library or version.' },
  { heading: '## Code Conventions', why: 'The highest-leverage section — this is where style consistency comes from.' },
  { heading: '## Boundaries', why: 'Tells the agent what to never touch and when to ask before acting.' },
];

// ─── Response panel ────────────────────────────────────────────────────────────

function ResponsePanel({
  label, color, response, loading, badge
}: {
  label: string;
  color: 'red' | 'emerald';
  response: string | null;
  loading: boolean;
  badge: string;
}) {
  const colors = {
    red:     { border: 'border-red-500/20',     bg: 'bg-red-500/5',     text: 'text-red-400',     badgeCls: 'bg-red-500/10 border-red-500/20 text-red-400' },
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badgeCls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  }[color];

  return (
    <div className={cn("flex flex-col rounded-2xl border overflow-hidden min-h-[280px]", colors.border, colors.bg)}>
      <div className={cn("flex items-center gap-3 px-5 py-3 border-b shrink-0", colors.border)}>
        <span className={cn("text-xs font-mono px-2.5 py-1 rounded-full border", colors.badgeCls)}>{badge}</span>
        <span className={cn("font-semibold text-sm", colors.text)}>{label}</span>
      </div>
      <div className="flex-1 p-5">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating...</span>
          </div>
        ) : response ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <Markdown>{response}</Markdown>
          </div>
        ) : (
          <p className="text-gray-700 text-sm italic mt-2">Output appears here after you run the comparison.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentsMD() {
  const { pack, packId } = useContentPack();
  const [agentsMd, setAgentsMd] = useState(pack.agentsMD.defaultTemplate);
  const [task, setTask] = useState(pack.agentsMD.exampleTasks[0]);

  // Reset content when audience pack changes
  useEffect(() => {
    setAgentsMd(pack.agentsMD.defaultTemplate);
    setTask(pack.agentsMD.exampleTasks[0]);
  }, [packId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [loadingWith, setLoadingWith] = useState(false);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [withResponse, setWithResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleRun = useCallback(async (taskText?: string) => {
    const t = (taskText ?? task).trim();
    if (!t) return;
    if (taskText) setTask(taskText);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setError('Please configure your OpenRouter API key in the Setup section first.'); return; }

    setError(null);
    setRawResponse(null);
    setWithResponse(null);
    setHasRun(true);
    setLoadingRaw(true);
    setLoadingWith(true);

    const model = 'openai/gpt-4o';

    const rawPromise = fetchOpenRouterChatFull(
      [{ role: 'user', content: `You are a coding assistant. Complete this task:\n\n${t}` }],
      model, apiKey, []
    ).then(msg => { setRawResponse(msg.content ?? ''); setLoadingRaw(false); })
     .catch(err => { setRawResponse(`Error: ${err.message}`); setLoadingRaw(false); });

    const withPromise = fetchOpenRouterChatFull(
      [{
        role: 'user',
        content: `You are a coding assistant working on a specific project. Here is the project's AGENTS.md:\n\n${agentsMd}\n\n---\n\nTask: ${t}\n\nFollow all conventions and boundaries defined in AGENTS.md exactly.`
      }],
      model, apiKey, []
    ).then(msg => { setWithResponse(msg.content ?? ''); setLoadingWith(false); })
     .catch(err => { setWithResponse(`Error: ${err.message}`); setLoadingWith(false); });

    await Promise.all([rawPromise, withPromise]).catch(err => setError(err.message));
  }, [task, agentsMd]);

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-8 overflow-y-auto pb-12">

      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">Agents & AGENTS.md</h2>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          Just as <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">README.md</code> onboards human contributors,{' '}
          <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">AGENTS.md</code> onboards AI coding agents.
          It's a plain Markdown file at your repo root that tells agents how to build, test, navigate,
          and behave in your project — before they write a single line of code.
        </p>
      </div>

      {/* ── What is AGENTS.md ──────────────────────────────────────────── */}
      <section className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">What is AGENTS.md?</h3>
            <p className="text-gray-500 text-xs">Open standard · Agentic AI Foundation (Linux Foundation) · 2025</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">
          AGENTS.md emerged from a simple observation: AI coding agents were smart enough to write code
          but had no reliable way to learn your project's conventions — so they'd reach for the wrong library,
          ignore your test setup, or break your folder structure. The format was developed collaboratively
          across OpenAI Codex, Google Jules, Cursor, Amp, and Factory, and is now stewarded as a neutral open standard.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: <BookOpen className="w-4 h-4" />,
              color: 'blue',
              title: 'README.md vs AGENTS.md',
              desc: 'README is for humans: project intro, quick start, contribution guide. AGENTS.md is for agents: build commands, test runners, coding conventions, boundaries. Both live in the repo root and complement each other.'
            },
            {
              icon: <GitBranch className="w-4 h-4" />,
              color: 'amber',
              title: 'Hierarchical & Portable',
              desc: 'Works across Claude Code, OpenAI Codex, Cursor, Jules, Amp, Factory, and more. In monorepos, agents read the nearest AGENTS.md — a subpackage can override the root with its own conventions. The OpenAI repo has 88 AGENTS.md files.'
            },
            {
              icon: <Shield className="w-4 h-4" />,
              color: 'red',
              title: 'Boundaries & Safety',
              desc: 'The most important section. Tell agents what to never touch (secrets, vendor directories, prod config), when to ask before acting (new deps, schema changes), and what "done" looks like (lint passes, tests green, diff is small).'
            },
            {
              icon: <Zap className="w-4 h-4" />,
              color: 'emerald',
              title: 'Iterative, not upfront',
              desc: 'Don\'t try to write the perfect AGENTS.md on day one. The best files grow through iteration: add a rule the second time your agent makes the same mistake. Target ≤ 150 lines — long files bury the signal.'
            },
          ].map(c => {
            const clr = {
              blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              red: 'text-red-400 bg-red-500/10 border-red-500/20',
              emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            }[c.color];
            return (
              <div key={c.title} className="bg-black/40 border border-white/10 rounded-xl p-4">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border mb-3", clr)}>{c.icon}</div>
                <h4 className="text-white text-sm font-medium mb-1">{c.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Supported agents */}
        <div className="border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-mono mb-3">Supported by</p>
          <div className="flex flex-wrap gap-2">
            {['Claude Code', 'OpenAI Codex', 'Cursor', 'Google Jules', 'Amp', 'Factory', 'GitHub Copilot', 'Windsurf'].map(tool => (
              <span key={tool} className="text-xs font-mono text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* ETH Zurich nuance */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80 leading-relaxed">
            <strong className="text-amber-300">Worth knowing:</strong> A March 2026 ETH Zurich study (AGENTbench) found that LLM-generated AGENTS.md files can
            actually hurt performance — agents follow instructions literally and run unnecessary steps. The recommendation:
            keep human-written AGENTS.md files short, specific, and focused on non-inferable details like custom build commands
            and security gotchas. Don't generate them wholesale with AI.
          </p>
        </div>
      </section>

      {/* ── Six core sections anatomy ────────────────────────────────── */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-500" />
          Anatomy of a Good AGENTS.md
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: <Wrench className="w-4 h-4" />, section: '# Build & Test', color: 'emerald', tip: 'Exact commands with flags. Agents copy-paste these — vagueness causes failures.' },
            { icon: <Code2 className="w-4 h-4" />, section: '# Project Structure', color: 'blue', tip: 'Map folder → purpose. Agents use this instead of scanning the whole tree.' },
            { icon: <Zap className="w-4 h-4" />, section: '# Tech Stack', color: 'amber', tip: 'Specify versions. "React 18 + TypeScript + Vite" beats "React project".' },
            { icon: <FileText className="w-4 h-4" />, section: '# Code Conventions', color: 'purple', tip: 'Real code snippets beat abstract descriptions. Show what good output looks like.' },
            { icon: <GitBranch className="w-4 h-4" />, section: '# Git Workflow', color: 'sky', tip: 'Commit message format, branch naming, PR checklist. Saves code review time.' },
            { icon: <Shield className="w-4 h-4" />, section: '# Boundaries', color: 'red', tip: '"Always / Ask first / Never" tiers. The most important section for safety.' },
          ].map(c => {
            const clr = {
              emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
              amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
              purple:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
              sky:     'text-sky-400 bg-sky-500/10 border-sky-500/20',
              red:     'text-red-400 bg-red-500/10 border-red-500/20',
            }[c.color];
            return (
              <div key={c.section} className="bg-[#121212] border border-white/10 rounded-xl p-4">
                <div className={cn("flex items-center gap-2 text-xs font-mono mb-2 w-fit px-2.5 py-1 rounded-lg border", clr)}>
                  {c.icon}{c.section}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{c.tip}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Interactive Demo ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-semibold text-white">Live Demo — Edit & Compare</h3>
        </div>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          The editor below contains a real <code className="text-gray-400 text-xs bg-white/5 px-1 rounded">AGENTS.md</code> for the ACE project.
          Edit it, then run a task — the same prompt is sent twice: once with no context, once with your AGENTS.md injected.
          Watch how the conventions section shapes the generated code.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /><p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* AGENTS.md editor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> AGENTS.md
              </label>
              <button
                onClick={() => setShowHints(h => !h)}
                className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
              >
                {showHints ? 'hide hints' : 'show section hints'}
                {showHints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showHints && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2 text-xs font-mono">
                {SECTION_HINTS.map(h => (
                  <div key={h.heading}>
                    <span className="text-emerald-400">{h.heading}</span>
                    <span className="text-gray-600 ml-2">{h.why}</span>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={agentsMd}
              onChange={e => setAgentsMd(e.target.value)}
              rows={22}
              spellCheck={false}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none leading-relaxed"
            />
            <p className="text-xs text-gray-700 font-mono text-right">{agentsMd.split('\n').length} lines · {agentsMd.length} chars</p>
          </div>

          {/* Task + run */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-2">Coding Task</label>
              <textarea
                value={task}
                onChange={e => setTask(e.target.value)}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                placeholder="Describe what you want the agent to build..."
              />
            </div>

            <button
              onClick={() => handleRun()}
              disabled={!task.trim() || loadingRaw || loadingWith}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {(loadingRaw || loadingWith) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Comparison
            </button>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider font-mono mb-2">Example tasks</p>
              <div className="space-y-2">
                {pack.agentsMD.exampleTasks.map(t => (
                  <button
                    key={t}
                    onClick={() => handleRun(t)}
                    disabled={loadingRaw || loadingWith}
                    className="w-full text-left text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-colors disabled:opacity-40 font-mono"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* What to look for */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mt-auto">
              <p className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> What to look for
              </p>
              <ul className="text-xs text-blue-300/70 space-y-1 leading-relaxed">
                <li>• Does the output use <code className="text-blue-300">bg-[#121212]</code> and <code className="text-blue-300">border-white/10</code>?</li>
                <li>• Is <code className="text-blue-300">cn()</code> from <code className="text-blue-300">./Layout</code> used correctly?</li>
                <li>• Are props typed with interfaces, not inline types?</li>
                <li>• Is it a named export, not default?</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Side-by-side results */}
        {hasRun && (
          <div className="grid md:grid-cols-2 gap-5">
            <ResponsePanel
              label="Without AGENTS.md"
              color="red"
              badge="✗ generic"
              response={rawResponse}
              loading={loadingRaw}
            />
            <ResponsePanel
              label="With AGENTS.md"
              color="emerald"
              badge="✓ project-aware"
              response={withResponse}
              loading={loadingWith}
            />
          </div>
        )}
      </section>

    </div>
  );
}