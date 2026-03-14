import React, { useState } from 'react';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { BookOpen, Plus, X, Sparkles, Play, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Context card types ───────────────────────────────────────────────────────

type CardCategory = 'role' | 'industry' | 'style' | 'goals' | 'constraints';

interface ContextCard {
  id: string;
  category: CardCategory;
  content: string;
}

const CATEGORY_META: Record<CardCategory, { label: string; color: string; placeholder: string }> = {
  role:        { label: 'My Role',        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     placeholder: 'e.g. I\'m a product manager at a mid-sized SaaS company' },
  industry:    { label: 'My Industry',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', placeholder: 'e.g. We sell HR software to companies with 50–500 employees' },
  style:       { label: 'My Style',       color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   placeholder: 'e.g. I prefer bullet points and concise language, no jargon' },
  goals:       { label: 'My Goals',       color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',placeholder: 'e.g. I\'m trying to improve our customer onboarding process this quarter' },
  constraints: { label: 'My Constraints', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',     placeholder: 'e.g. I have a small team and no budget for new tools right now' },
};

const STARTER_CARDS: ContextCard[] = [
  { id: '1', category: 'role',     content: 'I manage a small marketing team at a healthcare company.' },
  { id: '2', category: 'industry', content: 'We work in regulated healthcare, so compliance matters a lot.' },
  { id: '3', category: 'style',    content: 'I like direct, practical suggestions — not theory.' },
];

const SAMPLE_QUESTION = 'We\'re getting low engagement on our email newsletter. What should we try?';

// ─── Card component ───────────────────────────────────────────────────────────

function ContextCardItem({ card, onRemove }: { card: ContextCard; onRemove: () => void }) {
  const meta = CATEGORY_META[card.category];
  return (
    <div className={cn('flex items-start gap-2 px-3 py-2.5 rounded-xl border', meta.color)}>
      <span className="text-[10px] font-medium uppercase tracking-wider shrink-0 mt-0.5 opacity-70">{meta.label}</span>
      <span className="text-sm text-gray-300 flex-1 leading-snug">{card.content}</span>
      <button onClick={onRemove} className="text-gray-600 hover:text-gray-300 shrink-0 mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistTeach() {
  const [cards, setCards] = useState<ContextCard[]>(STARTER_CARDS);
  const [newCategory, setNewCategory] = useState<CardCategory>('role');
  const [newContent, setNewContent] = useState('');
  const [question, setQuestion] = useState(SAMPLE_QUESTION);
  const [loading, setLoading] = useState(false);
  const [responseWithContext, setResponseWithContext] = useState('');
  const [responseWithout, setResponseWithout] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const addCard = () => {
    if (!newContent.trim()) return;
    setCards(prev => [...prev, {
      id: Date.now().toString(),
      category: newCategory,
      content: newContent.trim(),
    }]);
    setNewContent('');
  };

  const removeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  const handleCompare = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }
    setError(null);
    setResponseWithContext('');
    setResponseWithout('');
    setHasRun(true);
    setLoading(true);

    const contextBlock = cards.map(c => `${CATEGORY_META[c.category].label}: ${c.content}`).join('\n');

    const withContextPrompt = `You are a helpful advisor. Here is everything you know about the person asking:

${contextBlock}

With this context in mind, answer the following question:
${question}

Be specific to their situation. Keep it concise and actionable.`;

    const withoutContextPrompt = `${question}\n\nKeep your answer concise and practical.`;

    try {
      const [withCtx, without] = await Promise.all([
        fetchOpenRouterChat(
          [{ role: 'user', content: withContextPrompt }],
          'openai/gpt-4o-mini',
          apiKey
        ),
        fetchOpenRouterChat(
          [{ role: 'user', content: withoutContextPrompt }],
          'openai/gpt-4o-mini',
          apiKey
        ),
      ]);
      setResponseWithContext(withCtx);
      setResponseWithout(without);
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
            <BookOpen className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Teach It Your Way</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Context Is Everything</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            The biggest leap in AI usefulness isn't a smarter model — it's giving the model the right context.
            An AI that knows your role, your industry, your constraints, and your goals gives dramatically
            better advice than the same AI answering in the dark.
          </p>
        </div>

        {/* Analogy */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <p className="text-gray-300 leading-relaxed text-sm">
            <span className="text-white font-semibold">Think of it like onboarding a consultant.</span>{' '}
            On day one, a consultant gives you generic advice. By week two — after they've understood
            your business, team, and constraints — their advice is far more targeted and useful.
            AI works the same way. The context you give it is the onboarding.
          </p>
        </div>

        {/* Context builder */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Build your context</h3>
          <p className="text-gray-500 text-sm">Add cards that describe you and your world. Watch how they change the AI's answers.</p>

          <div className="space-y-2">
            {cards.map(card => (
              <ContextCardItem key={card.id} card={card} onRemove={() => removeCard(card.id)} />
            ))}
          </div>

          {/* Add new card */}
          <div className="flex gap-2 items-start bg-[#121212] border border-white/10 rounded-xl p-3">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as CardCategory)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none shrink-0"
            >
              {(Object.keys(CATEGORY_META) as CardCategory[]).map(k => (
                <option key={k} value={k} className="bg-[#121212]">{CATEGORY_META[k].label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCard(); }}
              placeholder={CATEGORY_META[newCategory].placeholder}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            <button
              onClick={addCard}
              disabled={!newContent.trim()}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Now ask a question</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
              placeholder="Ask anything relevant to your context..."
            />
            <button
              onClick={handleCompare}
              disabled={loading || !question.trim() || cards.length === 0}
              className="px-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Compare
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Side-by-side comparison */}
        {(loading || hasRun) && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col bg-[#121212] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-black/20">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Without your context</div>
                <div className="text-xs text-gray-600 mt-0.5">Generic advice for anyone</div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto prose prose-invert prose-sm max-w-none min-h-[180px]">
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-600 h-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking…</span>
                  </div>
                ) : responseWithout ? (
                  <Markdown>{responseWithout}</Markdown>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col bg-[#121212] border border-violet-500/20 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-violet-500/20 bg-violet-500/5">
                <div className="text-xs font-medium text-violet-400 uppercase tracking-wider">With your context ({cards.length} card{cards.length !== 1 ? 's' : ''})</div>
                <div className="text-xs text-gray-600 mt-0.5">Tailored to your situation</div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto prose prose-invert prose-sm max-w-none min-h-[180px]">
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-600 h-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking…</span>
                  </div>
                ) : responseWithContext ? (
                  <Markdown>{responseWithContext}</Markdown>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {!loading && hasRun && responseWithContext && responseWithout && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-5 py-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-violet-300 font-semibold">The gap is the point.</span>{' '}
              Context doesn't make AI smarter — it makes it <em>relevant</em>. The best AI workflows
              start with a rich, honest description of who you are and what you're trying to do.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
