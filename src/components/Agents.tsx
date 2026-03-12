import React, { useState, useRef, useEffect } from 'react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import { Cpu, Play, Loader2, AlertCircle, CheckCircle2, Search, FileText, Terminal } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';

// Mock tools for the agent
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_documentation",
      description: "Read specific documentation or an article.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The topic to read about (e.g., 'React 19 Hooks', 'Tailwind v4')" }
        },
        required: ["topic"]
      }
    }
  }
];

interface AgentStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result';
  content: string;
  meta?: string;
}

export function Agents() {
  const [goal, setGoal] = useState('Research the new features in React 19 and write a short summary.');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [steps]);

  const runAgent = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    setSteps([]);
    setIsExecuting(true);

    const systemPrompt = `You are an autonomous research agent. 
Your goal is to fulfill the user's request.
You must think step-by-step. 
If you need information, use the provided tools. 
When you have enough information to fulfill the goal, provide your final answer.
Do not ask the user for permission, just execute the tools you need.`;

    let messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: goal }
    ];

    let currentSteps: AgentStep[] = [];
    const addStep = (step: AgentStep) => {
      currentSteps = [...currentSteps, step];
      setSteps(currentSteps);
    };

    addStep({ id: Date.now().toString(), type: 'thought', content: `Goal received: "${goal}". Planning execution...` });

    try {
      let iterations = 0;
      const MAX_ITERATIONS = 4; // Prevent infinite loops in demo
      let isDone = false;

      while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;
        
        const response = await fetchOpenRouterChatFull(messages, 'openai/gpt-4o', apiKey, AGENT_TOOLS);
        messages.push(response);

        if (response.content) {
          addStep({ id: Date.now().toString() + 't', type: 'thought', content: response.content });
        }

        if (response.tool_calls && response.tool_calls.length > 0) {
          const toolResults = [];

          for (const call of response.tool_calls) {
            const args = JSON.parse(call.function.arguments);
            addStep({ 
              id: call.id, 
              type: 'action', 
              content: `Executing ${call.function.name}`, 
              meta: JSON.stringify(args) 
            });

            // Mock Tool Execution
            let result = '';
            await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay for effect

            if (call.function.name === 'search_web') {
              result = `Search results for "${args.query}":\n1. React 19 introduces the React Compiler.\n2. New hooks: useActionState, useFormStatus, useOptimistic.\n3. Server Components are now stable.`;
            } else if (call.function.name === 'read_documentation') {
              result = `Documentation for ${args.topic}:\nThe React Compiler automatically memoizes your code. You no longer need useMemo or useCallback in most cases. useActionState makes form handling much easier with Server Actions.`;
            } else {
              result = "Tool not found.";
            }

            addStep({ 
              id: call.id + 'obs', 
              type: 'observation', 
              content: result 
            });

            toolResults.push({
              role: 'tool',
              tool_call_id: call.id,
              name: call.function.name,
              content: result
            });
          }

          messages = [...messages, ...toolResults];
        } else {
          // No tool calls means the agent is providing the final answer
          isDone = true;
          addStep({ id: Date.now().toString() + 'r', type: 'result', content: response.content || "Task completed." });
        }
      }

      if (iterations >= MAX_ITERATIONS && !isDone) {
        addStep({ id: 'max', type: 'thought', content: 'Reached maximum iterations for this demo. Halting.' });
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-6">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">Agents & Skills</h2>
        <p className="text-gray-400 text-sm max-w-3xl">
          While standard tool calling requires a human to guide the conversation, an <strong>Agent</strong> is given a high-level goal 
          and an autonomous loop. It thinks, decides which tools to use, observes the results, and repeats until the goal is met.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-shrink-0 bg-[#121212] border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Agent Goal</label>
        <div className="flex gap-4">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isExecuting}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            placeholder="e.g., Research React 19 features..."
          />
          <button
            onClick={runAgent}
            disabled={isExecuting || !goal.trim()}
            className="px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>{isExecuting ? 'Running...' : 'Start Agent'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#121212] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-white/10 bg-black/20 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Agent Execution Trace</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm">
          {steps.length === 0 && !isExecuting && (
            <div className="h-full flex items-center justify-center text-gray-600 italic font-sans">
              Enter a goal and start the agent to see its thought process.
            </div>
          )}

          {steps.map((step) => {
            if (step.type === 'thought') {
              return (
                <div key={step.id} className="flex gap-3 text-gray-400">
                  <Cpu className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-purple-400 font-semibold mr-2">Thought:</span>
                    <span className="whitespace-pre-wrap">{step.content}</span>
                  </div>
                </div>
              );
            }
            if (step.type === 'action') {
              return (
                <div key={step.id} className="flex gap-3 text-blue-400 ml-8">
                  <Search className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold mr-2">Action:</span>
                    <span>{step.content}</span>
                    {step.meta && <div className="text-xs text-blue-500/70 mt-1">Args: {step.meta}</div>}
                  </div>
                </div>
              );
            }
            if (step.type === 'observation') {
              return (
                <div key={step.id} className="flex gap-3 text-emerald-400/80 ml-8 border-l-2 border-emerald-500/20 pl-4 py-1">
                  <div>
                    <span className="font-semibold mr-2 text-emerald-500">Observation:</span>
                    <span className="whitespace-pre-wrap">{step.content}</span>
                  </div>
                </div>
              );
            }
            if (step.type === 'result') {
              return (
                <div key={step.id} className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-white font-sans">Final Result</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none markdown-body font-sans bg-black/30 p-6 rounded-xl border border-white/5">
                    <Markdown>{step.content}</Markdown>
                  </div>
                </div>
              );
            }
            return null;
          })}
          
          {isExecuting && (
            <div className="flex gap-3 text-gray-500 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span>Agent is processing...</span>
            </div>
          )}
          <div ref={stepsEndRef} />
        </div>
      </div>
    </div>
  );
}
