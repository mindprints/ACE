import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Globe, Play, Loader2, AlertCircle, Eye, MousePointer, Keyboard,
  ArrowRight, Shield, MonitorCheck, Navigation, Layers, ChevronDown,
  ChevronUp, CheckCircle2, Clock, Cpu, Search, Terminal
} from 'lucide-react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import { cn } from './Layout';
import Markdown from 'react-markdown';
import { useContentPack } from '../context/ContentPackContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'navigate' | 'observe' | 'click' | 'type' | 'extract' | 'complete';

interface AgentAction {
  type: ActionType;
  description: string;
  detail?: string;
  result?: string;
}

interface AgentStep {
  phase: 'plan' | 'execute' | 'done';
  actions: AgentAction[];
  summary?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  navigate:  <Navigation className="w-3.5 h-3.5" />,
  observe:   <Eye className="w-3.5 h-3.5" />,
  click:     <MousePointer className="w-3.5 h-3.5" />,
  type:      <Keyboard className="w-3.5 h-3.5" />,
  extract:   <Search className="w-3.5 h-3.5" />,
  complete:  <CheckCircle2 className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<ActionType, string> = {
  navigate: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  observe:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  click:    'text-purple-400 bg-purple-500/10 border-purple-500/20',
  type:     'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  extract:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  complete: 'text-green-400 bg-green-500/10 border-green-500/20',
};

// EXAMPLE_TASKS moved to content packs — consumed via useContentPack() in the component body

// ─── Simulated Agent Execution ────────────────────────────────────────────────

// We simulate the browser-use agentic loop locally (since we can't run
// a real Playwright browser in the browser), but use the real LLM to:
// 1. Plan the action sequence
// 2. Generate a realistic extraction result

async function planAndSimulate(task: string, apiKey: string): Promise<AgentStep> {
  const planningPrompt = `You are simulating a browser-use AI agent. Given the task below, respond ONLY with a JSON object (no markdown fences).

Task: "${task}"

Respond with this exact shape:
{
  "actions": [
    { "type": "navigate",  "description": "...", "detail": "https://..." },
    { "type": "observe",   "description": "...", "detail": "..." },
    { "type": "click",     "description": "...", "detail": "..." },
    { "type": "extract",   "description": "...", "detail": "..." },
    { "type": "complete",  "description": "Task complete", "detail": "..." }
  ],
  "summary": "A 3-5 sentence paragraph of what the agent found, written as if it actually browsed the site. Be specific and realistic — include plausible article titles, repo names, model names, or whatever is appropriate for the task."
}

Rules:
- 4-7 actions total. Always start with navigate, always end with complete.
- "detail" for navigate must be a real URL.
- "detail" for extract/complete should describe what was found.
- summary must read like a real result, not a placeholder.
- Valid action types: navigate, observe, click, type, extract, complete.`;

  const msg = await fetchOpenRouterChatFull(
    [{ role: 'user', content: planningPrompt }],
    'openai/gpt-4o-mini',
    apiKey,
    []
  );

  let parsed: { actions: AgentAction[]; summary: string };
  try {
    const text = (msg.content ?? '').replace(/```json|```/g, '').trim();
    parsed = JSON.parse(text);
  } catch {
    // Fallback if parsing fails
    parsed = {
      actions: [
        { type: 'navigate', description: 'Opening target website', detail: 'https://example.com' },
        { type: 'observe',  description: 'Reading page structure', detail: 'DOM loaded' },
        { type: 'extract',  description: 'Extracting relevant content', detail: 'Found results' },
        { type: 'complete', description: 'Task complete', detail: 'Done' },
      ],
      summary: 'The agent completed the task and extracted the requested information.',
    };
  }

  return { phase: 'done', actions: parsed.actions, summary: parsed.summary };
}

// ─── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({ action, index, visible }: { action: AgentAction; index: number; visible: boolean }) {
  const [open, setOpen] = useState(false);
  const colors = ACTION_COLORS[action.type] ?? ACTION_COLORS.observe;

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all duration-500',
        colors.split(' ')[2], // border color
        'bg-black/30',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => action.detail && setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          action.detail ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
        )}
      >
        {/* Step number */}
        <span className="text-[10px] text-gray-600 font-mono w-4 shrink-0">{index + 1}</span>

        {/* Type badge */}
        <span className={cn('flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-md border shrink-0', colors)}>
          {ACTION_ICONS[action.type]}
          {action.type}
        </span>

        {/* Description */}
        <span className="text-sm text-gray-300 flex-1 truncate">{action.description}</span>

        {action.detail && (
          open ? <ChevronUp className="w-3 h-3 text-gray-600 shrink-0" />
               : <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />
        )}
      </button>

      {open && action.detail && (
        <div className="px-4 pb-3 border-t border-white/5">
          <p className="text-xs font-mono text-gray-500 mt-2 leading-relaxed">{action.detail}</p>
        </div>
      )}
    </div>
  );
}

