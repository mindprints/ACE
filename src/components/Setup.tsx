import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2 } from 'lucide-react';

interface SetupProps {
  onComplete: () => void;
}

export function Setup({ onComplete }: SetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('openrouter_api_key');
    if (stored) {
      setApiKey(stored);
      setSaved(true);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('openrouter_api_key', apiKey.trim());
      setSaved(true);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('openrouter_api_key');
    setApiKey('');
    setSaved(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Key className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Setup OpenRouter</h2>
          <p className="text-gray-400 text-sm mt-1">Required for live model comparisons and demos.</p>
        </div>
      </div>

      <div className="prose prose-invert prose-sm mb-8 text-gray-400">
        <p>
          This educational tool uses OpenRouter to provide a unified interface to various AI models 
          (OpenAI, Anthropic, Meta, Google, etc.). Your API key is stored locally in your browser 
          and is only sent directly to OpenRouter's API.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
            OpenRouter API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setSaved(false);
            }}
            placeholder="sk-or-v1-..."
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={!apiKey.trim() || saved}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Key'
            )}
          </button>

          {saved && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Clear Key
            </button>
          )}

          {saved && (
            <button
              type="button"
              onClick={onComplete}
              className="ml-auto px-6 py-2.5 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Start Course &rarr;
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
