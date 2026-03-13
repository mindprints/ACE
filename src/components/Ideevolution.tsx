import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap, MessageSquare, Bot, ChevronRight, Loader2, AlertCircle,
  File, Folder, X, Check, GitBranch, Circle, Minus, Square,
  ChevronDown, Terminal, ArrowRight, Play, RotateCcw, Info
} from 'lucide-react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import { cn } from './Layout';
import Markdown from 'react-markdown';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'autocomplete' | 'chat' | 'agent';

// ─── Mode config ───────────────────────────────────────────────────────────────

const MODE_CONFIG = {
  autocomplete: {
    label: 'Autocomplete',
    year: '2021–22',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-sky-400',
    accent: 'bg-sky-500/10 border-sky-500/20',
    dot: 'bg-sky-500',
    tagline: 'Ghost text. One file. No context.',
    description: 'GitHub Copilot\'s original mode. The model sees the current file and predicts the next tokens inline. Fast, surprising, but blind to the rest of your codebase.',
    limitation: 'Limitation: only sees the open file. Ask it to use your auth library and it\'ll invent one.',
  },
  chat: {
    label: 'Chat',
    year: '2023',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-violet-400',
    accent: 'bg-violet-500/10 border-violet-500/20',
    dot: 'bg-violet-500',
    tagline: 'Conversational. Contextual. Iterative.',
    description: 'VS Code forks (Cursor, Continue) added a persistent chat sidebar. You can ask questions, reference files with @, and iterate. The model can see more context — but you still apply changes manually.',
    limitation: 'Limitation: you still copy-paste the output. One file at a time, with friction.',
  },
  agent: {
    label: 'Agent',
    year: '2024–25',
    icon: <Bot className="w-4 h-4" />,
    color: 'text-emerald-400',
    accent: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
    tagline: 'Plans. Edits. Asks permission.',
    description: 'Agent mode reads your whole codebase, plans a multi-step approach, edits multiple files, and asks for confirmation before saving. You review diffs, not raw code.',
    limitation: 'Frontier: still makes mistakes on large codebases, can loop on complex bugs.',
  },
};

const MODE_ORDER: Mode[] = ['autocomplete', 'chat', 'agent'];

// ─── Fake project files ────────────────────────────────────────────────────────

const PROJECT_FILES = {
  'app.py': `from flask import Flask, jsonify
import time

app = Flask(__name__)
START_TIME = time.time()

@app.route('/')
def index():
    return jsonify({"status": "ok"})

# TODO: add /health endpoint
`,
  'auth.py': `import bcrypt
from db import get_db

def login(email, password):
    db = get_db()
    user = db.execute(
        'SELECT * FROM users WHERE email = ?', (email,)
    ).fetchone()
    if not user:
        return None
    if bcrypt.checkpw(password.encode(), user['password_hash']):
        return user
    return None
`,
  'db.py': `import sqlite3
from flask import g

DATABASE = 'app.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db
`,
};

type Filename = keyof typeof PROJECT_FILES;

// ─── Prompts ───────────────────────────────────────────────────────────────────

function buildAutocompletePrompt(fileContent: string, cursorLine: string): string {
  return `You are GitHub Copilot. The user is typing in a Python file. Complete ONLY the code starting from where the cursor is.

File content so far:
\`\`\`python
${fileContent}
\`\`\`

The cursor is at the end of this line: "${cursorLine}"

Rules:
- Output ONLY the completion — raw Python code, no explanation, no markdown fences
- Complete the function/block that's being started at the cursor
- Stay consistent with the existing code style
- 5-15 lines maximum
- Do NOT repeat code already in the file`;
}

function buildChatPrompt(question: string, activeFile: string, fileContent: string): string {
  return `You are an AI coding assistant embedded in a VS Code sidebar (like Cursor or Continue).

The user has this file open: ${activeFile}
\`\`\`python
${fileContent}
\`\`\`

Answer the user's question helpfully and concisely. If you suggest code changes, show them as a code block. Be conversational but precise.`;
}

