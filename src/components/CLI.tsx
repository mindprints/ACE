import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronRight, Loader2, AlertCircle, Command, Sparkles, RotateCcw } from 'lucide-react';
import { fetchOpenRouterChat } from '../services/openRouter';
import { cn } from './Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  type: 'command' | 'output' | 'system' | 'error' | 'thinking' | 'divider';
  content: string;
}

// ─── Simulated filesystem context sent to the model ──────────────────────────
// This gives the "output simulator" enough context to produce realistic responses.

const SIMULATED_ENV = `
You are simulating a bash terminal running inside a TypeScript/Node.js project.
The project structure is:
  /project/
    package.json         (name: "myapp", scripts: dev/build/test, deps: express, bcrypt, pg)
    tsconfig.json
    src/
      index.ts           (Express server entry, port 3000)
      auth/
        login.ts         (bcrypt login, returns JWT)
        session.ts       (Redis-backed sessions, 7-day TTL)
        passwordReset.ts (email token flow, 1hr TTL)
      db/
        client.ts        (pg Pool, max 20 connections)
        migrations/
          001_init.sql
          002_sessions.sql
      api/
        routes/
          users.ts       (POST /login, POST /logout, GET /me)
          posts.ts       (CRUD, requires auth middleware)
      middleware/
        rateLimit.ts     (5 attempts / 15min for login, 100/min general)
        auth.ts          (JWT verify middleware)
    tests/
      auth.test.ts
      users.test.ts
    .env                 (DATABASE_URL, REDIS_URL, JWT_SECRET)
    README.md
    node_modules/        (installed)

Current directory: /project
Git: on branch main, clean working tree, 14 commits
Node: v20.11.0, npm: 10.2.4
`.trim();

// ─── Example commands ─────────────────────────────────────────────────────────

