import React, { useState } from 'react';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { TrendingUp, Play, Loader2, AlertCircle, ArrowRight, Zap, Users, Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Workflow stages ───────────────────────────────────────────────────────────

type Stage = 'manual' | 'augmented' | 'delegated';

interface WorkflowStage {
  id: Stage;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  characteristics: string[];
}

const STAGES: WorkflowStage[] = [
  {
    id: 'manual',
    label: 'Manual',
    tagline: 'You do everything',
    icon: <Users className="w-5 h-5" />,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    description: 'Every task is owned and executed by a person. Expertise lives in people\'s heads. Quality depends on who\'s doing it and how much time they have.',
    characteristics: [
      'Consistent quality requires consistent people',
      'Bottlenecks when the expert is busy',
      'Hard to scale without hiring',
      'Institutional knowledge leaves when people leave',
    ],
  },
  {
    id: 'augmented',
    label: 'AI-Augmented',
    tagline: 'You lead, AI assists',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    description: 'People still own tasks and make decisions, but AI handles the heavy lifting — first drafts, research, summarising, formatting. Your output doubles without working twice as hard.',
    characteristics: [
      'Much faster first drafts and research',
      'Easier to maintain quality with less effort',
      'Humans review and approve everything',
      'Good for most knowledge work today',
    ],
  },
  {
    id: 'delegated',
    label: 'Agent-Driven',
    tagline: 'You set goals, AI executes',
    icon: <Bot className="w-5 h-5" />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'You define the outcome; AI agents handle the steps. Multi-step tasks — research → draft → review → deliver — run without human intervention at each stage. Oversight happens at the end, not throughout.',
    characteristics: [
      'Tasks run in the background, in parallel',
      'Scale without proportional headcount',
      'Humans set direction and review outcomes',
      'Still early — trust and oversight matter',
    ],
  },
];

// ─── Industry examples ─────────────────────────────────────────────────────────

const INDUSTRY_EXAMPLES = [
  {
    sector: 'Marketing',
    manual: 'A copywriter researches, drafts, and edits every campaign asset by hand.',
    augmented: 'AI generates first drafts; the copywriter edits, refines, and approves.',
    delegated: 'An AI agent researches the brief, drafts copy, checks brand guidelines, and delivers a ready-to-review pack.',
  },
  {
    sector: 'HR',
    manual: 'An HR manager reads every CV, writes every job description, schedules every interview.',
    augmented: 'AI screens CVs and suggests shortlists; HR reviews and decides.',
    delegated: 'An AI agent manages the full screening pipeline and schedules interviews, with HR approving at key gates.',
  },
  {
    sector: 'Finance',
    manual: 'An analyst reads reports, extracts numbers, builds models, and writes commentary.',
    augmented: 'AI extracts data and generates draft commentary; analyst reviews and finalises.',
    delegated: 'An AI agent monitors reports, flags anomalies, drafts analysis, and delivers a briefing ready for sign-off.',
  },
  {
    sector: 'Customer Support',
    manual: 'An agent reads every ticket, researches answers, and writes individual replies.',
    augmented: 'AI drafts replies; human agents review and send.',
    delegated: 'An AI agent handles routine queries end-to-end, escalating only complex or sensitive cases.',
  },
];

// ─── Stage card ────────────────────────────────────────────────────────────────

function StageCard({ stage, active, onClick }: { stage: WorkflowStage; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left p-5 rounded-2xl border transition-all duration-200',
        active ? cn(stage.color, 'shadow-lg') : 'bg-[#121212] border-white/10 hover:border-white/20'
      )}
    >
      <div className={cn('flex items-center gap-2 mb-3', active ? stage.color.split(' ')[0] : 'text-gray-400')}>
        {stage.icon}
        <span className="font-semibold text-sm">{stage.label}</span>
      </div>
      <div className={cn('text-xs font-medium mb-2', active ? 'opacity-80' : 'text-gray-500')}>{stage.tagline}</div>
      <p className={cn('text-xs leading-relaxed', active ? 'text-gray-300' : 'text-gray-600')}>{stage.description}</p>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistEvolution() {
  const [activeStage, setActiveStage] = useState<Stage>('augmented');
  const [selectedSector, setSelectedSector] = useState('Marketing');
  const [customTask, setCustomTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [evolution, setEvolution] = useState('');
  const [error, setError] = useState<string | null>(null);

  const stage = STAGES.find(s => s.id === activeStage)!;
  const example = INDUSTRY_EXAMPLES.find(e => e.sector === selectedSector)!;

  const handleGenerateEvolution = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }
    if (!customTask.trim()) {
      setError('Describe a task you do regularly.');
      return;
    }

    setError(null);
    setEvolution('');
    setLoading(true);

    const prompt = `A person has described a task they do regularly: "${customTask}"

Show how this task evolves across three stages of AI adoption. Be concrete and specific to their actual task. Use markdown with three short sections.

**Manual (today for many):** How this task is done without AI — what's tedious, what's slow.

**AI-Augmented (the near-term):** How AI assists — what gets faster, what the person still controls. Give a specific example of what the AI would do.

**Agent-Driven (the direction we're heading):** How an AI agent could handle most of the steps — what the person delegates vs what they still own. Be realistic about what's possible now vs soon.

Keep each section to 3-4 sentences. Be practical and grounded.`;

    try {
      const response = await fetchOpenRouterChat(
        [{ role: 'user', content: prompt }],
        'openai/gpt-4o-mini',
        apiKey
      );
      setEvolution(response);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">The New Way of Working</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Three Stages of Adoption</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            AI doesn't transform work overnight. Every industry and every person moves through stages —
            from doing everything manually, to using AI as a powerful assistant, to delegating multi-step
            tasks to AI agents entirely. Where you are on this spectrum is a choice.
          </p>
        </div>

        {/* Stage cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {STAGES.map((s, i) => (
            <React.Fragment key={s.id}>
              <StageCard stage={s} active={activeStage === s.id} onClick={() => setActiveStage(s.id)} />
              {i < STAGES.length - 1 && (
                <div className="hidden md:flex items-center justify-center -mx-2">
                  <ArrowRight className="w-5 h-5 text-gray-700" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Active stage detail */}
        <div className={cn('rounded-2xl border p-6 space-y-4', stage.color)}>
          <div className="flex items-center gap-2">
            {stage.icon}
            <h3 className="text-white font-semibold">{stage.label}: {stage.tagline}</h3>
          </div>
          <ul className="space-y-2">
            {stage.characteristics.map(c => (
              <li key={c} className="flex items-start gap-2 text-sm text-gray-300">
                <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', stage.color.split(' ')[1].replace('/10', '/60'))} />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Industry examples */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Real examples by sector</h3>
            <div className="flex gap-2 flex-wrap">
              {INDUSTRY_EXAMPLES.map(e => (
                <button
                  key={e.sector}
                  onClick={() => setSelectedSector(e.sector)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-colors',
                    selectedSector === e.sector
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300'
                  )}
                >
                  {e.sector}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {STAGES.map(s => (
              <div
                key={s.id}
                className={cn(
                  'rounded-xl border p-4',
                  activeStage === s.id ? cn(s.color) : 'bg-[#121212] border-white/10'
                )}
              >
                <div className={cn('text-xs font-medium uppercase tracking-wider mb-2', activeStage === s.id ? s.color.split(' ')[0] : 'text-gray-600')}>
                  {s.label}
                </div>
                <p className={cn('text-xs leading-relaxed', activeStage === s.id ? 'text-gray-300' : 'text-gray-500')}>
                  {example[s.id]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Your task */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Map your own work</h3>
          <p className="text-gray-500 text-sm">
            Describe something you do regularly — a report, a process, a type of communication.
            See how it looks across all three stages.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={customTask}
              onChange={e => setCustomTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateEvolution(); }}
              placeholder="e.g. I write a weekly summary email for my team every Friday"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
            />
            <button
              onClick={handleGenerateEvolution}
              disabled={loading || !customTask.trim()}
              className="px-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Map it
            </button>
          </div>

          {evolution && (
            <div className="bg-[#121212] border border-violet-500/20 rounded-2xl p-6">
              <div className="text-violet-400 text-xs uppercase tracking-wider font-medium mb-4">Your task across the three stages</div>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <Markdown>{evolution}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Closing insight */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3">The honest picture</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Most people and organisations are currently somewhere between Manual and AI-Augmented.
            The Agent-Driven stage is real but still early — it works well for defined, repetitive tasks
            and requires careful oversight for anything consequential.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            The highest-value skill in this environment isn't learning to use a specific AI tool —
            it's developing judgment about <em>when to trust AI</em>, <em>what to delegate</em>, and
            <em> how to set up the right guardrails</em>. That judgment is what this curriculum is for.
          </p>
        </div>

      </div>
    </div>
  );
}
