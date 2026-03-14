import React, { useState } from 'react';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { Plug, FileText, Calendar, Mail, Database, Image, MessageSquare, Play, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── App connectors ───────────────────────────────────────────────────────────

interface Connector {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  capability: string;
  example: string;
}

const CONNECTORS: Connector[] = [
  {
    id: 'files',
    name: 'Your Files',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    description: 'Documents, spreadsheets, PDFs on your computer or cloud drive.',
    capability: 'Read, summarise, and reason over your actual documents — not guesses.',
    example: 'Summarise last quarter\'s sales report and highlight anything unusual.',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Google Calendar, Outlook, or any calendar app.',
    capability: 'See your schedule, find free slots, plan around your commitments.',
    example: 'Find a 90-minute block next week for a deep work session, avoiding my standing meetings.',
  },
  {
    id: 'email',
    name: 'Email',
    icon: <Mail className="w-5 h-5" />,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'Gmail, Outlook, or your email provider.',
    capability: 'Triage, summarise threads, and draft responses — with full context.',
    example: 'Summarise unread emails from this week and flag anything that needs a reply today.',
  },
  {
    id: 'database',
    name: 'Data & Spreadsheets',
    icon: <Database className="w-5 h-5" />,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    description: 'Google Sheets, Airtable, Notion databases, or SQL.',
    capability: 'Query, analyse, and surface insights from your structured data.',
    example: 'Which of our clients had the highest support ticket volume last month?',
  },
  {
    id: 'images',
    name: 'Images & Docs',
    icon: <Image className="w-5 h-5" />,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    description: 'Photos, scanned receipts, presentations, PDFs.',
    capability: 'Read and reason over visual content — receipts, diagrams, contracts.',
    example: 'Extract the key terms from this scanned contract and list any red flags.',
  },
  {
    id: 'messages',
    name: 'Slack / Teams',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    description: 'Slack workspaces, Microsoft Teams channels.',
    capability: 'Catch up on conversations, surface decisions, draft replies.',
    example: 'What did the team decide about the Q3 launch in this Slack thread?',
  },
];

// ─── Scenario builder ─────────────────────────────────────────────────────────

function ConnectorCard({ connector, selected, onToggle }: {
  connector: Connector;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-200',
        selected
          ? cn(connector.color, 'shadow-md')
          : 'bg-[#121212] border-white/10 hover:border-white/20 text-gray-400'
      )}
    >
      {selected && (
        <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-current opacity-80" />
      )}
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', selected ? 'bg-current/10' : 'bg-white/5')}>
        <span className={selected ? 'text-current' : 'text-gray-500'}>{connector.icon}</span>
      </div>
      <div>
        <div className={cn('text-sm font-medium', selected ? 'text-current' : 'text-gray-300')}>{connector.name}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-snug">{connector.description}</div>
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistConnectors() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['files', 'calendar']));
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedConnectors = CONNECTORS.filter(c => selected.has(c.id));

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }
    if (selected.size === 0) {
      setError('Select at least one data source above.');
      return;
    }

    setError(null);
    setResult('');
    setLoading(true);

    const connectorList = selectedConnectors.map(c => `• ${c.name}: ${c.capability}`).join('\n');
    const userScenario = scenario.trim() || 'Help me start my work day with a useful briefing.';

    const prompt = `You are a personal AI assistant with access to the following data sources:
${connectorList}

The user says: "${userScenario}"

Respond as if you genuinely have access to these sources. Invent realistic but plausible content from each connected source (e.g. mention a realistic email subject, a made-up meeting name, a sample file name). Show how having all these sources connected makes you dramatically more useful than answering from memory alone.

Be concrete and practical. Use markdown with brief sections. Keep it under 300 words.`;

    try {
      const response = await fetchOpenRouterChat(
        [{ role: 'user', content: prompt }],
        'openai/gpt-4o-mini',
        apiKey
      );
      setResult(response);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-10 pb-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Plug className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Connect Your World</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">AI That Knows Your Data</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            A disconnected AI assistant is like a brilliant colleague who has never seen your work.
            When AI can read your actual files, calendar, and messages, its usefulness goes from
            impressive to indispensable. This is what the "connector" revolution is about.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">How connectors work</h3>
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
            {[
              { label: 'Your apps & data', sub: 'Calendar, email, files…', color: 'text-gray-300 border-white/20 bg-white/5' },
              { label: 'Secure connector', sub: 'Permission-gated bridge', color: 'text-violet-300 border-violet-500/20 bg-violet-500/10' },
              { label: 'AI assistant', sub: 'Reads, reasons, acts', color: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' },
              { label: 'Your request', sub: 'In plain language', color: 'text-white border-white/20 bg-white/5' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className={cn('flex-1 p-3 rounded-xl border text-center', step.color)}>
                  <div className="font-medium">{step.label}</div>
                  <div className="text-xs opacity-60 mt-1">{step.sub}</div>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-700 shrink-0 hidden md:block" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4">
            No data leaves without permission. Each connector is explicitly authorised and can be revoked at any time.
          </p>
        </div>

        {/* Connector picker */}
        <div>
          <h3 className="text-white font-semibold mb-4">Connect your sources <span className="text-gray-500 font-normal text-sm">(select any)</span></h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONNECTORS.map(c => (
              <ConnectorCard
                key={c.id}
                connector={c}
                selected={selected.has(c.id)}
                onToggle={() => toggle(c.id)}
              />
            ))}
          </div>
        </div>

        {/* What each gives you */}
        {selectedConnectors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">What you gain</p>
            {selectedConnectors.map(c => (
              <div key={c.id} className="flex gap-3 items-start">
                <span className={cn('flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs', c.color)}>{c.icon}</span>
                <p className="text-sm text-gray-400 leading-relaxed">
                  <span className="text-gray-200 font-medium">{c.name}:</span> {c.capability}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Try it */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">See it in action</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder={selectedConnectors[0]?.example ?? 'What would you like your AI assistant to do?'}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {selectedConnectors.slice(0, 3).map(c => (
                <button
                  key={c.id}
                  onClick={() => setScenario(c.example)}
                  className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors truncate max-w-xs"
                >
                  {c.example}
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

          <button
            onClick={handleGenerate}
            disabled={loading || selected.size === 0}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Ask your connected assistant
          </button>

          {result && (
            <div className="bg-[#121212] border border-violet-500/20 rounded-2xl p-6">
              <div className="text-violet-400 text-xs uppercase tracking-wider font-medium mb-4">
                Your assistant (with {selectedConnectors.length} source{selectedConnectors.length !== 1 ? 's' : ''} connected)
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <Markdown>{result}</Markdown>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
