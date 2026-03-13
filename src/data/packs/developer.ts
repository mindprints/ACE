import type { ContentPack } from '../contentPack'

export const developerPack: ContentPack = {
  id: 'developer',
  label: 'Developer',
  description: 'Code-focused examples for engineers learning AI-assisted development.',

  // ─── Model Comparison ────────────────────────────────────────────────────────
  modelComparison: {
    defaultPrompt: 'Write a Python function to calculate the Fibonacci sequence using memoization.',
  },

  // ─── Scaffolds (RAG demo) ────────────────────────────────────────────────────
  scaffolds: {
    domainLabel: 'Codebase',
    exampleQueries: [
      'How long do sessions last and how are they stored?',
      'How does rate limiting work for login attempts?',
      'What are the database pool settings?',
      'How does the logout flow work end to end?',
      'How is a password reset token created?',
    ],
    codebase: [
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
    ],
  },

  // ─── Agents (Skills demo) ────────────────────────────────────────────────────
  agents: {
    exampleTasks: [
      'Add a new StatusBadge component that shows online/offline/loading states',
      'Write a useLocalStorage hook with TypeScript generics',
      'Create a ProgressBar component with animated fill',
      'Add a CopyButton component that copies text to clipboard with a checkmark feedback',
    ],
    skills: {
      react_component: {
        name: 'react-component',
        description: 'Generates React components matching the ACE design system — Tailwind dark theme, cn() utility, emerald accent, consistent card/button patterns.',
        triggerKeywords: ['component', 'react', 'ui', 'card', 'button', 'form', 'input', 'modal', 'banner', 'badge', 'progress', 'copy'],
        content: `---
name: react-component
description: Create React components following the ACE project's design system.
triggers: [component, react, ui, card, button, form, input, modal]
---

# React Component Skill

## Project Context
This is the ACE (AI Coding Evolution) educational app. It uses:
- React + TypeScript
- Tailwind CSS (dark theme, bg-[#0a0a0a] / bg-[#121212])
- The \`cn()\` utility from \`./Layout\` for conditional classes
- Lucide React for icons
- Emerald (#10b981) as the primary accent color
- White/10, white/20 for borders

## Component Rules

### File structure
\`\`\`tsx
import React, { useState } from 'react';
import { SomeIcon } from 'lucide-react';
import { cn } from './Layout';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return ( ... );
}
\`\`\`

### Card pattern
\`\`\`tsx
<div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
  ...
</div>
\`\`\`

### Button patterns
Primary: \`className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"\`
Secondary: \`className="px-4 py-2 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"\`
Danger: \`className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-colors"\`

### Input pattern
\`\`\`tsx
<input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
\`\`\`

### Color palette
- Background: bg-[#0a0a0a] (page), bg-[#121212] (cards), bg-black/50 (inputs)
- Text: text-white (headings), text-gray-300 (body), text-gray-400 (secondary), text-gray-600 (placeholder)
- Accent: text-emerald-400, bg-emerald-600, border-emerald-500/20
- Status: text-red-400 (error), text-amber-400 (warning), text-blue-400 (info)
- Borders: border-white/10 (default), border-white/20 (hover)

## Output
Always output a single complete .tsx file. No explanatory prose. Start with imports, end with the export.`,
      },

      api_service: {
        name: 'api-service',
        description: "Creates TypeScript API service files using the project's fetch/error handling patterns and async conventions.",
        triggerKeywords: ['api', 'fetch', 'service', 'request', 'endpoint', 'openrouter', 'http', 'hook', 'localstorage'],
        content: `---
name: api-service
description: Create TypeScript API service files following ACE project conventions.
triggers: [api, fetch, service, request, endpoint, openrouter, http]
---

# API Service Skill

## Project Context
ACE uses plain fetch() with async/await. API keys come from localStorage.
Services live in src/services/. Custom hooks live in src/hooks/.

## Service File Pattern
\`\`\`typescript
const BASE_URL = 'https://api.example.com';

export interface ResponseType {
  id: string;
  data: string;
}

export async function fetchSomething(
  param: string,
  apiKey: string
): Promise<ResponseType> {
  const response = await fetch(\`\${BASE_URL}/endpoint\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({ param }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? \`HTTP \${response.status}\`);
  }

  return response.json();
}
\`\`\`

## API Key Pattern
Always retrieve from localStorage:
\`\`\`typescript
const apiKey = localStorage.getItem('openrouter_api_key');
if (!apiKey) throw new Error('API key not configured');
\`\`\`

## Output
Single complete .ts file. Include all types. Export all public functions.`,
      },

      supabase_integration: {
        name: 'supabase-integration',
        description: 'Generates Supabase database queries, RLS policies, and TypeScript client code following safe patterns.',
        triggerKeywords: ['supabase', 'database', 'query', 'rls', 'postgres', 'table', 'migration'],
        content: `---
name: supabase-integration
description: Write Supabase queries and RLS policies following security best practices.
triggers: [supabase, database, query, rls, postgres, table, migration]
---

# Supabase Integration Skill

## Client Setup
\`\`\`typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
\`\`\`

## Query Patterns
Always use typed returns and handle errors inline:
\`\`\`typescript
const { data, error } = await supabase
  .from('table_name')
  .select('id, title, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (error) throw new Error(error.message);
return data;
\`\`\`

## RLS Policy Pattern
\`\`\`sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rows" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own rows" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);
\`\`\`

## CRITICAL: authored_by pattern
When inserting, always set authored_by explicitly:
\`\`\`typescript
await supabase.from('proposals').insert({
  title,
  authored_by: user.id,   // explicit — never rely on trigger
  created_by: user.id,
});
\`\`\`

## Output
Single .ts file with typed client, all query functions exported, inline error handling.`,
      },
    },
  },

  // ─── AgentsMD ────────────────────────────────────────────────────────────────
  agentsMD: {
    exampleTasks: [
      'Add a new StatusBadge component that shows online/offline/loading states',
      'Write a useLocalStorage hook with TypeScript generics',
      'Create a ProgressBar component with animated fill',
      'Add a CopyButton component that copies text to clipboard with a checkmark feedback',
    ],
    defaultTemplate: `# AGENTS.md — ACE Project

## Build & Test
- Install: \`npm install\`
- Dev server: \`npm run dev\` (Vite, port 5173)
- Build: \`npm run build\` (TypeScript check then Vite build)
- No test suite yet — validate by running \`npm run build\` cleanly

## Project Structure
- \`src/components/\` — one file per curriculum section (Setup, ToolCalling, MCP, etc.)
- \`src/services/openRouter.ts\` — all AI API calls go through here
- \`src/constants.ts\` — CURRICULUM array and POPULAR_MODELS list
- \`src/types.ts\` — shared TypeScript interfaces

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS (dark theme, bg-[#0a0a0a] / bg-[#121212])
- Lucide React for all icons
- \`cn()\` from \`./Layout\` for conditional classNames
- OpenRouter API (key stored in localStorage as \`openrouter_api_key\`)

## Code Conventions
- Emerald (#10b981) is the primary accent: \`text-emerald-400\`, \`bg-emerald-600\`
- All borders use opacity: \`border-white/10\` (default), \`border-white/20\` (hover)
- Cards: \`bg-[#121212] border border-white/10 rounded-2xl p-6\`
- Inputs: \`bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white\`
- Buttons: \`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl\`
- Always use TypeScript interfaces for props; no \`any\` unless necessary
- Export functions with named exports, not default

## Boundaries
- Never touch \`src/services/openRouter.ts\` unless fixing a bug there
- Never hardcode API keys — always read from localStorage
- Ask before adding new npm dependencies
- Do not modify \`App.tsx\` routing without also updating \`src/constants.ts\`
`,
  },

  // ─── CLI ─────────────────────────────────────────────────────────────────────
  cli: {
    envLabel: 'TypeScript/Node.js project',
    simulatedEnv: `You are simulating a bash terminal running inside a TypeScript/Node.js project.
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
Node: v20.11.0, npm: 10.2.4`,
    examples: [
      'Find all TODO comments in the src folder',
      'Show me the git log for the last 5 commits',
      'Count lines of TypeScript code in src/',
      'List all npm scripts in package.json',
      'Find which files import from the db/client module',
      'Show all files modified in the last 24 hours',
      'Check if there are any unused imports in auth/',
      'Create a summary of the project structure',
    ],
  },

  // ─── BrowserUse ──────────────────────────────────────────────────────────────
  browserUse: {
    exampleTasks: [
      'Go to news.ycombinator.com and summarise the top 3 AI stories',
      'Search Wikipedia for "Model Context Protocol" and give me the opening paragraph',
      'Visit openrouter.ai and list the available free-tier models',
      'Go to github.com/trending and find the top Python repository today',
    ],
  },

  // ─── MultiAgent ──────────────────────────────────────────────────────────────
  multiAgent: {
    defaultTask: 'Write a Python script to scrape a website and save the links to a CSV file.',
    agentALabel: 'Coder',
    agentBLabel: 'Reviewer',
    agentAPrompt: `You are an expert Senior Developer.
Your task is to write the code for the user's request.
Provide ONLY the code and a very brief explanation. Do not add fluff.`,
    agentBPrompt: `You are a strict Security and Performance Code Reviewer.
Review the following code provided by the Coder.
1. Point out exactly ONE critical improvement (security, performance, or best practice).
2. Provide the final, refactored code incorporating your improvement.`,
  },

  // ─── MCP ─────────────────────────────────────────────────────────────────────
  mcp: {
    servers: [
      {
        id: 'filesystem',
        name: 'Local Filesystem',
        color: 'amber',
        description: 'Exposes your local files and directories as readable resources.',
        version: '1.0.0',
        resources: [
          { uri: 'file:///home/user/project/README.md', name: 'README.md', mimeType: 'text/markdown' },
          { uri: 'file:///home/user/project/src/index.ts', name: 'index.ts', mimeType: 'text/typescript' },
          { uri: 'file:///home/user/.env', name: '.env', mimeType: 'text/plain' },
        ],
        tools: [
          {
            name: 'read_file',
            description: 'Read the complete contents of a file.',
            inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Absolute file path' } }, required: ['path'] },
            exampleArgs: { path: '/home/user/project/README.md' },
            mockResult: '# My Project\n\nA TypeScript application.\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```',
          },
          {
            name: 'list_directory',
            description: 'Get a listing of all files in a directory.',
            inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Directory path' } }, required: ['path'] },
            exampleArgs: { path: '/home/user/project' },
            mockResult: '["README.md", "package.json", "tsconfig.json", "src/", "node_modules/"]',
          },
          {
            name: 'write_file',
            description: 'Create or overwrite a file with new content.',
            inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
            exampleArgs: { path: '/home/user/project/notes.txt', content: 'Hello from MCP!' },
            mockResult: '{"success": true, "bytesWritten": 16}',
          },
        ],
      },
      {
        id: 'github',
        name: 'GitHub API',
        color: 'blue',
        description: 'Read repos, issues, PRs and commit to branches via GitHub REST.',
        version: '2.1.0',
        resources: [
          { uri: 'github://repo/mindprints/ACE', name: 'mindprints/ACE', mimeType: 'application/json' },
          { uri: 'github://issues/mindprints/ACE', name: 'Open Issues', mimeType: 'application/json' },
        ],
        tools: [
          {
            name: 'list_repos',
            description: 'List repositories for a GitHub user or organization.',
            inputSchema: { type: 'object', properties: { owner: { type: 'string' } }, required: ['owner'] },
            exampleArgs: { owner: 'mindprints' },
            mockResult: '[{"name":"ACE","stars":0,"language":"TypeScript","private":false},{"name":"dotfiles","stars":2,"language":"Shell","private":false}]',
          },
          {
            name: 'get_file_contents',
            description: 'Get the contents of a file in a GitHub repository.',
            inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' } }, required: ['owner', 'repo', 'path'] },
            exampleArgs: { owner: 'mindprints', repo: 'ACE', path: 'package.json' },
            mockResult: '{"name":"ace","version":"0.1.0","scripts":{"dev":"vite","build":"tsc && vite build"}}',
          },
          {
            name: 'create_issue',
            description: 'Create a new issue in a repository.',
            inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] },
            exampleArgs: { owner: 'mindprints', repo: 'ACE', title: 'Add dark mode support', body: 'Users have requested a dark theme option.' },
            mockResult: '{"id": 1042, "number": 3, "title": "Add dark mode support", "state": "open", "url": "https://github.com/mindprints/ACE/issues/3"}',
          },
        ],
      },
      {
        id: 'postgres',
        name: 'Postgres DB',
        color: 'emerald',
        description: 'Query your database schema and run read-only SQL through the model.',
        version: '0.9.2',
        resources: [
          { uri: 'postgres://localhost/myapp/schema', name: 'Database Schema', mimeType: 'application/json' },
          { uri: 'postgres://localhost/myapp/tables/users', name: 'users table', mimeType: 'application/json' },
        ],
        tools: [
          {
            name: 'query',
            description: 'Run a read-only SQL query against the database.',
            inputSchema: { type: 'object', properties: { sql: { type: 'string', description: 'SQL SELECT statement' } }, required: ['sql'] },
            exampleArgs: { sql: 'SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5' },
            mockResult: '[{"id":1,"email":"alice@example.com","created_at":"2024-01-15"},{"id":2,"email":"bob@example.com","created_at":"2024-01-16"},{"id":3,"email":"carol@example.com","created_at":"2024-01-17"}]',
          },
          {
            name: 'list_tables',
            description: 'List all tables and their column definitions.',
            inputSchema: { type: 'object', properties: { schema: { type: 'string', description: 'Schema name (default: public)' } }, required: [] },
            exampleArgs: { schema: 'public' },
            mockResult: '[{"table":"users","columns":["id","email","name","created_at"]},{"table":"posts","columns":["id","user_id","title","body","published_at"]},{"table":"sessions","columns":["id","user_id","token","expires_at"]}]',
          },
          {
            name: 'explain',
            description: 'Get the query execution plan for a SQL statement.',
            inputSchema: { type: 'object', properties: { sql: { type: 'string' } }, required: ['sql'] },
            exampleArgs: { sql: 'SELECT * FROM posts WHERE user_id = 42' },
            mockResult: 'Seq Scan on posts (cost=0.00..24.50 rows=3 width=248)\n  Filter: (user_id = 42)\nPlanning Time: 0.8 ms',
          },
        ],
      },
    ],
  },

  // ─── Tool Calling ─────────────────────────────────────────────────────────────
  toolCalling: {
    examplePrompts: [
      "What's the weather like in Tokyo right now?",
      "What's the current price of NVDA stock?",
      'Calculate 15% of 847 then add 20',
      'Search for what Model Context Protocol is',
      'Compare the weather in London and Dubai',
    ],
    initialMessage: "Hello! I'm an AI with **real** tools at my disposal. I can check live weather, stock prices, do maths, and search the web. What would you like to know?",
  },
}
