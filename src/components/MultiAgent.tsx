import React, { useState, useRef, useEffect } from 'react';
import { fetchOpenRouterChat } from '../services/openRouter';
import { Users, Code2, ShieldCheck, Play, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';

interface AgentMessage {
  id: string;
  agent: 'User' | 'Coder' | 'Reviewer';
  content: string;
  status: 'pending' | 'active' | 'done';
}

export function MultiAgent() {
  const [task, setTask] = useState('Write a Python script to scrape a website and save the links to a CSV file.');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const runMultiAgent = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    setIsExecuting(true);
    
    // Initial state
    let currentMessages: AgentMessage[] = [
      { id: 'user-1', agent: 'User', content: task, status: 'done' },
      { id: 'coder-1', agent: 'Coder', content: '', status: 'active' }
    ];
    setMessages([...currentMessages]);

    try {
      // --- AGENT 1: The Coder ---
      const coderPrompt = `You are an expert Senior Developer. 
Your task is to write the code for the user's request. 
Provide ONLY the code and a very brief explanation. Do not add fluff.`;
      
      const coderResponse = await fetchOpenRouterChat([
        { role: 'system', content: coderPrompt },
        { role: 'user', content: task }
      ], 'openai/gpt-4o', apiKey);

      // Update Coder to done, add Reviewer as active
      currentMessages = currentMessages.map(m => m.id === 'coder-1' ? { ...m, content: coderResponse, status: 'done' } : m);
      currentMessages.push({ id: 'reviewer-1', agent: 'Reviewer', content: '', status: 'active' });
      setMessages([...currentMessages]);

      // --- AGENT 2: The Reviewer ---
      const reviewerPrompt = `You are a strict Security and Performance Code Reviewer. 
Review the following code provided by the Coder. 
1. Point out exactly ONE critical improvement (security, performance, or best practice).
2. Provide the final, refactored code incorporating your improvement.`;

      const reviewerResponse = await fetchOpenRouterChat([
        { role: 'system', content: reviewerPrompt },
        { role: 'user', content: `Please review this code:\n\n${coderResponse}` }
      ], 'openai/gpt-4o', apiKey); // Using Claude for the reviewer to show multi-model orchestration could be cool, but sticking to GPT-4o for speed/consistency here.

      // Update Reviewer to done
      currentMessages = currentMessages.map(m => m.id === 'reviewer-1' ? { ...m, content: reviewerResponse, status: 'done' } : m);
      setMessages([...currentMessages]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const getAgentIcon = (agent: string, status: string) => {
    if (status === 'active') return <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />;
    if (status === 'pending') return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
    
    switch (agent) {
      case 'User': return <Users className="w-5 h-5 text-blue-400" />;
      case 'Coder': return <Code2 className="w-5 h-5 text-purple-400" />;
      case 'Reviewer': return <ShieldCheck className="w-5 h-5 text-amber-400" />;
      default: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-6">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">Multi-Agent Platforms</h2>
        <p className="text-gray-400 text-sm max-w-3xl">
          Instead of relying on a single prompt, modern frameworks (like AutoGen, CrewAI, or LangGraph) orchestrate 
          multiple specialized agents. Here, a <strong>Coder Agent</strong> writes the initial implementation, and a 
          <strong> Reviewer Agent</strong> critiques and refactors it.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-shrink-0 bg-[#121212] border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Complex Task</label>
        <div className="flex gap-4">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={isExecuting}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            placeholder="Describe a complex coding task..."
          />
          <button
            onClick={runMultiAgent}
            disabled={isExecuting || !task.trim()}
            className="px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[160px] justify-center"
          >
            {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>{isExecuting ? 'Orchestrating...' : 'Start Workflow'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#121212] border border-white/10 rounded-xl overflow-hidden flex flex-col relative">
        {/* Workflow visualization header */}
        <div className="bg-black/40 border-b border-white/10 p-4 flex items-center justify-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-blue-400">
            <Users className="w-4 h-4" /> User
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600" />
          <div className="flex items-center gap-2 text-purple-400">
            <Code2 className="w-4 h-4" /> Coder Agent
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600" />
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-4 h-4" /> Reviewer Agent
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.length === 0 && !isExecuting && (
            <div className="h-full flex items-center justify-center text-gray-600 italic">
              Start the workflow to see the agents collaborate.
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-4 p-5 rounded-xl border transition-all duration-500",
              msg.status === 'active' ? "bg-white/5 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-black/20 border-white/5",
              msg.agent === 'User' && "border-blue-500/20",
              msg.agent === 'Coder' && msg.status === 'done' && "border-purple-500/20",
              msg.agent === 'Reviewer' && msg.status === 'done' && "border-amber-500/20"
            )}>
              <div className="flex-shrink-0 mt-1">
                {getAgentIcon(msg.agent, msg.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={cn(
                    "font-semibold",
                    msg.agent === 'User' && "text-blue-400",
                    msg.agent === 'Coder' && "text-purple-400",
                    msg.agent === 'Reviewer' && "text-amber-400"
                  )}>
                    {msg.agent}
                  </h3>
                  {msg.status === 'active' && (
                    <span className="text-xs text-emerald-500 font-medium animate-pulse">Working...</span>
                  )}
                </div>
                
                {msg.content ? (
                  <div className="prose prose-invert prose-sm max-w-none markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <div className="h-8 flex items-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
