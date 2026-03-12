import React, { useState } from 'react';
import { POPULAR_MODELS } from '../constants';
import { fetchOpenRouterChat } from '../services/openRouter';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export function ModelComparison() {
  const [prompt, setPrompt] = useState('Write a Python function to calculate the Fibonacci sequence using memoization.');
  const [model1, setModel1] = useState(POPULAR_MODELS[0].id);
  const [model2, setModel2] = useState(POPULAR_MODELS[1].id);
  
  const [response1, setResponse1] = useState('');
  const [response2, setResponse2] = useState('');
  
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const runComparison = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    setResponse1('');
    setResponse2('');
    
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
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">Basic Capabilities Comparison</h2>
        <p className="text-gray-400 text-sm max-w-3xl">
          Before exploring complex agents, we must understand the raw capabilities of the underlying models. 
          Different models have different coding styles, verbosity, and reasoning patterns.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-shrink-0 bg-[#121212] border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Test Prompt</label>
        <div className="flex gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-24 font-mono text-sm"
            placeholder="Enter a coding prompt..."
          />
          <button
            onClick={runComparison}
            disabled={loading1 || loading2 || !prompt.trim()}
            className="px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 min-w-[120px]"
          >
            {(loading1 || loading2) ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
            <span>Run Test</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {/* Model 1 Panel */}
        <div className="flex flex-col bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <select
              value={model1}
              onChange={(e) => setModel1(e.target.value)}
              className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer"
            >
              {POPULAR_MODELS.map(m => (
                <option key={m.id} value={m.id} className="bg-[#121212]">{m.name}</option>
              ))}
            </select>
            {loading1 && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
            {response1 ? (
              <div className="markdown-body">
                <Markdown>{response1}</Markdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">
                {loading1 ? 'Generating response...' : 'Awaiting prompt...'}
              </div>
            )}
          </div>
        </div>

        {/* Model 2 Panel */}
        <div className="flex flex-col bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <select
              value={model2}
              onChange={(e) => setModel2(e.target.value)}
              className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer"
            >
              {POPULAR_MODELS.map(m => (
                <option key={m.id} value={m.id} className="bg-[#121212]">{m.name}</option>
              ))}
            </select>
            {loading2 && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
            {response2 ? (
              <div className="markdown-body">
                <Markdown>{response2}</Markdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">
                {loading2 ? 'Generating response...' : 'Awaiting prompt...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
