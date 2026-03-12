import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutTemplate, Database, Code2, Zap, ArrowRight, Search, Loader2, FileCode2, ChevronDown, ChevronUp, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import { cn } from './Layout';
import Markdown from 'react-markdown';

// ─── Fake Codebase ────────────────────────────────────────────────────────────

const CODEBASE: { filename: string; language: string; content: string }[] = [
  {
    filename: 'src/auth/session.ts',
    language: 'typescript',
    content: `import { db } from '../db/client';
import { randomBytes } from 'crypto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return token;
}

export async function validateSession(token: string): Promise<string | null> {
  const result = await db.query(
    'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  return result.rows[0]?.user_id ?? null;
}

export async function revokeSession(token: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE token = $1', [token]);
}`,
  },
  {
    filename: 'src/auth/login.ts',
    language: 'typescript',
    content: `import bcrypt from 'bcrypt';
import { db } from '../db/client';
import { createSession } from './session';

export interface LoginResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await db.query(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email]
  );
  if (!user.rows[0]) {
    return { success: false, error: 'Invalid email or password' };
  }
  const valid = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!valid) {
    return { success: false, error: 'Invalid email or password' };
  }
  const token = await createSession(user.rows[0].id);
  return { success: true, token };
}

export async function logout(token: string): Promise<void> {
  await revokeSession(token);
}`,
  },
  {
    filename: 'src/db/client.ts',
    language: 'typescript',
    content: `import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
  process.exit(-1);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
};`,
  },
  {
    filename: 'src/api/routes/users.ts',
    language: 'typescript',
    content: `import { Router } from 'express';
import { login, logout } from '../../auth/login';
import { validateSession } from '../../auth/session';

export const userRouter = Router();

userRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const result = await login(email, password);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }
  res.cookie('session', result.token!, { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ success: true });
});

userRouter.post('/logout', async (req, res) => {
  const token = req.cookies.session;
  if (token) await logout(token);
  res.clearCookie('session');
  res.json({ success: true });
});

userRouter.get('/me', async (req, res) => {
  const token = req.cookies.session;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const userId = await validateSession(token);
  if (!userId) return res.status(401).json({ error: 'Session expired' });
  res.json({ userId });
});`,
  },
  {
    filename: 'src/middleware/rateLimit.ts',
    language: 'typescript',
    content: `import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../db/redis';

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args: string[]) => redisClient.sendCommand(args) }),
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});`,
  },
  {
    filename: 'src/auth/passwordReset.ts',
    language: 'typescript',
    content: `import { db } from '../db/client';
import { sendEmail } from '../services/email';
import { randomBytes } from 'crypto';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!user.rows[0]) return; // Don't reveal if email exists
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token=$2, expires_at=$3',
    [user.rows[0].id, token, expiresAt]
  );
  await sendEmail({ to: email, subject: 'Reset your password', token });
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
  const result = await db.query(
    'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  if (!result.rows[0]) return false;
  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, result.rows[0].user_id]);
  await db.query('DELETE FROM password_resets WHERE user_id = $1', [result.rows[0].user_id]);
  return true;
}`,
  },
];

// ─── BM25 Implementation ──────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'in', 'it', 'of', 'to', 'and', 'or', 'for', 'with', 'this', 'that', 'are', 'was', 'be', 'as', 'at', 'by', 'we', 'you', 'do', 'how', 'what', 'can', 'does', 'has', 'have', 'not', 'from', 'if', 'on', 'my']);

function filterTokens(tokens: string[]): string[] {
  return tokens.filter(t => !STOPWORDS.has(t));
}

interface BM25Index {
  docs: { filename: string; tokens: string[]; content: string }[];
  df: Map<string, number>;
  avgDl: number;
  N: number;
}

function buildBM25Index(docs: typeof CODEBASE): BM25Index {
  const tokenized = docs.map(d => ({
    filename: d.filename,
    tokens: filterTokens(tokenize(d.filename + ' ' + d.content)),
    content: d.content,
  }));

  const df = new Map<string, number>();
  for (const doc of tokenized) {
    const seen = new Set(doc.tokens);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const avgDl = tokenized.reduce((s, d) => s + d.tokens.length, 0) / tokenized.length;

  return { docs: tokenized, df, avgDl, N: tokenized.length };
}

function bm25Score(index: BM25Index, queryTokens: string[], docIdx: number, k1 = 1.5, b = 0.75): number {
  const doc = index.docs[docIdx];
  const dl = doc.tokens.length;
  const tf_map = new Map<string, number>();
  for (const t of doc.tokens) tf_map.set(t, (tf_map.get(t) ?? 0) + 1);

  let score = 0;
  for (const qt of queryTokens) {
    const tf = tf_map.get(qt) ?? 0;
    if (tf === 0) continue;
    const df = index.df.get(qt) ?? 0;
    const idf = Math.log((index.N - df + 0.5) / (df + 0.5) + 1);
    const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / index.avgDl)));
    score += idf * tfNorm;
  }
  return score;
}

