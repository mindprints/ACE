import React, { useState, useRef, useEffect } from 'react';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { Users, Search, FileText, CheckCircle, Play, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Agent definitions ────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  systemPrompt: string;
}

const AGENTS: Agent[] = [
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Gathers information',
    description: 'Digs into the question — finds facts, context, and relevant background.',
    icon: <Search className="w-5 h-5" />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    systemPrompt: `You are a thorough research specialist. Your job is to gather relevant information, facts, and context on the given topic.

- Present 4-6 key findings in bullet points
- Include specific figures, names, or examples where relevant
- Note any important nuances or contradictions
- Be factual and informative, not opinionated
- Keep it under 200 words`,
  },
  {
    id: 'writer',
    name: 'Writer',
    role: 'Drafts the deliverable',
    description: 'Takes the research and turns it into a clear, polished piece of writing.',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    systemPrompt: `You are a skilled writer who turns research into clear, engaging content.

- Use the research provided to write a well-structured response
- Write for a general, intelligent audience — no jargon
- Aim for clarity and impact over length
- Use a warm, professional tone
- Keep it under 250 words`,
  },
  {
    id: 'critic',
    name: 'Critic',
    role: 'Sharpens the output',
    description: 'Reviews the draft and identifies one concrete improvement to make it better.',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    systemPrompt: `You are a sharp editor and critical thinker.

Review the draft below and:
1. Identify exactly ONE significant improvement (clarity, accuracy, missing angle, or tone)
2. Explain why this improvement matters
3. Provide the revised version with the improvement applied

Be specific and constructive. Keep the critique to 2-3 sentences, then provide the improved version.`,
  },
];

interface AgentMessage {
  agentId: string;
  content: string;
  status: 'pending' | 'active' | 'done';
}

const EXAMPLE_TASKS = [
  'Write a brief guide to negotiating a pay rise — what to prepare, what to say, and what to avoid.',
  'Explain the pros and cons of remote work for both employees and employers.',
  'Create a quick overview of mindfulness — what it is, the evidence for it, and how to start.',
  'Write a practical guide to giving effective feedback to a team member.',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistTeams() {
  const [task, setTask] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRun = async (text?: string) => {
    const t = (text ?? task).trim();
    if (!t) return;
    if (text) setTask(text);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }

    setError(null);
    setRunning(true);

    // Initialize all agents as pending
    let current: AgentMessage[] = AGENTS.map(a => ({ agentId: a.id, content: '', status: 'pending' as const }));
    setMessages([...current]);

    try {
      let context = t;

      for (let i = 0; i < AGENTS.length; i++) {
        const agent = AGENTS[i];

        // Mark this agent as active
        current = current.map((m, idx) => idx === i ? { ...m, status: 'active' as const } : m);
        setMessages([...current]);

        let userMessage = '';
        if (agent.id === 'researcher') {
          userMessage = `Research this topic thoroughly: ${t}`;
        } else if (agent.id === 'writer') {
          userMessage = `Write a response about: "${t}"\n\nResearch gathered:\n${context}`;
        } else {
          userMessage = `Review and improve this draft about "${t}":\n\n${context}`;
        }

        const response = await fetchOpenRouterChat(
          [
            { role: 'system', content: agent.systemPrompt },
            { role: 'user', content: userMessage },
          ],
          'openai/gpt-4o-mini',
          apiKey
        );

        context = response;

        // Mark done
        current = current.map((m, idx) => idx === i ? { ...m, content: response, status: 'done' as const } : m);
        setMessages([...current]);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setRunning(false);
    }
  };

  const agentFor = (id: string) => AGENTS.find(a => a.id === id)!;

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-6">

      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-violet-400" />
          <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">AI Teams at Work</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Specialist Agents, Better Results</h2>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          A single AI asked to research, write, <em>and</em> critique will often cut corners.
          Split the work between specialist agents — each focused on one job — and the output improves dramatically.
          This mirrors how teams of people work.
        </p>
      </div>

      {/* Agent pipeline */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
        {AGENTS.map((agent, i) => (
          <React.Fragment key={agent.id}>
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm', agent.color)}>
              {agent.icon}
              <div>
                <div className="font-medium leading-none">{agent.name}</div>
                <div className="text-xs opacity-60 mt-0.5">{agent.role}</div>
              </div>
            </div>
            {i < AGENTS.length - 1 && <ArrowRight className="w-4 h-4 text-gray-700 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Task input */}
      <div className="flex-shrink-0 bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-300">Give the team a task</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !running) handleRun(); }}
            disabled={running}
            placeholder="Ask for a piece of writing, an explanation, a guide…"
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
          />
          <button
            onClick={() => handleRun()}
            disabled={running || !task.trim()}
            className="px-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Working…' : 'Start'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TASKS.map(t => (
            <button
              key={t}
              onClick={() => { if (!running) handleRun(t); }}
              disabled={running}
              className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 truncate max-w-sm"
              title={t}
            >
              {t.length > 60 ? t.slice(0, 60) + '…' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Agent outputs */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.length === 0 && !running && (
          <div className="flex items-center justify-center h-32 text-gray-700 text-sm italic">
            Start the team to see each agent's contribution
          </div>
        )}

        {messages.map((msg) => {
          const agent = agentFor(msg.agentId);
          return (
            <div
              key={msg.agentId}
              className={cn(
                'flex gap-4 p-5 rounded-xl border transition-all duration-500',
                msg.status === 'active'  && 'bg-white/5 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]',
                msg.status === 'done'    && cn('bg-black/20', agent.color.split(' ')[2]),
                msg.status === 'pending' && 'bg-black/10 border-white/5 opacity-40',
              )}
            >
              <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', agent.color)}>
                {msg.status === 'active'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : agent.icon
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={cn('font-semibold text-sm', agent.color.split(' ')[0])}>{agent.name}</h3>
                  <span className="text-xs text-gray-600">{agent.role}</span>
                  {msg.status === 'active' && (
                    <span className="text-xs text-violet-400 animate-pulse font-medium">Working…</span>
                  )}
                </div>
                {msg.content ? (
                  <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : msg.status === 'active' ? (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm italic">Waiting for previous step…</p>
                )}
              </div>
            </div>
          );
        })}

        {!running && messages.some(m => m.status === 'done') && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-violet-300 font-semibold">Three passes, one result.</span>{' '}
              Each agent received the previous agent's output as its input — building on the work, not repeating it.
              This handoff pattern means no single agent has to be perfect at everything.
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