function buildAgentPrompt(task: string): string {
  return `You are an AI coding agent in "agent mode" inside a VS Code fork. You have read-access to the project.

Project files:
\`\`\`
app.py:
${PROJECT_FILES['app.py']}

auth.py:
${PROJECT_FILES['auth.py']}

db.py:
${PROJECT_FILES['db.py']}
\`\`\`

Task: "${task}"

Respond ONLY with JSON (no markdown fences):
{
  "plan": ["step 1", "step 2", "step 3"],
  "edits": [
    {
      "file": "filename.py",
      "description": "what this edit does",
      "before": "exact lines being replaced (3-6 lines)",
      "after": "new replacement lines (3-8 lines)"
    }
  ],
  "summary": "One sentence: what you did and why"
}

Rules:
- plan should have 2-4 steps
- edits should touch 1-2 files maximum
- before/after must be valid Python
- Make the task concrete and specific to this Flask project`;
}

// ─── Simulated typing ──────────────────────────────────────────────────────────

function useTypingEffect(target: string, speed = 18, enabled = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !target) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    ref.current = setInterval(() => {
      i++;
      setDisplayed(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(ref.current!);
        setDone(true);
      }
    }, speed);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [target, enabled]);

  return { displayed, done };
}

// ─── VS Code chrome ────────────────────────────────────────────────────────────