const EXAMPLES = [
  'Find all TODO comments in the src folder',
  'Show me the git log for the last 5 commits',
  'Count lines of TypeScript code in src/',
  'List all npm scripts in package.json',
  'Find which files import from the db/client module',
  'Show all files modified in the last 24 hours',
  'Check if there are any unused imports in auth/',
  'Create a summary of the project structure',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CLI() {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'init1', type: 'system', content: '─── AI CLI Agent v1.0 ───────────────────────────────' },
    { id: 'init2', type: 'system', content: 'Type a natural language goal. The agent will plan and execute bash commands.' },
    { id: 'init3', type: 'system', content: 'Running inside: /project (simulated TypeScript/Node.js app)' },
    { id: 'init4', type: 'divider', content: '' },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (entry: Omit<LogEntry, 'id'>) => {
    setLogs(prev => [...prev, { ...entry, id: `${Date.now()}-${Math.random()}` }]);
  };

  const handleCommand = async (text?: string) => {
    const userCommand = (text ?? input).trim();
    if (!userCommand || isExecuting) return;

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    if (!text) setInput('');
    setError(null);
    setIsExecuting(true);

    addLog({ type: 'divider', content: '' });
    addLog({ type: 'command', content: `❯ ${userCommand}` });

    try {
      const model = 'openai/gpt-4o';

      // ── Step 1: Plan — model reasons about what commands to run ────────────
      addLog({ type: 'thinking', content: '● Thinking...' });

      const planMessages = [
        {
          role: 'system',
          content: `You are an AI CLI agent (like Claude Code or Aider). The user gives you a natural language goal.
First, briefly explain your plan in 1-2 sentences (what you'll do and why).
Then output a JSON array of 1-4 bash commands to achieve the goal.

Format your response EXACTLY like this — no markdown, no code fences:
PLAN: <one or two sentence explanation>
COMMANDS: ["cmd1", "cmd2"]

${SIMULATED_ENV}`
        },
        { role: 'user', content: userCommand }
      ];

      const planResponse = await fetchOpenRouterChat(planMessages, model, apiKey);

      // Parse PLAN and COMMANDS from response
      const planMatch = planResponse.match(/PLAN:\s*(.+?)(?=\nCOMMANDS:|$)/s);
      const commandsMatch = planResponse.match(/COMMANDS:\s*(\[[\s\S]*?\])/);

      const plan = planMatch?.[1]?.trim() ?? null;
      let commands: string[] = [];

      if (commandsMatch?.[1]) {
        try {
          commands = JSON.parse(commandsMatch[1]);
          if (!Array.isArray(commands)) throw new Error();
        } catch {
          // Fallback: try parsing the whole response as JSON array
          try {
            const cleaned = planResponse.replace(/```json|```/g, '').trim();
            commands = JSON.parse(cleaned);
          } catch {
            throw new Error('Agent failed to produce valid commands. Try rephrasing your goal.');
          }
        }
      } else {
        // Fallback: whole response might be a JSON array
        try {
          const cleaned = planResponse.replace(/```json|```/g, '').trim();
          commands = JSON.parse(cleaned);
        } catch {
          throw new Error('Agent failed to produce valid commands. Try rephrasing your goal.');
        }
      }

      // Remove the "thinking" placeholder
      setLogs(prev => prev.filter(l => l.type !== 'thinking'));

      // Show the plan
      if (plan) {
        addLog({ type: 'system', content: `◆ ${plan}` });
      }

      // ── Step 2: Execute each command with AI-generated output ──────────────
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];

        addLog({ type: 'command', content: `$ ${cmd}` });
        addLog({ type: 'thinking', content: '  ↳ executing...' });

        // Ask the model to simulate realistic terminal output for this command
        const outputMessages = [
          {
            role: 'system',
            content: `You are simulating the stdout/stderr output of a bash command running in a specific project.
Return ONLY the raw terminal output — no explanation, no markdown, no code fences.
If the command would produce no output (like cd, mkdir), return a single blank line.
Keep output concise and realistic (max 15 lines).

${SIMULATED_ENV}`
          },
          {
            role: 'user',
            content: `Simulate the terminal output of this command:\n${cmd}`
          }
        ];

        const outputResponse = await fetchOpenRouterChat(outputMessages, model, apiKey);

        // Remove the "executing" placeholder
        setLogs(prev => prev.filter(l => l.type !== 'thinking'));

        const cleanOutput = outputResponse
          .replace(/^```[a-z]*\n?/gm, '')
          .replace(/```$/gm, '')
          .trim();

        if (cleanOutput && cleanOutput !== '') {
          addLog({ type: 'output', content: cleanOutput });
        }

        // Small delay between commands for readability
        if (i < commands.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      addLog({ type: 'system', content: `✓ Done (${commands.length} command${commands.length !== 1 ? 's' : ''} executed)` });

    } catch (err: any) {
      setLogs(prev => prev.filter(l => l.type !== 'thinking'));
      addLog({ type: 'error', content: `Error: ${err.message}` });
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClear = () => {
    setLogs([
      { id: 'clear1', type: 'system', content: '─── cleared ─────────────────────────────────────────' },
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-5">

      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">The CLI Renaissance</h2>
        <p className="text-gray-400 text-sm max-w-3xl">
          AI is returning to the terminal. Tools like Claude Code, Aider, and GitHub Copilot CLI let developers
          use natural language to execute complex shell commands, refactor codebases, and manage git workflows.
          The agent below plans its approach, then executes — showing you exactly what commands it runs and why.
        </p>
      </div>

      {error && (
        <div className="flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Terminal Window */}
      <div className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden flex flex-col font-mono shadow-2xl min-h-0">

        {/* Title bar */}
        <div className="bg-[#1a1a1a] border-b border-white/10 px-4 py-2.5 flex items-center gap-4 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2 flex-1">
            <Terminal className="w-3 h-3" />
            ai-agent — /project — bash
          </div>
          <button
            onClick={handleClear}
            className="text-gray-700 hover:text-gray-400 transition-colors"
            title="Clear terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Log output */}
        <div className="flex-1 overflow-y-auto p-4 space-y-0.5 text-sm">
          {logs.map((log) => {
            if (log.type === 'divider') {
              return <div key={log.id} className="h-3" />;
            }
            return (
              <div
                key={log.id}
                className={cn(
                  'whitespace-pre-wrap break-words leading-relaxed',
                  log.type === 'system'   && 'text-blue-400/80',
                  log.type === 'thinking' && 'text-gray-600 italic animate-pulse',
                  log.type === 'command'  && log.content.startsWith('❯')
                    ? 'text-white font-bold mt-1'
                    : log.type === 'command' && 'text-emerald-400',
                  log.type === 'output'   && 'text-gray-300 ml-2',
                  log.type === 'error'    && 'text-red-400',
                )}
              >
                {log.content}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="bg-[#111] border-t border-white/10 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCommand(); }}
              disabled={isExecuting}
              placeholder={isExecuting ? 'Executing...' : 'Describe what you want to do...'}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-sm py-0.5 disabled:opacity-50"
              autoFocus
            />
            {isExecuting && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />}
          </div>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex-shrink-0 flex flex-wrap gap-2">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => handleCommand(ex)}
            disabled={isExecuting}
            className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono truncate max-w-[280px]"
            title={ex}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}