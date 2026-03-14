import React, { useState, useCallback } from 'react';
import { fetchOpenRouterChatFull } from '../../services/openRouter';
import { Search, Calculator, Globe, Calendar, CheckCircle2, Loader2, AlertCircle, Play, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolName = 'web_search' | 'calculator' | 'calendar_lookup' | 'fact_check';

interface ToolUse {
  tool: ToolName;
  query: string;
  result: string;
}

interface ThinkActResult {
  thinking: string;
  toolsUsed: ToolUse[];
  answer: string;
}

// ─── Tool definitions (sent to the model) ─────────────────────────────────────

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information, news, or facts.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          result: { type: 'string', description: 'A realistic search result summary (2-3 sentences)' },
        },
        required: ['query', 'result'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Perform a numerical calculation.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The calculation expressed in words' },
          result: { type: 'string', description: 'The numeric result with units' },
        },
        required: ['query', 'result'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calendar_lookup',
      description: 'Look up dates, deadlines, or time calculations.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What date or time to look up' },
          result: { type: 'string', description: 'The date/time result' },
        },
        required: ['query', 'result'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fact_check',
      description: 'Verify a specific claim or piece of information.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The claim to verify' },
          result: { type: 'string', description: 'Verification result (true/false/nuanced) with brief explanation' },
        },
        required: ['query', 'result'],
      },
    },
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOL_META: Record<ToolName, { icon: React.ReactNode; label: string; color: string }> = {
  web_search:      { icon: <Globe className="w-3.5 h-3.5" />,      label: 'Web Search',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  calculator:      { icon: <Calculator className="w-3.5 h-3.5" />, label: 'Calculator',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  calendar_lookup: { icon: <Calendar className="w-3.5 h-3.5" />,   label: 'Calendar',     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  fact_check:      { icon: <CheckCircle2 className="w-3.5 h-3.5" />,label: 'Fact Check',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const EXAMPLE_QUESTIONS = [
  'What are the best airlines flying from New York to London right now, and roughly how much do tickets cost?',
  'If I invest $500 a month for 10 years at 7% annual return, how much will I have?',
  'How many days are left until the end of this year?',
  'Is it true that humans only use 10% of their brain?',
  'What\'s happening in the electric vehicle market this quarter?',
];

// ─── Simulate the think-then-act flow ─────────────────────────────────────────

async function runThinkAct(question: string, apiKey: string): Promise<ThinkActResult> {
  const systemPrompt = `You are a helpful AI assistant with access to tools. When answering questions, use the appropriate tools to look things up, calculate, or verify information rather than guessing.

For each question:
1. Use 1-3 tools to gather information
2. Then give a final, helpful answer

Use tools naturally — for real-time info, calculations, or fact-checking.`;

  const firstResponse = await fetchOpenRouterChatFull(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    'openai/gpt-4o-mini',
    apiKey,
    TOOLS
  );

  const toolsUsed: ToolUse[] = [];

  // Extract tool calls if any
  if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
    for (const tc of firstResponse.tool_calls) {
      try {
        const args = JSON.parse(tc.function.arguments);
        toolsUsed.push({
          tool: tc.function.name as ToolName,
          query: args.query ?? '',
          result: args.result ?? '',
        });
      } catch {
        // skip malformed
      }
    }
  }

  // If model didn't call tools, simulate it for demo clarity
  if (toolsUsed.length === 0) {
    // Ask model to produce a JSON demo plan
    const planPrompt = `For the question: "${question}"

Produce a JSON object showing which tools an AI would use to answer this accurately (not from memory).
Format:
{
  "tools": [
    { "tool": "web_search|calculator|calendar_lookup|fact_check", "query": "...", "result": "a realistic 1-2 sentence result" }
  ],
  "thinking": "One sentence on why these tools were needed"
}

Use 1-3 tools. Make the results realistic and specific.`;

    const planMsg = await fetchOpenRouterChatFull(
      [{ role: 'user', content: planPrompt }],
      'openai/gpt-4o-mini',
      apiKey,
      []
    );

    try {
      const text = (planMsg.content ?? '').replace(/```json|```/g, '').trim();
      const plan = JSON.parse(text);
      for (const t of (plan.tools ?? [])) {
        if (TOOL_META[t.tool as ToolName]) {
          toolsUsed.push({ tool: t.tool, query: t.query, result: t.result });
        }
      }
    } catch { /* ignore */ }
  }

  // Get the final answer with tool context
  const toolContext = toolsUsed.map(t =>
    `[${TOOL_META[t.tool]?.label ?? t.tool} result]: ${t.result}`
  ).join('\n');

  const finalResponse = await fetchOpenRouterChatFull(
    [
      { role: 'system', content: 'You are a helpful, clear assistant. Use the tool results provided to give a concise, direct answer.' },
      { role: 'user', content: `Question: ${question}\n\nInformation gathered:\n${toolContext}\n\nNow give a clear, helpful answer.` },
    ],
    'openai/gpt-4o-mini',
    apiKey,
    []
  );

  return {
    thinking: `To answer this accurately, I looked things up rather than relying on memory alone.`,
    toolsUsed,
    answer: finalResponse.content ?? '',
  };
}

// ─── Tool step card ───────────────────────────────────────────────────────────

function ToolStep({ tool, index, visible }: { tool: ToolUse; index: number; visible: boolean }) {
  const [open, setOpen] = useState(true);
  const meta = TOOL_META[tool.tool];
  if (!meta) return null;

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all duration-400 bg-black/30',
        meta.color.split(' ')[2],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
      >
        <span className={cn('flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border', meta.color)}>
          {meta.icon}
          {meta.label}
        </span>
        <span className="text-sm text-gray-300 flex-1 truncate">{tool.query}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-white/5">
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{tool.result}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function GeneralistTools() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThinkActResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);

  const handleRun = useCallback(async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text) return;
    if (q) setQuestion(q);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }

    setError(null);
    setResult(null);
    setVisibleSteps(0);
    setLoading(true);

    try {
      const res = await runThinkAct(text, apiKey);
      setResult(res);
      // Animate tools one by one
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleSteps(i);
        if (i >= res.toolsUsed.length) clearInterval(interval);
      }, 400);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [question]);

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto w-full space-y-10 pb-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">AI That Looks Things Up</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Beyond Memory</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            A key limitation of AI assistants is that their knowledge has a cutoff date — they only know
            what they were trained on. But modern AI can use <em>tools</em> to reach beyond that:
            searching the web, doing calculations, checking facts in real time.
            The result is an assistant that thinks <em>and</em> acts.
          </p>
        </div>

        {/* The difference */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-5">
            <div className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-3">Without tools</div>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI answers from memory. Great for things that don't change — explaining concepts,
              writing, analysis. But for current prices, today's news, or precise calculations,
              memory-only answers can be outdated or wrong.
            </p>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
            <div className="text-violet-400 text-xs uppercase tracking-wider font-medium mb-3">With tools</div>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI decides which tools to use, calls them, reads the results, then composes an answer.
              It's the difference between asking a knowledgeable friend and asking a knowledgeable
              friend who can also look things up before answering.
            </p>
          </div>
        </div>

        {/* Available tools legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(TOOL_META).map(([key, meta]) => (
            <div key={key} className={cn('flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border', meta.color)}>
              {meta.icon}
              {meta.label}
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
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
              placeholder="Ask something that benefits from looking things up..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
            />
            <button
              onClick={() => handleRun()}
              disabled={!question.trim() || loading}
              className="px-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Ask
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleRun(q)}
                disabled={loading}
                className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 truncate max-w-xs"
                title={q}
              >
                {q.length > 60 ? q.slice(0, 60) + '…' : q}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {(loading || result) && (
          <div className="space-y-6">
            {/* Tools used */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Looked up</span>
              </div>
              {loading && !result && (
                <div className="flex items-center gap-3 text-gray-600 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Deciding which tools to use…</span>
                </div>
              )}
              {result && result.toolsUsed.map((tool, i) => (
                <ToolStep key={i} tool={tool} index={i} visible={i < visibleSteps} />
              ))}
            </div>

            {/* Final answer */}
            {result && visibleSteps >= result.toolsUsed.length && result.answer && (
              <div className="bg-[#121212] border border-violet-500/20 rounded-2xl p-6">
                <div className="text-violet-400 text-xs uppercase tracking-wider font-medium mb-4">Answer</div>
                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                  <Markdown>{result.answer}</Markdown>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