function VSCodeChrome({ children, sidebarContent, activeFile, onFileClick, files, statusText }:
  {
    children: React.ReactNode;
    sidebarContent?: React.ReactNode;
    activeFile: Filename;
    onFileClick: (f: Filename) => void;
    files: Filename[];
    statusText?: string;
  }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e] font-mono text-xs select-none shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#323233] border-b border-black/30">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center text-[11px] text-[#cccccc]/50 truncate">
          flask-project — Visual Studio Code
        </span>
        <GitBranch className="w-3 h-3 text-[#cccccc]/30" />
        <span className="text-[10px] text-[#cccccc]/30">main</span>
      </div>

      <div className="flex" style={{ minHeight: 340 }}>
        {/* Activity bar */}
        <div className="w-10 bg-[#333333] border-r border-black/20 flex flex-col items-center pt-3 gap-4">
          <File className="w-4 h-4 text-[#cccccc]/60" />
          <MessageSquare className="w-4 h-4 text-[#cccccc]/30" />
          <Terminal className="w-4 h-4 text-[#cccccc]/30" />
        </div>

        {/* File explorer */}
        <div className="w-36 bg-[#252526] border-r border-black/20 pt-2 shrink-0">
          <div className="flex items-center gap-1 px-2 pb-1.5 text-[10px] text-[#bbbbbb]/60 uppercase tracking-widest">
            <ChevronDown className="w-2.5 h-2.5" />
            Explorer
          </div>
          <div className="flex items-center gap-1 px-3 pb-1 text-[10px] text-[#cccccc]/50">
            <Folder className="w-3 h-3" /> flask-project
          </div>
          {files.map(f => (
            <button key={f} onClick={() => onFileClick(f)}
              className={cn(
                'w-full text-left flex items-center gap-1.5 px-5 py-0.5 text-[11px] transition-colors',
                activeFile === f
                  ? 'bg-[#37373d] text-[#cccccc]'
                  : 'text-[#cccccc]/50 hover:bg-[#2a2d2e]'
              )}>
              <File className="w-2.5 h-2.5 shrink-0" />
              {f}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex bg-[#2d2d2d] border-b border-black/20">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border-r border-black/20 text-[11px] text-[#cccccc]">
              <File className="w-2.5 h-2.5" />
              {activeFile}
              <X className="w-2.5 h-2.5 opacity-40 hover:opacity-100 ml-1 cursor-pointer" />
            </div>
          </div>
          {/* Editor area */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>

        {/* Right sidebar (chat panel) */}
        {sidebarContent && (
          <div className="w-64 bg-[#252526] border-l border-black/20 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-black/20 text-[10px] text-[#cccccc]/50 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> AI Chat
            </div>
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-1 bg-[#007acc] text-white text-[10px]">
        <GitBranch className="w-2.5 h-2.5" />
        <span>main</span>
        <span className="ml-auto opacity-70">{statusText ?? 'Python 3.11'}</span>
      </div>
    </div>
  );
}

// ─── Editor content with line numbers ─────────────────────────────────────────

function EditorLines({ content, ghostText, highlightLines }: {
  content: string;
  ghostText?: string;
  highlightLines?: number[];
}) {
  const lines = content.split('\n');
  const ghostLines = ghostText ? ghostText.split('\n') : [];

  return (
    <div className="p-0 overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className={cn(
              'group',
              highlightLines?.includes(i + 1) ? 'bg-yellow-500/10' : 'hover:bg-white/3'
            )}>
              <td className="text-right pr-3 pl-4 py-0 text-[#858585] w-8 select-none text-[11px] align-top pt-px">
                {i + 1}
              </td>
              <td className="pr-4 py-0 text-[11px] leading-5 whitespace-pre text-[#d4d4d4]">
                {line || ' '}
              </td>
            </tr>
          ))}
          {/* Ghost text lines */}
          {ghostLines.map((line, i) => (
            <tr key={`ghost-${i}`}>
              <td className="text-right pr-3 pl-4 py-0 text-[#858585]/40 w-8 select-none text-[11px] align-top pt-px">
                {lines.length + i + 1}
              </td>
              <td className="pr-4 py-0 text-[11px] leading-5 whitespace-pre text-[#6a9955]/70 italic">
                {line || ' '}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Mode demos ────────────────────────────────────────────────────────────────

function AutocompleteDemo() {
  const [phase, setPhase] = useState<'idle' | 'typing' | 'ghost' | 'accepted'>('idle');
  const [ghostText, setGhostText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<Filename>('app.py');

  const typingLine = '@app.route(\'/health\')';
  const { displayed: typedLine, done: typingDone } = useTypingEffect(typingLine, 55, phase === 'typing');

  useEffect(() => {
    if (typingDone && phase === 'typing') {
      setPhase('ghost');
      fetchGhost();
    }
  }, [typingDone]);

  const fetchGhost = async () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setError('Configure API key first.'); setPhase('idle'); return; }
    setLoading(true);
    const currentContent = PROJECT_FILES['app.py'];
    const prompt = buildAutocompletePrompt(currentContent, '@app.route(\'/health\')');
    try {
      const msg = await fetchOpenRouterChatFull(
        [{ role: 'user', content: prompt }], 'openai/gpt-4o-mini', apiKey, []
      );
      setGhostText((msg.content ?? '').replace(/```python|```/g, '').trim());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const fileContent = phase === 'accepted'
    ? PROJECT_FILES['app.py'].replace('# TODO: add /health endpoint\n', '') + '\n' + typingLine + '\n' + ghostText
    : PROJECT_FILES['app.py'].replace('# TODO: add /health endpoint\n', '') + (phase !== 'idle' ? '\n' + typedLine : '');

  return (
    <div className="space-y-4">
      <VSCodeChrome
        activeFile={activeFile}
        onFileClick={setActiveFile}
        files={['app.py', 'auth.py', 'db.py']}
        statusText={loading ? 'Copilot: generating…' : phase === 'accepted' ? '✓ Suggestion accepted' : 'Copilot ready'}
      >
        <EditorLines
          content={fileContent}
          ghostText={phase === 'ghost' && !loading ? ghostText : undefined}
        />
        {loading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-t border-black/20 text-[10px] text-[#cccccc]/50">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Copilot is thinking...
          </div>
        )}
        {phase === 'ghost' && !loading && ghostText && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#252526] border-t border-black/20 text-[10px]">
            <span className="text-[#cccccc]/50">Tab to accept</span>
            <button onClick={() => setPhase('accepted')}
              className="flex items-center gap-1 bg-[#007acc] text-white px-2 py-0.5 rounded text-[10px] hover:bg-[#005fa3] transition-colors">
              <Check className="w-2.5 h-2.5" /> Accept
            </button>
            <button onClick={() => { setGhostText(''); setPhase('idle'); }}
              className="flex items-center gap-1 text-[#cccccc]/40 hover:text-[#cccccc]/70 transition-colors">
              <X className="w-2.5 h-2.5" /> Dismiss
            </button>
          </div>
        )}
      </VSCodeChrome>

      {error && <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</div>}

      <div className="flex items-center gap-3">
        {phase === 'idle' && (
          <button onClick={() => setPhase('typing')}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Play className="w-3.5 h-3.5" /> Start typing — watch Copilot complete
          </button>
        )}
        {phase === 'accepted' && (
          <button onClick={() => { setPhase('idle'); setGhostText(''); setError(null); }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors border border-white/10">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
        <p className="text-xs text-gray-600 font-mono">
          {phase === 'idle'     && 'The model sees only this file. No other context.'}
          {phase === 'typing'   && 'Simulating keystrokes — the model is about to see the new line…'}
          {phase === 'ghost'    && !loading && 'Ghost text appears. Tab accepts, Esc dismisses.'}
          {phase === 'accepted' && 'Change accepted into the file. No diff, no review — straight insertion.'}
        </p>
      </div>
    </div>
  );
}

function ChatDemo() {
  const [activeFile, setActiveFile] = useState<Filename>('app.py');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const STARTERS = [
    'What does this file do?',
    '@auth.py How does login work?',
    'Add error handling to the index route',
    'What would break if I changed the DB path?',
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setError('Configure API key first.'); return; }
    setInput('');
    setError(null);
    const newMessages = [...messages, { role: 'user' as const, content: q }];
    setMessages(newMessages);
    setLoading(true);
    // Resolve @file references
    const referencedFile = q.match(/@(\S+\.py)/)?.[1] as Filename | undefined;
    const fileToUse = referencedFile && PROJECT_FILES[referencedFile] ? referencedFile : activeFile;
    try {
      const msg = await fetchOpenRouterChatFull(
        newMessages,
        'openai/gpt-4o-mini', apiKey,
        [{ role: 'system', content: buildChatPrompt(q, fileToUse, PROJECT_FILES[fileToUse]) }]
      );
      setMessages([...newMessages, { role: 'assistant', content: msg.content ?? '' }]);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0" style={{ maxHeight: 260 }}>
        {messages.length === 0 && (
          <div className="text-[10px] text-[#cccccc]/30 text-center pt-4 leading-relaxed">
            Ask anything about<br />the open file
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn(
            'rounded-lg px-2 py-1.5 text-[10px] leading-relaxed',
            m.role === 'user' ? 'bg-[#007acc]/20 text-[#cccccc] ml-2' : 'bg-[#37373d] text-[#cccccc]/80 mr-2'
          )}>
            {m.role === 'assistant'
              ? <div className="prose prose-invert max-w-none text-[10px] [&_code]:text-[9px] [&_pre]:text-[9px] [&_pre]:overflow-x-auto"><Markdown>{m.content}</Markdown></div>
              : m.content}
          </div>
        ))}
        {loading && (
          <div className="bg-[#37373d] rounded-lg px-2 py-1.5 mr-2 flex items-center gap-1.5">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-[#cccccc]/50" />
            <span className="text-[10px] text-[#cccccc]/30">Thinking…</span>
          </div>
        )}
      </div>

      {/* Starters */}
      {messages.length === 0 && (
        <div className="px-2 pb-1 space-y-1">
          {STARTERS.map(s => (
            <button key={s} onClick={() => send(s)} disabled={loading}
              className="w-full text-left text-[10px] text-[#cccccc]/40 hover:text-[#cccccc]/70 hover:bg-[#37373d] px-2 py-1 rounded transition-colors truncate">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-black/20">
        <div className="flex gap-1">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            disabled={loading}
            placeholder="Ask about this file…"
            className="flex-1 bg-[#3c3c3c] text-[#cccccc] text-[10px] px-2 py-1 rounded border border-white/10 outline-none placeholder-[#cccccc]/20 disabled:opacity-40"
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="bg-[#007acc] disabled:opacity-40 text-white px-2 rounded text-[10px] hover:bg-[#005fa3] transition-colors">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {error && <p className="text-red-400 text-[9px] mt-1 font-mono">{error}</p>}
      </div>
    </div>
  );

  return (
    <VSCodeChrome
      activeFile={activeFile}
      onFileClick={setActiveFile}
      files={['app.py', 'auth.py', 'db.py']}
      sidebarContent={sidebarContent}
      statusText={loading ? 'AI: responding…' : 'Chat ready — try @auth.py'}
    >
      <EditorLines content={PROJECT_FILES[activeFile]} />
    </VSCodeChrome>
  );
}

interface AgentEdit { file: string; description: string; before: string; after: string }
interface AgentPlan { plan: string[]; edits: AgentEdit[]; summary: string }

function AgentDemo() {
  const [task, setTask] = useState('');
  const [phase, setPhase] = useState<'idle' | 'planning' | 'review' | 'applied'>('idle');
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [approvedEdits, setApprovedEdits] = useState<Set<number>>(new Set());
  const [rejectedEdits, setRejectedEdits] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<Filename>('app.py');

  const TASK_EXAMPLES = [
    'Add a /health endpoint that returns uptime and version',
    'Add input validation to the login function',
    'Add request logging middleware',
  ];

  const runAgent = async (t?: string) => {
    const q = (t ?? task).trim();
    if (!q) return;
    if (t) setTask(t);
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) { setError('Configure API key first.'); return; }
    setError(null);
    setPhase('planning');
    setAgentPlan(null);
    setApprovedEdits(new Set());
    setRejectedEdits(new Set());
    setLoading(true);
    try {
      const msg = await fetchOpenRouterChatFull(
        [{ role: 'user', content: buildAgentPrompt(q) }],
        'openai/gpt-4o-mini', apiKey, []
      );
      const raw = (msg.content ?? '').replace(/```json|```/g, '').trim();
      const plan = JSON.parse(raw) as AgentPlan;
      setAgentPlan(plan);
      setPhase('review');
    } catch (e: any) {
      setError(`Agent error: ${e.message}`);
      setPhase('idle');
    }
    setLoading(false);
  };

  const allDecided = agentPlan
    ? agentPlan.edits.every((_, i) => approvedEdits.has(i) || rejectedEdits.has(i))
    : false;

  return (
    <div className="space-y-4">
      {/* Task input — shown at top before planning */}
      {phase === 'idle' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runAgent(); }}
              placeholder="Describe a task for the agent…"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm font-mono"
            />
            <button onClick={() => runAgent()} disabled={!task.trim() || loading}
              className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
              <Bot className="w-4 h-4" /> Run agent
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TASK_EXAMPLES.map(t => (
              <button key={t} onClick={() => runAgent(t)}
                className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 font-mono transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</div>}

      {/* Planning phase */}
      {phase === 'planning' && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 flex items-center gap-4">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm text-emerald-400 font-medium">Agent is reading the codebase…</p>
            <p className="text-xs text-gray-600 font-mono mt-0.5">Analysing app.py, auth.py, db.py — planning edit sequence</p>
          </div>
        </div>
      )}

      {/* Review phase */}
      {phase === 'review' && agentPlan && (
        <div className="space-y-4">
          {/* Plan steps */}
          <div className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-3">Agent plan</p>
            {agentPlan.plan.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                <span className="text-emerald-600 font-mono shrink-0 mt-0.5">{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>

          {/* Diffs to review */}
          <div className="space-y-3">
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
              Proposed edits — review each before applying
            </p>
            {agentPlan.edits.map((edit, i) => {
              const approved = approvedEdits.has(i);
              const rejected = rejectedEdits.has(i);
              return (
                <div key={i} className={cn(
                  'border rounded-xl overflow-hidden transition-all',
                  approved ? 'border-emerald-500/30 bg-emerald-500/5'
                  : rejected ? 'border-red-500/20 bg-red-500/5 opacity-50'
                  : 'border-white/10 bg-[#0e0e0e]'
                )}>
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                    <File className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-mono text-gray-400">{edit.file}</span>
                    <span className="flex-1 text-[10px] text-gray-600 font-mono ml-1">{edit.description}</span>
                    {!approved && !rejected && (
                      <div className="flex gap-1.5">
                        <button onClick={() => setApprovedEdits(s => new Set([...s, i]))}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] transition-colors">
                          <Check className="w-2.5 h-2.5" /> Accept
                        </button>
                        <button onClick={() => setRejectedEdits(s => new Set([...s, i]))}
                          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-0.5 rounded text-[10px] transition-colors border border-white/10">
                          <X className="w-2.5 h-2.5" /> Reject
                        </button>
                      </div>
                    )}
                    {approved && <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Accepted</span>}
                    {rejected && <span className="text-[10px] text-red-400 font-mono flex items-center gap-1"><X className="w-2.5 h-2.5" /> Rejected</span>}
                  </div>
                  {/* Diff view */}
                  <div className="p-3 font-mono text-[10px] space-y-0.5">
                    {edit.before.split('\n').map((line, li) => (
                      <div key={`b${li}`} className="flex gap-2">
                        <span className="text-red-500 w-3 shrink-0">−</span>
                        <span className="text-red-300/70 line-through">{line}</span>
                      </div>
                    ))}
                    {edit.after.split('\n').map((line, li) => (
                      <div key={`a${li}`} className="flex gap-2">
                        <span className="text-emerald-500 w-3 shrink-0">+</span>
                        <span className="text-emerald-300/80">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Apply button */}
          {allDecided && (
            <div className="flex items-center gap-3">
              <button onClick={() => setPhase('applied')}
                className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Check className="w-4 h-4" />
                Apply {approvedEdits.size} accepted edit{approvedEdits.size !== 1 ? 's' : ''}
              </button>
              <p className="text-xs text-gray-600 font-mono">
                {rejectedEdits.size > 0 && `${rejectedEdits.size} edit${rejectedEdits.size > 1 ? 's' : ''} rejected`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Applied */}
      {phase === 'applied' && agentPlan && (
        <div className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-300 font-medium">{agentPlan.summary}</p>
              <p className="text-xs text-gray-600 font-mono mt-1">
                {approvedEdits.size} file edit{approvedEdits.size !== 1 ? 's' : ''} applied.
                {rejectedEdits.size > 0 && ` ${rejectedEdits.size} rejected.`}
              </p>
            </div>
          </div>
          <button onClick={() => { setPhase('idle'); setAgentPlan(null); setTask(''); setError(null); }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded-xl text-sm transition-colors border border-white/10">
            <RotateCcw className="w-3.5 h-3.5" /> Try another task
          </button>
        </div>
      )}

      {/* IDE — shown in review/applied modes */}
      {(phase === 'review' || phase === 'applied') && (
        <VSCodeChrome
          activeFile={activeFile}
          onFileClick={setActiveFile}
          files={['app.py', 'auth.py', 'db.py']}
          statusText="Agent mode — reviewing changes"
        >
          <EditorLines content={PROJECT_FILES[activeFile]} />
        </VSCodeChrome>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function IDEEvolution() {
  const [activeMode, setActiveMode] = useState<Mode>('autocomplete');
  const cfg = MODE_CONFIG[activeMode];

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">VS Code Forks & IDE Evolution</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            The editor became the AI surface. But "AI in the editor" went through three distinct
            generations — each one solving a frustration the previous left behind.
            The demos below run against a real Flask project.
          </p>
        </div>

        {/* Evolution arc */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-gray-600 font-mono uppercase tracking-widest mb-5">The progression</p>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {MODE_ORDER.map((mode, i) => {
              const c = MODE_CONFIG[mode];
              return (
                <React.Fragment key={mode}>
                  <div className={cn('flex-1 p-4 rounded-xl border transition-all cursor-pointer', c.accent,
                    activeMode === mode ? 'ring-1 ring-white/20' : 'opacity-60 hover:opacity-90'
                  )} onClick={() => setActiveMode(mode)}>
                    <div className={cn('flex items-center gap-2 mb-1', c.color)}>
                      {c.icon}
                      <span className="text-xs font-semibold">{c.label}</span>
                      <span className="text-[9px] opacity-60 ml-auto font-mono">{c.year}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{c.tagline}</p>
                  </div>
                  {i < MODE_ORDER.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-700 shrink-0 hidden md:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>

        {/* Mode tabs */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 bg-[#121212] p-1 rounded-xl border border-white/10 w-fit">
            {MODE_ORDER.map(mode => {
              const c = MODE_CONFIG[mode];
              return (
                <button key={mode} onClick={() => setActiveMode(mode)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeMode === mode
                      ? cn('bg-white/10 shadow-sm', c.color)
                      : 'text-gray-600 hover:text-gray-400'
                  )}>
                  {c.icon}
                  {c.label}
                  <span className="text-[9px] font-mono opacity-50">{c.year}</span>
                </button>
              );
            })}
          </div>

          {/* Mode description */}
          <div className={cn('rounded-2xl border p-5 space-y-2', cfg.accent)}>
            <p className="text-sm text-gray-300 leading-relaxed">{cfg.description}</p>
            <div className="flex items-start gap-2 pt-1">
              <Info className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 font-mono leading-relaxed">{cfg.limitation}</p>
            </div>
          </div>

          {/* Demo */}
          {activeMode === 'autocomplete' && <AutocompleteDemo />}
          {activeMode === 'chat'         && <ChatDemo />}
          {activeMode === 'agent'        && <AgentDemo />}
        </section>

        {/* Tool comparison table */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">The IDE landscape (2025)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Tool</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Model backend</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Best for</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Open source</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tool: 'GitHub Copilot',  type: 'Extension', model: 'GPT-4o / Claude',     best: 'Ubiquity, enterprise',    oss: '—'   },
                  { tool: 'Cursor',          type: 'Fork',      model: 'Claude / GPT-4o',      best: 'Chat + multi-file edits', oss: '—'   },
                  { tool: 'Windsurf',        type: 'Fork',      model: 'Claude / GPT-4o',      best: 'Free tier, fast',         oss: '—'   },
                  { tool: 'Continue',        type: 'Extension', model: 'Any via OpenRouter',   best: 'Teaching, open config',   oss: '✓'   },
                  { tool: 'Zed',             type: 'Editor',    model: 'Claude Sonnet',         best: 'Performance, Rust',       oss: '✓'   },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-2.5 text-gray-300 font-medium">{row.tool}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.type}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.model}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.best}</td>
                    <td className={cn('px-4 py-2.5', row.oss === '✓' ? 'text-emerald-400' : 'text-gray-700')}>{row.oss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-[10px] text-gray-700 font-mono">
              For teaching: Continue is recommended — model-agnostic, works with OpenRouter, fully open-source.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}