// ─── Browser Window ───────────────────────────────────────────────────────────

function BrowserWindow({ url, loading, summary }: { url?: string; loading: boolean; summary?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0e0e0e]">
      {/* Chrome bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#141414] border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-black/40 rounded-md px-3 py-1 flex items-center gap-2">
          {loading && <Loader2 className="w-3 h-3 text-gray-500 animate-spin shrink-0" />}
          <span className="text-xs font-mono text-gray-500 truncate">
            {url ?? 'about:blank'}
          </span>
        </div>
        <MonitorCheck className="w-4 h-4 text-gray-600" />
      </div>

      {/* Viewport */}
      <div className="min-h-[180px] p-6 flex items-center justify-center">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <Globe className="w-8 h-8 text-gray-700" />
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin absolute -bottom-1 -right-1" />
              </div>
            </div>
            <p className="text-xs text-gray-600 font-mono">Agent is browsing...</p>
          </div>
        ) : summary ? (
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 w-full">
            <Markdown>{summary}</Markdown>
          </div>
        ) : (
          <div className="text-center">
            <Globe className="w-8 h-8 text-gray-800 mx-auto mb-2" />
            <p className="text-xs text-gray-700 font-mono">No page loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Demo ────────────────────────────────────────────────────────────────

function BrowserUseDemo() {
  const { pack } = useContentPack();
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentStep | null>(null);
  const [visibleActions, setVisibleActions] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate actions one by one after result arrives
  useEffect(() => {
    if (!result) return;
    setVisibleActions(0);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setVisibleActions(i);
      // Update browser URL bar when we hit a navigate action
      const navAction = result.actions.find(a => a.type === 'navigate');
      if (navAction?.detail && i === 1) setCurrentUrl(navAction.detail);
      if (i >= result.actions.length && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, 350);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [result]);

  const handleRun = useCallback(async (taskText?: string) => {
    const t = (taskText ?? task).trim();
    if (!t) return;
    if (taskText) setTask(taskText);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    setResult(null);
    setCurrentUrl(undefined);
    setVisibleActions(0);
    setLoading(true);

    try {
      const step = await planAndSimulate(t, apiKey);
      setResult(step);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [task]);

  const navigateUrl = result?.actions.find(a => a.type === 'navigate')?.detail;

  return (
    <div className="space-y-5">
      {/* Task input */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
            placeholder="Give the agent a browsing task..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono"
          />
          <button
            onClick={() => handleRun()}
            disabled={!task.trim() || loading}
            className="px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Play className="w-4 h-4" />
            }
            Run Agent
          </button>
        </div>

        {/* Example tasks */}
        <div className="flex flex-wrap gap-2">
          {pack.browserUse.exampleTasks.map(t => (
            <button
              key={t}
              onClick={() => handleRun(t)}
              disabled={loading}
              className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed truncate max-w-[320px] font-mono"
              title={t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Two-column layout: action trace + browser window */}
      {(loading || result) && (
        <div className="grid md:grid-cols-2 gap-5">

          {/* Action trace */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Agent action trace</span>
            </div>

            {loading && !result && (
              <div className="flex items-center gap-3 text-gray-600 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-mono">Planning action sequence...</span>
              </div>
            )}

            {result && result.actions.map((action, i) => (
              <ActionRow
                key={i}
                action={action}
                index={i}
                visible={i < visibleActions}
              />
            ))}
          </div>

          {/* Simulated browser */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Simulated browser viewport</span>
            </div>
            <BrowserWindow
              url={navigateUrl}
              loading={loading || (!!result && visibleActions < result.actions.length)}
              summary={result && visibleActions >= result.actions.length ? result.summary : undefined}
            />
          </div>
        </div>
      )}

      {/* Agentic loop explainer — shown after first run */}
      {result && visibleActions >= result.actions.length && (
        <div className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 flex items-start gap-3">
          <Cpu className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            <span className="text-gray-300">Agentic loop:</span>{' '}
            observe → plan → act → observe… The agent ran {result.actions.length} actions.
            Each step, it receives a fresh DOM snapshot or screenshot, decides the next action,
            and feeds the result back into its context before deciding again.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BrowserUse() {
  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Browser Use & Computer Use</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Agents that can see and navigate the web represent a qualitative leap from code generation.
            Instead of answering questions about the world, they can <em>act</em> in it — autonomously
            browsing, clicking, filling forms, and extracting information.
          </p>
        </div>

        {/* Two Flavours */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-white">Two Flavours of Agent Control</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-blue-500/20 rounded-2xl p-6">
              <Globe className="w-8 h-8 text-blue-400 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">Browser Use <span className="text-xs text-blue-500 font-mono ml-2">web only</span></h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                A Playwright or Selenium backend gives the model a live browser. It receives
                the page DOM and/or a screenshot, then emits structured actions: <code className="text-blue-300 text-xs">navigate</code>,{' '}
                <code className="text-blue-300 text-xs">click</code>, <code className="text-blue-300 text-xs">type</code>,{' '}
                <code className="text-blue-300 text-xs">extract</code>. The new Perplexity Comet browser is also pushing boundaries with native agentic integration.
              </p>
              <div className="text-xs font-mono text-gray-600">pip install browser-use playwright</div>
            </div>
            <div className="bg-[#121212] border border-purple-500/20 rounded-2xl p-6">
              <MonitorCheck className="w-8 h-8 text-purple-400 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">Computer Use <span className="text-xs text-purple-500 font-mono ml-2">full desktop</span></h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The model controls mouse and keyboard across <em>any</em> application —
                not just browsers. Anthropic's computer-use API, OpenAI's Operator, and the Google Antigravity plugin
                are the leading implementations. Significantly more powerful, and riskier.
              </p>
              <div className="text-xs font-mono text-gray-600">anthropic.beta.computer_use_20241022</div>
            </div>
          </div>
        </section>

        {/* Agentic Loop */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-white mb-6">The Agentic Loop</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Unlike a single completion, a browser agent runs in a continuous loop until the task is done
            or it decides it cannot proceed. Each iteration feeds the previous action's result back as context.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-mono">
            {[
              { label: 'Observe', sub: 'DOM / screenshot', color: 'amber' },
              { label: 'Plan',    sub: 'next action',      color: 'blue'  },
              { label: 'Act',     sub: 'click / type / navigate', color: 'purple' },
              { label: 'Result',  sub: 'back to observe',  color: 'emerald' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className={cn(
                  'p-4 rounded-xl border text-center w-full md:w-auto md:flex-1',
                  step.color === 'amber'   && 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                  step.color === 'blue'    && 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                  step.color === 'purple'  && 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                  step.color === 'emerald' && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                )}>
                  {step.label}
                  <div className="text-xs opacity-60 mt-1">{step.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-700 hidden md:block shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center text-xs text-gray-700 font-mono mt-4">↩ loops until task_complete or max_steps reached</p>
        </section>

        {/* Safety Note */}
        <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex gap-4">
          <Shield className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-300 font-semibold mb-2">Safety Considerations</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Always run browser agents in a <strong className="text-gray-300">sandboxed environment</strong> (Docker or a dedicated VM).
              For computer-use demos, show human-in-the-loop confirmation for each action — especially in a classroom.
              An unguarded agent with write access can submit forms, make purchases, or delete data.
              The <code className="text-amber-300 text-xs">browser-use</code> library supports a{' '}
              <code className="text-amber-300 text-xs">human_in_the_loop=True</code> flag for exactly this reason.
            </p>
          </div>
        </section>

        {/* Interactive Demo */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-2xl font-semibold text-white">Live Agent Demo</h3>
          </div>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Give the agent a browsing task. It will plan a realistic action sequence, animate through
            each step, and show you what it found — simulating the{' '}
            <span className="font-mono text-gray-400">observe → plan → act</span> loop.
            The LLM generates both the action plan and the extracted result.
          </p>
          <BrowserUseDemo />
        </section>

        {/* Real-world Usage */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-5 h-5 text-gray-400" />
            <h3 className="text-xl font-semibold text-white">Running It for Real</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            The production <code className="text-gray-300 text-xs">browser-use</code> library wires all of this together in ~10 lines of Python:
          </p>
          <pre className="bg-black/60 border border-white/10 rounded-xl p-5 text-xs font-mono text-gray-400 overflow-x-auto leading-relaxed">
{`from browser_use import Agent
from langchain_openai import ChatOpenAI   # or any LangChain LLM

agent = Agent(
    task="Go to news.ycombinator.com, find the top AI story, summarise it",
    llm=ChatOpenAI(model="gpt-4o", base_url="https://openrouter.ai/api/v1"),
)

result = await agent.run()
print(result.final_result())`}
          </pre>
          <p className="text-gray-600 text-xs font-mono">
            Under the hood: Playwright launches a real Chromium instance. The agent sees the live DOM,
            decides actions, and loops until it calls <code className="text-gray-500">done()</code>.
          </p>
        </section>

      </div>
    </div>
  );
}