function retrieveTopK(index: BM25Index, query: string, k: number): { filename: string; content: string; score: number; matchedTerms: string[] }[] {
  const qTokens = filterTokens(tokenize(query));
  const scores = index.docs.map((doc, i) => {
    const score = bm25Score(index, qTokens, i);
    const matchedTerms = qTokens.filter(qt => doc.tokens.includes(qt));
    return { filename: doc.filename, content: CODEBASE[i].content, score, matchedTerms };
  });
  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ─── Singleton index ──────────────────────────────────────────────────────────

const INDEX = buildBM25Index(CODEBASE);

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChunkCard({ filename, content, score, matchedTerms, rank }: {
  filename: string; content: string; score: number; matchedTerms: string[]; rank: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-emerald-600 font-bold shrink-0">#{rank}</span>
        <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-emerald-300 truncate flex-1">{filename}</span>
        <span className="text-emerald-600 shrink-0">score: {score.toFixed(2)}</span>
        {open ? <ChevronUp className="w-3 h-3 text-gray-600 shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-emerald-500/20 px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {matchedTerms.map(t => (
              <span key={t} className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">{t}</span>
            ))}
          </div>
          <pre className="text-gray-500 whitespace-pre-wrap break-all leading-relaxed overflow-x-auto max-h-48">{content}</pre>
        </div>
      )}
    </div>
  );
}

function ResponsePanel({ label, color, icon, response, loading, chunks }: {
  label: string;
  color: 'red' | 'emerald';
  icon: React.ReactNode;
  response: string | null;
  loading: boolean;
  chunks?: ReturnType<typeof retrieveTopK>;
}) {
  const colors = {
    red:     { border: 'border-red-500/20',     bg: 'bg-red-500/5',     text: 'text-red-400',     badge: 'bg-red-500/10 border-red-500/20' },
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20' },
  }[color];

  return (
    <div className={cn("flex flex-col rounded-2xl border overflow-hidden", colors.border, colors.bg)}>
      <div className={cn("flex items-center gap-2 px-5 py-3 border-b", colors.border)}>
        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center border text-sm", colors.badge, colors.text)}>
          {icon}
        </span>
        <span className={cn("font-semibold text-sm", colors.text)}>{label}</span>
      </div>

      {/* Retrieved chunks (RAG only) */}
      {chunks && chunks.length > 0 && (
        <div className="px-4 py-3 border-b border-emerald-500/20 space-y-2">
          <p className="text-[10px] text-emerald-600 uppercase tracking-widest font-mono mb-2">
            Injected context — {chunks.length} chunk{chunks.length !== 1 ? 's' : ''} retrieved
          </p>
          {chunks.map((c, i) => (
            <ChunkCard key={c.filename} rank={i + 1} {...c} />
          ))}
        </div>
      )}

      {/* Response */}
      <div className="flex-1 p-5 min-h-[160px]">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating response...</span>
          </div>
        ) : response ? (
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <Markdown>{response}</Markdown>
          </div>
        ) : (
          <p className="text-gray-700 text-sm italic">Response will appear here after you run the comparison.</p>
        )}
      </div>
    </div>
  );
}

// ─── Example Queries ──────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  'How does session expiry work in this codebase?',
  'Where is the login rate limiting implemented?',
  'How is the database connection pool configured?',
  'Walk me through what happens when a user logs out',
  'How does password reset work and how long is the token valid?',
];

// ─── RAG Demo ─────────────────────────────────────────────────────────────────

