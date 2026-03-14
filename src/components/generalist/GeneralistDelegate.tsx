import React, { useState, useRef, useEffect } from 'react';
import { fetchOpenRouterChat } from '../../services/openRouter';
import { MessageSquare, Send, Loader2, AlertCircle, Lightbulb, ChevronRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a thoughtful, proactive personal assistant who helps people delegate and organise their work.

When someone gives you a task or request:
1. Break it into clear, logical steps they can act on or hand off
2. Offer to handle any part of it directly (writing, research, planning, summarising)
3. Flag any information you'd need from them to proceed

You speak in plain, natural language — no jargon, no technical terms. You're practical, warm, and get to the point quickly.

When appropriate, produce actual deliverables (draft emails, plans, lists, summaries) rather than just describing what you'd do.`;

const STARTER_TASKS = [
  'I need to plan a team offsite for 12 people next month.',
  'Help me write a polite follow-up to a proposal I sent three weeks ago with no reply.',
  'I have to give a 5-minute talk next week and I don\'t know where to start.',
  'I want to start exercising but I keep skipping it. Help me actually make it happen.',
  'I need to negotiate a better rate with a supplier I\'ve been using for two years.',
];

const INSIGHT_PANELS = [
  {
    title: 'Language is the new interface',
    body: 'For most of computing history, you had to learn the tool\'s language — menus, commands, syntax. Now the tool learns yours. Describing what you want in natural language is enough to get something useful done.',
  },
  {
    title: 'Delegation, not just automation',
    body: 'The shift isn\'t just about speed — it\'s about what you spend your attention on. When routine tasks can be delegated to an AI, your energy goes to the decisions only you can make.',
  },
  {
    title: 'The AI as thought partner',
    body: 'Often the most valuable part isn\'t the output — it\'s that explaining your task to an AI forces you to clarify it. Unclear inputs produce unclear outputs, which quickly reveals where your thinking needs sharpening.',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GeneralistDelegate() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    if (text) setInput('');
    else setInput('');

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your API key in the Setup section first.');
      return;
    }

    setError(null);
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const chatMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...newMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const response = await fetchOpenRouterChat(chatMessages, 'openai/gpt-4o-mini', apiKey);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
      setMessages(newMessages); // remove the user message on error
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full bg-[#0a0a0a]">

      {/* Left panel: chat */}
      <div className="flex flex-col flex-1 border-r border-white/10 min-w-0">

        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Just Say It</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Describe What You Need</h2>
          <p className="text-gray-500 text-sm mt-1">
            Language is now the interface. Tell the AI what you want — it handles the structure.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && !loading && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm italic">Start with a task, a problem, or just something on your mind.</p>
              <div className="space-y-2">
                {STARTER_TASKS.map(t => (
                  <button
                    key={t}
                    onClick={() => { setInput(t); sendMessage(t); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 text-gray-400 hover:text-gray-200 text-sm transition-all group"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-400 shrink-0" />
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-[#121212] border border-white/10 text-gray-300 rounded-bl-sm'
              )}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#121212] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-sm text-gray-500">Thinking…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Describe a task, a problem, something you need to get done…"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-sm"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="mt-2 text-xs text-gray-700 hover:text-gray-500 transition-colors"
            >
              Clear conversation
            </button>
          )}
        </div>
      </div>

      {/* Right panel: insights */}
      <div className="w-72 flex-shrink-0 p-5 overflow-y-auto space-y-5">
        <div className="flex items-center gap-2 text-gray-500">
          <Lightbulb className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider font-medium">The bigger picture</span>
        </div>

        {INSIGHT_PANELS.map(panel => (
          <div key={panel.title} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <h4 className="text-white text-sm font-medium mb-2">{panel.title}</h4>
            <p className="text-gray-500 text-xs leading-relaxed">{panel.body}</p>
          </div>
        ))}

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
          <h4 className="text-violet-300 text-sm font-medium mb-2">Tip</h4>
          <p className="text-gray-500 text-xs leading-relaxed">
            The more specific your request, the better the result. Instead of "help me with email,"
            try "draft a reply to my supplier asking for a 15% discount on our next order."
          </p>
        </div>
      </div>

    </div>
  );
}
