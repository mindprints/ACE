import React, { useState } from 'react';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { Wrench, Play, Loader2, AlertCircle, Copy, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Form fields ──────────────────────────────────────────────────────────────

interface BriefField {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  value: string;
}

const DEFAULT_FIELDS: BriefField[] = [
  {
    id: 'purpose',
    label: 'What is this assistant for?',
    description: 'Define the primary job this AI should do for you.',
    placeholder: 'e.g. Help me manage client communications and draft professional emails',
    value: 'Help me manage client communications, summarise long threads, and draft polished replies.',
  },
  {
    id: 'audience',
    label: 'Who do I interact with?',
    description: 'Who the AI will be helping you communicate with or serve.',
    placeholder: 'e.g. Mostly executives and technical leads at enterprise companies',
    value: 'Executives and department heads at mid-to-large businesses. They value brevity.',
  },
  {
    id: 'tone',
    label: 'What\'s my preferred tone?',
    description: 'How should the AI write and communicate on your behalf?',
    placeholder: 'e.g. Professional but warm, concise, no jargon',
    value: 'Professional, direct, and friendly — no corporate-speak or filler phrases.',
  },
  {
    id: 'doNot',
    label: 'What should it never do?',
    description: 'Hard limits — things the AI must avoid.',
    placeholder: 'e.g. Never make commitments on my behalf, never share pricing without asking me',
    value: 'Never commit to timelines or pricing. Never share internal details. Always flag uncertainty.',
  },
  {
    id: 'priority',
    label: 'What matters most?',
    description: 'If the AI has to trade something off, what wins?',
    placeholder: 'e.g. Speed matters more than perfection; I can always edit',
    value: 'Accuracy over speed. When in doubt, ask rather than assume.',
  },
];

// ─── Why each section matters ─────────────────────────────────────────────────

const WHY_CARDS = [
  { label: 'Purpose', why: 'Without a clear purpose, AI generalises. A focused brief makes it an expert at the specific thing you need.' },
  { label: 'Audience', why: 'The right tone for a CEO is different from the right tone for a developer. Context about who you\'re dealing with changes everything.' },
  { label: 'Tone', why: 'AI will default to whatever feels "neutral." Your brief lets it sound like you — not a corporate chatbot.' },
  { label: 'Limits', why: 'This is the most important section. Clear limits prevent the mistakes that erode trust. Know your non-negotiables.' },
  { label: 'Priority', why: 'Tradeoffs are inevitable. Telling the AI what matters most prevents it from optimising for the wrong thing.' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistBrief() {
  const [fields, setFields] = useState<BriefField[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [demoQuestion] = useState('A client just emailed asking why their project is delayed. How should I respond?');

  const updateField = (id: string, value: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
  };

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }
    setError(null);
    setGeneratedBrief('');
    setDemoResponse('');
    setLoading(true);

    const filledFields = fields.filter(f => f.value.trim());
    if (filledFields.length === 0) {
      setError('Fill in at least one field to generate a brief.');
      setLoading(false);
      return;
    }

    const briefPrompt = `You are helping someone create a clear, useful briefing document for their AI assistant.

Based on the following answers, write a concise AI assistant brief in markdown. It should:
- Be written in second person directed at the AI ("You are helping...")
- Be structured with short labelled sections
- Be practical and specific — not generic
- Be under 250 words

User's answers:
${filledFields.map(f => `**${f.label}**: ${f.value}`).join('\n\n')}

Write the brief now:`;

    try {
      const brief = await fetchOpenRouterChat(
        [{ role: 'user', content: briefPrompt }],
        'openai/gpt-4o-mini',
        apiKey
      );
      setGeneratedBrief(brief);

      // Now demo it
      const demoPrompt = `${brief}\n\n---\n\nUser request: "${demoQuestion}"\n\nRespond according to the brief above:`;
      const demo = await fetchOpenRouterChat(
        [{ role: 'user', content: demoPrompt }],
        'openai/gpt-4o-mini',
        apiKey
      );
      setDemoResponse(demo);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto w-full space-y-10 pb-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Brief Your Assistant</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Set the Rules of Engagement</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            The most powerful thing you can do with an AI assistant isn't finding the cleverest prompt —
            it's writing a clear brief that tells the AI who you are, who it's serving, what it must
            never do, and what a great outcome looks like for you.
          </p>
        </div>

        {/* Why it matters — collapsible */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowWhy(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
          >
            <span className="text-white font-medium text-sm">Why each section matters</span>
            {showWhy ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showWhy && (
            <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4">
              {WHY_CARDS.map(w => (
                <div key={w.label} className="flex gap-3">
                  <span className="text-violet-400 text-xs font-medium uppercase tracking-wide shrink-0 w-20 mt-0.5">{w.label}</span>
                  <p className="text-gray-400 text-sm leading-relaxed">{w.why}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-5">
          <h3 className="text-white font-semibold">Fill in your brief</h3>
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-200">{field.label}</label>
              <p className="text-xs text-gray-500">{field.description}</p>
              <textarea
                value={field.value}
                onChange={e => updateField(field.id, e.target.value)}
                rows={2}
                placeholder={field.placeholder}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-sm"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {loading ? 'Generating brief and demo…' : 'Generate my brief & see it in action'}
        </button>

        {/* Generated brief */}
        {generatedBrief && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Your AI brief</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 prose prose-invert prose-sm max-w-none text-gray-300">
              <Markdown>{generatedBrief}</Markdown>
            </div>
          </div>
        )}

        {/* Demo response */}
        {demoResponse && (
          <div className="space-y-3">
            <h3 className="text-white font-semibold">See it in action</h3>
            <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Situation</p>
              <p className="text-sm text-gray-300 italic">"{demoQuestion}"</p>
            </div>
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
              <div className="text-violet-400 text-xs uppercase tracking-wider font-medium mb-3">Assistant response (following your brief)</div>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <Markdown>{demoResponse}</Markdown>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Same question without a brief gets a generic answer. With your brief, the AI knows your priorities,
              tone, and limits — and responds accordingly.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
