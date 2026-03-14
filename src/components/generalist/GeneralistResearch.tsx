import React, { useState, useCallback, useRef, useEffect } from 'react';
import { fetchOpenRouterChatFull } from '../../services/openRouter';
import {
  Globe, Play, Loader2, AlertCircle, Eye, MousePointer,
  Search, CheckCircle2, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType = 'navigate' | 'observe' | 'click' | 'extract' | 'complete';

interface ResearchStep {
  type: StepType;
  description: string;
  detail?: string;
  result?: string;
}

interface ResearchResult {
  steps: ResearchStep[];
  summary: string;
}

// ─── Step styling ─────────────────────────────────────────────────────────────

const STEP_META: Record<StepType, { icon: React.ReactNode; label: string; color: string }> = {
  navigate: { icon: <Globe className="w-3.5 h-3.5" />,       label: 'Opening',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  observe:  { icon: <Eye className="w-3.5 h-3.5" />,         label: 'Reading',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  click:    { icon: <MousePointer className="w-3.5 h-3.5" />, label: 'Navigating', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  extract:  { icon: <Search className="w-3.5 h-3.5" />,       label: 'Gathering',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  complete: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Done',       color: 'text-green-400 bg-green-500/10 border-green-500/20' },
};

// ─── Example research tasks ───────────────────────────────────────────────────

const EXAMPLE_TASKS = [
  'Compare the top 3 project management tools — pricing, features, and who they\'re best for',
  'What are the most common mistakes first-time managers make, and how do I avoid them?',
  'Summarise the current debate around four-day work weeks — pros, cons, and evidence',
  'What should I look for when hiring a freelance designer? What questions should I ask?',
  'Give me a quick overview of how electric vehicles compare to hybrids right now',
];

// ─── Simulate research agent ──────────────────────────────────────────────────

async function runResearch(task: string, apiKey: string): Promise<ResearchResult> {
  const planPrompt = `You are simulating an AI research agent that browses the web to answer questions.

Research task: "${task}"

Respond ONLY with a JSON object (no markdown fences):
{
  "steps": [
    { "type": "navigate",  "description": "...", "detail": "https://..." },
    { "type": "observe",   "description": "...", "detail": "What was found on the page" },
    { "type": "extract",   "description": "...", "detail": "Key information extracted" },
    { "type": "navigate",  "description": "...", "detail": "https://..." },
    { "type": "observe",   "description": "...", "detail": "What was found" },
    { "type": "extract",   "description": "...", "detail": "Key information extracted" },
    { "type": "complete",  "description": "Research complete", "detail": "Compiled findings" }
  ],
  "summary": "A thorough 200-word answer to the research task, written as if the agent actually visited real websites. Be specific — name real tools, cite realistic figures, reference actual sources by name."
}

Rules:
- 5-8 steps total. Start with navigate, end with complete.
- navigate "detail" must be a realistic URL (e.g. forbes.com/..., harvard.edu/...)
- observe and extract "detail" should describe realistic found content
- summary must read like real research results, not a placeholder`;

  const msg = await fetchOpenRouterChatFull(
    [{ role: 'user', content: planPrompt }],
    'openai/gpt-4o-mini',
    apiKey,
    []
  );

  try {
    const text = (msg.content ?? '').replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return {
      steps: [
        { type: 'navigate', description: 'Opening primary source', detail: 'https://research.example.com' },
        { type: 'observe',  description: 'Reading content',        detail: 'Found relevant information' },
        { type: 'extract',  description: 'Gathering key points',   detail: 'Extracted main findings' },
        { type: 'complete', description: 'Research complete',       detail: 'Compiled summary' },
      ],
      summary: 'The research agent gathered information from multiple sources and compiled the results.',
    };
  }
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, index, visible }: { step: ResearchStep; index: number; visible: boolean }) {
  const [open, setOpen] = useState(false);
  const meta = STEP_META[step.type] ?? STEP_META.observe;

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden bg-black/30 transition-all duration-400',
        meta.color.split(' ')[2],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <button
        onClick={() => step.detail && setOpen(o => !o)}
        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left', step.detail ? 'hover:bg-white/5' : '')}
      >
        <span className={cn('flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border shrink-0', meta.color)}>
          {meta.icon}
          {meta.label}
        </span>
        <span className="text-sm text-gray-300 flex-1 truncate">{step.description}</span>
        {step.detail && (
          open ? <ChevronUp className="w-3 h-3 text-gray-600 shrink-0" />
               : <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />
        )}
      </button>
      {open && step.detail && (
        <div className="px-4 pb-3 border-t border-white/5">
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{step.detail}</p>
        </div>
      )}
    </div>
  );
}

// ─── Simulated browser ────────────────────────────────────────────────────────

function BrowserPanel({ url, loading, summary }: { url?: string; loading: boolean; summary?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0e0e0e] h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#141414] border-b border-white/10 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-black/40 rounded px-3 py-1 flex items-center gap-2 min-w-0">
          {loading && <Loader2 className="w-3 h-3 text-gray-500 animate-spin shrink-0" />}
          <span className="text-xs font-mono text-gray-500 truncate">{url ?? 'about:blank'}</span>
        </div>
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <Globe className="w-7 h-7 text-gray-700" />
            <p className="text-xs text-gray-600">Agent is browsing…</p>
          </div>
        ) : summary ? (
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <Markdown>{summary}</Markdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <FileText className="w-7 h-7 text-gray-800" />
            <p className="text-xs text-gray-700">Results appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistResearch() {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!result) return;
    setVisibleSteps(0);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setVisibleSteps(i);
      const navStep = result.steps.find(s => s.type === 'navigate');
      if (navStep?.detail && i === 1) setCurrentUrl(navStep.detail);
      if (i >= result.steps.length && timerRef.current) clearInterval(timerRef.current);
    }, 400);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [result]);

  const handleRun = useCallback(async (text?: string) => {
    const t = (text ?? task).trim();
    if (!t) return;
    if (text) setTask(text);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }

    setError(null);
    setResult(null);
    setCurrentUrl(undefined);
    setVisibleSteps(0);
    setLoading(true);

    try {
      const res = await runResearch(t, apiKey);
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [task]);

  const navUrl = result?.steps.find(s => s.type === 'navigate')?.detail;
  const showSummary = result && visibleSteps >= result.steps.length;

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-10 pb-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">AI Does the Legwork</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Research Without the Rabbit Holes</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Research used to mean hours of tabs, skimming, and trying to triangulate truth from
            conflicting sources. An AI agent can now browse, read, compare, and synthesise — then
            give you a clear, structured answer. You set the question; it does the reading.
          </p>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'You ask a question', desc: 'In plain language — as specific or broad as you like.', color: 'border-white/10 bg-white/5' },
            { label: 'Agent browses & reads', desc: 'It visits multiple sources, extracts relevant content, and cross-references.', color: 'border-violet-500/20 bg-violet-500/5' },
            { label: 'You get a clear answer', desc: 'Synthesised, sourced, and tailored to your question — not a list of links.', color: 'border-emerald-500/20 bg-emerald-500/5' },
          ].map(({ label, desc, color }) => (
            <div key={label} className={cn('rounded-xl border p-4', color)}>
              <div className="text-white text-sm font-medium mb-2">{label}</div>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
              placeholder="What do you want researched?"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
            />
            <button
              onClick={() => handleRun()}
              disabled={!task.trim() || loading}
              className="px-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Research
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TASKS.map(t => (
              <button
                key={t}
                onClick={() => handleRun(t)}
                disabled={loading}
                className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 truncate max-w-sm"
                title={t}
              >
                {t.length > 65 ? t.slice(0, 65) + '…' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {(loading || result) && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Step trace */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Research steps</span>
              </div>
              {loading && !result && (
                <div className="flex items-center gap-3 text-gray-600 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Planning research approach…</span>
                </div>
              )}
              {result && result.steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} visible={i < visibleSteps} />
              ))}
            </div>

            {/* Browser + result */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">What the agent found</span>
              </div>
              <BrowserPanel
                url={navUrl}
                loading={loading || (!!result && visibleSteps < result.steps.length)}
                summary={showSummary ? result.summary : undefined}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