function RAGDemo() {
  const [query, setQuery] = useState('');
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [loadingRag, setLoadingRag] = useState(false);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [ragResponse, setRagResponse] = useState<string | null>(null);
  const [retrievedChunks, setRetrievedChunks] = useState<ReturnType<typeof retrieveTopK>>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const handleRun = useCallback(async (queryText?: string) => {
    const q = (queryText ?? query).trim();
    if (!q) return;
    if (queryText) setQuery(queryText);

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    setRawResponse(null);
    setRagResponse(null);
    setRetrievedChunks([]);
    setHasRun(true);
    setLoadingRaw(true);
    setLoadingRag(true);

    // BM25 retrieval — instant
    const chunks = retrieveTopK(INDEX, q, 3);
    setRetrievedChunks(chunks);

    const model = 'openai/gpt-4o-mini';

    // Run both requests in parallel
    const rawPromise = fetchOpenRouterChatFull(
      [{ role: 'user', content: q }],
      model,
      apiKey,
      []
    ).then(msg => {
      setRawResponse(msg.content ?? '(no response)');
      setLoadingRaw(false);
    }).catch(err => {
      setRawResponse(`Error: ${err.message}`);
      setLoadingRaw(false);
    });

    const contextBlock = chunks.length > 0
      ? `You are a helpful code assistant. Use the following source files to answer the question.\n\n${chunks.map(c => `--- ${c.filename} ---\n${c.content}`).join('\n\n')}\n\n---\n\nQuestion: ${q}`
      : q;

    const ragPromise = fetchOpenRouterChatFull(
      [{ role: 'user', content: contextBlock }],
      model,
      apiKey,
      []
    ).then(msg => {
      setRagResponse(msg.content ?? '(no response)');
      setLoadingRag(false);
    }).catch(err => {
      setRagResponse(`Error: ${err.message}`);
      setLoadingRag(false);
    });

    await Promise.all([rawPromise, ragPromise]);
  }, [query]);

  return (
    <div className="space-y-5">

      {/* Codebase preview */}
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Simulated Codebase — {CODEBASE.length} files indexed</span>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {CODEBASE.map(f => (
            <span key={f.filename} className="text-xs font-mono text-gray-600 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3" />{f.filename}
            </span>
          ))}
        </div>
      </div>

      {/* Query input */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
            placeholder="Ask a question about the codebase..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-mono"
          />
          <button
            onClick={() => handleRun()}
            disabled={!query.trim() || loadingRaw || loadingRag}
            className="px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            {(loadingRaw || loadingRag) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Compare
          </button>
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleRun(q)}
              disabled={loadingRaw || loadingRag}
              className="text-xs text-gray-600 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed truncate max-w-[260px] font-mono"
              title={q}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* BM25 scoring explainer — shown after first run */}
      {hasRun && retrievedChunks.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 flex items-start gap-3">
          <Search className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-mono">
              <span className="text-gray-300">BM25 retrieval</span> ranked {CODEBASE.length} files by term frequency × inverse document frequency.
              Top {retrievedChunks.length} chunks injected into the RAG prompt.
              Matched terms: <span className="text-emerald-400">{[...new Set(retrievedChunks.flatMap(c => c.matchedTerms))].join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Side-by-side responses */}
      {hasRun && (
        <div className="grid md:grid-cols-2 gap-5">
          <ResponsePanel
            label="Without RAG"
            color="red"
            icon={<span className="text-xs">✗</span>}
            response={rawResponse}
            loading={loadingRaw}
          />
          <ResponsePanel
            label="With RAG (BM25)"
            color="emerald"
            icon={<Search className="w-3.5 h-3.5" />}
            response={ragResponse}
            loading={loadingRag}
            chunks={retrievedChunks}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Scaffolds() {
  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Scaffolds & Harnesses</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Raw AI models are powerful, but they lack context. To be useful for software engineering,
            they need to understand your entire codebase, not just the current file. This is where
            IDE forks (like Cursor and Windsurf) and advanced harnesses come in.
          </p>
        </div>

        {/* The Context Problem */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Database className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white">The Context Problem</h3>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            A standard LLM only knows what you paste into the prompt. If you ask it to "fix the bug in the auth flow,"
            it doesn't know what your auth flow looks like, what libraries you use, or where the files are located.
            Pasting 50 files manually is impossible due to token limits and human effort.
          </p>
        </section>

        {/* How IDEs Solve This */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-white">How Modern AI IDEs Solve This</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
              <Code2 className="w-8 h-8 text-emerald-400 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">1. Codebase Indexing (RAG)</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                The IDE parses your entire project, chunks the code, and ranks chunks by relevance using
                BM25 (keyword scoring) or dense embeddings. The top-k chunks get injected into the model's
                prompt automatically.
              </p>
            </div>
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
              <LayoutTemplate className="w-8 h-8 text-blue-400 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">2. Editor Context</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                The AI knows exactly where your cursor is, what file you have open, what errors the
                linter is throwing, and your recent terminal output. This implicit context drastically
                reduces the need for you to explain the state of your workspace.
              </p>
            </div>
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
              <Zap className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">3. Fast Apply / Diffing</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Instead of outputting a giant block of code for you to copy-paste, the harness generates
                a structured diff. It then automatically applies these changes to your files, allowing
                you to simply hit "Accept" or "Reject".
              </p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <h4 className="text-emerald-400 font-medium mb-2">The Result</h4>
              <p className="text-gray-300 text-sm">
                The model transforms from a "smart chatbot" into an "integrated pair programmer."
              </p>
            </div>
          </div>
        </section>

        {/* Visual Flow */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-white mb-6">The Anatomy of a Scaffolded Request</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-mono">
            <div className="bg-black/50 border border-white/10 p-4 rounded-lg w-full md:w-1/4 text-center text-gray-300">
              User Prompt
              <div className="text-xs text-gray-500 mt-2">"Fix the login bug"</div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-600 hidden md:block" />
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg w-full md:w-1/3 text-center text-emerald-400">
              Harness Injects Context
              <div className="text-xs text-emerald-500/70 mt-2">
                + auth.ts (RAG)<br />
                + Linter Error (Active)<br />
                + Cursor Position
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-600 hidden md:block" />
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg w-full md:w-1/4 text-center text-blue-400">
              Model Generates Diff
              <div className="text-xs text-blue-500/70 mt-2">
                @@ -15,3 +15,4 @@<br />
                + await session.save()
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive RAG Demo ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h3 className="text-2xl font-semibold text-white">Live RAG Demo</h3>
          </div>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Ask any question about the simulated codebase below. The same question is sent to the model
            twice — once with no context, once with the top-3 files retrieved via{' '}
            <span className="font-mono text-gray-400">BM25</span> scoring injected into the prompt.
            Expand the retrieved chunks to see exactly what the model received.
          </p>
          <RAGDemo />
        </section>

      </div>
    </div>
  );
}