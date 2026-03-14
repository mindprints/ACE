import React, { useState } from 'react';
import { POPULAR_MODELS } from '../../constants';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { Play, Loader2, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

const EXAMPLE_PROMPTS = [
  'I have a job interview in two days. What are the three most important things I should do to prepare?',
  'Explain the difference between a stock, a bond, and a mutual fund in plain language.',
  'Write a short, warm email declining a dinner invitation without giving a reason.',
  'I\'m starting a vegetable garden for the first time. What are the easiest vegetables to grow?',
  'What questions should I ask before signing a lease on a new apartment?',
];

export function GeneralistBasics() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [model1, setModel1] = useState(POPULAR_MODELS[0].id);
  const [model2, setModel2] = useState(POPULAR_MODELS[1].id);
  const [response1, setResponse1] = useState('');
  const [response2, setResponse2] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const runComparison = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }
    setError(null);
    setResponse1('');
    setResponse2('');
    setHasRun(true);

    const messages = [{ role: 'user' as const, content: prompt }];

    setLoading1(true);
    fetchOpenRouterChat(messages, model1, apiKey)
      .then(setResponse1)
      .catch(err => setResponse1(`Error: ${err.message}`))
      .finally(() => setLoading1(false));

    setLoading2(true);
    fetchOpenRouterChat(messages, model2, apiKey)
      .then(setResponse2)
      .catch(err => setResponse2(`Error: ${err.message}`))
      .finally(() => setLoading2(false));
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto bg-[#0a0a0a]">

      {/* Header */}
      <div className="flex-shrink-0 max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Your AI Advisors</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Different Minds, Different Answers</h2>
        <p className="text-gray-400 leading-relaxed">
          AI models are like having access to many different advisors at once — each trained on vast knowledge,
          each with its own style and strengths. Asking the same question to two different models often
          surfaces different perspectives, tones, and details. That difference is valuable.
        </p>
      </div>

      {/* What makes models different */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 max-w-3xl">
        {[
          { label: 'Tone', desc: 'Some are concise and direct. Others explain every step. Neither is wrong — it depends on what you need.' },
          { label: 'Depth', desc: 'Some go wide, surfacing many angles. Others go deep on one path. Great for cross-checking important decisions.' },
          { label: 'Personality', desc: 'Models have different "characters" shaped by how they were trained and who built them.' },
        ].map(({ label, desc }) => (
          <div key={label} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <div className="text-violet-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</div>
            <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 flex-shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Prompt input */}
      <div className="flex-shrink-0 bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-300">Ask anything</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-sm"
          placeholder="Type any question — practical, creative, analytical..."
        />

        {/* Example prompts */}
        <div className="space-y-1.5">
          <p className="text-xs text-gray-600">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="text-xs text-gray-500 hover:text-gray-200 border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors truncate max-w-xs"
                title={p}
              >
                {p.length > 55 ? p.slice(0, 55) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runComparison}
          disabled={loading1 || loading2 || !prompt.trim()}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {(loading1 || loading2) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Compare two advisors
        </button>
      </div>

      {/* Response panels */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-[320px]">
        {[
          { model: model1, setModel: setModel1, response: response1, loading: loading1 },
          { model: model2, setModel: setModel2, response: response2, loading: loading2 },
        ].map(({ model, setModel, response, loading }, idx) => (
          <div key={idx} className="flex flex-col bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer"
              >
                {POPULAR_MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#121212]">{m.name} — {m.provider}</option>
                ))}
              </select>
              {loading && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
            </div>
            <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
              {response ? (
                <Markdown>{response}</Markdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-sm italic">
                    {loading ? 'Thinking…' : hasRun ? 'Waiting…' : 'Response appears here'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Insight after first run */}
      {hasRun && !loading1 && !loading2 && response1 && response2 && (
        <div className="flex-shrink-0 bg-violet-500/5 border border-violet-500/20 rounded-xl px-5 py-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            <span className="text-violet-300 font-semibold">Notice the differences.</span>{' '}
            Same question, different advisors. In practice, using two models side-by-side is a fast way to
            catch blind spots, spark new angles, and decide which answer actually fits your situation.
          </p>
        </div>
      )}

    </div>
  );
}
