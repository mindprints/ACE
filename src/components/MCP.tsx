import React, { useState, useRef, useEffect } from 'react';
import { Network, Plug, Server, FileText, ArrowRight, Database, Globe, ChevronRight, Play, RotateCcw, Terminal, Loader2, CheckCircle2, Code2, FolderOpen, GitBranch, Table2, X, Mail, Calendar, BookOpen } from 'lucide-react';
import { cn } from './Layout';
import { useContentPack } from '../context/ContentPackContext';
import type { MCPServer } from '../data/contentPack';

// ─── Server icon map (server ID → icon element) ──────────────────────────────
// Icons stay in the component since they're JSX — server data lives in content packs.

const SERVER_ICONS: Record<string, React.ReactNode> = {
  filesystem: <FolderOpen className="w-5 h-5" />,
  github:     <GitBranch className="w-5 h-5" />,
  postgres:   <Table2 className="w-5 h-5" />,
  documents:  <BookOpen className="w-5 h-5" />,
  calendar:   <Calendar className="w-5 h-5" />,
  email:      <Mail className="w-5 h-5" />,
};

const DEFAULT_SERVER_ICON = <Server className="w-5 h-5" />;

// Server data is provided by the active content pack via useContentPack().

// ─── JSON-RPC Message Builder ─────────────────────────────────────────────────

let msgIdCounter = 1;

function buildRequest(method: string, params: any) {
  return { jsonrpc: '2.0', id: msgIdCounter++, method, params };
}

function buildResponse(id: number, result: any) {
  return { jsonrpc: '2.0', id, result };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LogEntry = {
  id: string;
  direction: 'client→server' | 'server→client';
  label: string;
  payload: any;
  ts: number;
  highlight?: boolean;
};

type ColorKey = 'amber' | 'blue' | 'emerald';

const COLOR: Record<ColorKey, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300',   dot: 'bg-blue-400'  },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400' },
};

// ─── Protocol Log Panel ───────────────────────────────────────────────────────

function ProtocolLog({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
        <Terminal className="w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-600 text-sm font-mono">Protocol log is empty.</p>
        <p className="text-gray-700 text-xs mt-1">Connect to a server to see JSON-RPC messages.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Protocol Log — JSON-RPC 2.0</span>
        <button onClick={onClear} className="text-gray-600 hover:text-gray-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {entries.map(entry => (
          <div key={entry.id} className={cn(
            "rounded-lg border p-3",
            entry.highlight
              ? "border-emerald-500/40 bg-emerald-500/5"
              : entry.direction === 'client→server'
                ? "border-blue-500/20 bg-blue-500/5"
                : "border-purple-500/20 bg-purple-500/5"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                entry.direction === 'client→server' ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
              )}>
                {entry.direction === 'client→server' ? '↑ CLIENT' : '↓ SERVER'}
              </span>
              <span className="text-gray-400 font-semibold">{entry.label}</span>
              <span className="ml-auto text-gray-700">{new Date(entry.ts).toLocaleTimeString()}</span>
            </div>
            <pre className="text-gray-400 whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ─── Tool Playground ──────────────────────────────────────────────────────────

function ToolPlayground({ server, onLog }: { server: MCPServer; onLog: (entry: LogEntry) => void }) {
  const [selectedTool, setSelectedTool] = useState(server.tools[0]);
  const [argsJson, setArgsJson] = useState(JSON.stringify(server.tools[0].exampleArgs, null, 2));
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [argError, setArgError] = useState<string | null>(null);
  const color = COLOR[server.color as ColorKey];

  useEffect(() => {
    setSelectedTool(server.tools[0]);
    setArgsJson(JSON.stringify(server.tools[0].exampleArgs, null, 2));
    setResult(null);
    setArgError(null);
  }, [server.id]);

  const handleToolSelect = (tool: typeof server.tools[0]) => {
    setSelectedTool(tool);
    setArgsJson(JSON.stringify(tool.exampleArgs, null, 2));
    setResult(null);
    setArgError(null);
  };

  const handleCall = async () => {
    let parsedArgs: any;
    try {
      parsedArgs = JSON.parse(argsJson);
      setArgError(null);
    } catch {
      setArgError('Invalid JSON — check your arguments.');
      return;
    }

    setRunning(true);
    setResult(null);

    const reqId = msgIdCounter;
    const request = buildRequest('tools/call', { name: selectedTool.name, arguments: parsedArgs });
    onLog({ id: `req-${reqId}-${Date.now()}`, direction: 'client→server', label: `tools/call → ${selectedTool.name}`, payload: request, ts: Date.now() });

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const response = buildResponse(reqId, { content: [{ type: 'text', text: selectedTool.mockResult }], isError: false });
    onLog({ id: `res-${reqId}-${Date.now()}`, direction: 'server→client', label: `result ← ${selectedTool.name}`, payload: response, ts: Date.now(), highlight: true });

    setResult(selectedTool.mockResult);
    setRunning(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tool selector */}
      <div className="flex gap-2 flex-wrap">
        {server.tools.map(tool => (
          <button
            key={tool.name}
            onClick={() => handleToolSelect(tool)}
            className={cn(
              "text-xs font-mono px-3 py-1.5 rounded-lg border transition-all",
              selectedTool.name === tool.name
                ? cn(color.bg, color.border, color.text)
                : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
            )}
          >
            {tool.name}
          </button>
        ))}
      </div>

      {/* Tool description */}
      <p className="text-gray-500 text-xs leading-relaxed">{selectedTool.description}</p>

      {/* Args editor */}
      <div>
        <label className="text-xs text-gray-600 uppercase tracking-wider font-mono mb-1.5 block">Arguments (JSON)</label>
        <textarea
          value={argsJson}
          onChange={e => { setArgsJson(e.target.value); setArgError(null); }}
          rows={Object.keys(selectedTool.exampleArgs).length + 2}
          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
          spellCheck={false}
        />
        {argError && <p className="text-red-400 text-xs mt-1">{argError}</p>}
      </div>

      {/* Call button */}
      <button
        onClick={handleCall}
        disabled={running}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-sm font-medium transition-all",
          running ? "bg-white/5 text-gray-600 cursor-not-allowed" : cn(color.bg, color.border, color.text, "border hover:opacity-80")
        )}
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {running ? 'Executing...' : `Call ${selectedTool.name}()`}
      </button>

      {/* Result */}
      {result !== null && (
        <div className="bg-black/60 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider">Result</span>
          </div>
          <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap break-all">{result}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Resources Panel ──────────────────────────────────────────────────────────

function ResourcesPanel({ server, onLog }: { server: MCPServer; onLog: (entry: LogEntry) => void }) {
  const [reading, setReading] = useState<string | null>(null);
  const [readResult, setReadResult] = useState<Record<string, string>>({});
  const color = COLOR[server.color as ColorKey];

  const handleRead = async (resource: typeof server.resources[0]) => {
    if (reading) return;
    setReading(resource.uri);

    const reqId = msgIdCounter;
    const request = buildRequest('resources/read', { uri: resource.uri });
    onLog({ id: `rr-req-${Date.now()}`, direction: 'client→server', label: `resources/read → ${resource.name}`, payload: request, ts: Date.now() });

    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

    const mockContent = `[Simulated content of ${resource.name}]\n\nThis would be the actual file or data returned by the MCP server when an AI model requests this resource URI.\n\nURI: ${resource.uri}\nMIME: ${resource.mimeType}`;
    const response = buildResponse(reqId, { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: mockContent }] });
    onLog({ id: `rr-res-${Date.now()}`, direction: 'server→client', label: `resource content ← ${resource.name}`, payload: response, ts: Date.now(), highlight: true });

    setReadResult(prev => ({ ...prev, [resource.uri]: mockContent }));
    setReading(null);
  };

  return (
    <div className="space-y-2">
      {server.resources.map(r => (
        <div key={r.uri} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <FileText className={cn("w-4 h-4 shrink-0", color.text)} />
            <div className="flex-1 min-w-0">
              <p className="text-gray-300 text-sm font-mono truncate">{r.name}</p>
              <p className="text-gray-600 text-xs truncate">{r.uri}</p>
            </div>
            <span className="text-xs text-gray-600 font-mono shrink-0">{r.mimeType}</span>
            <button
              onClick={() => handleRead(r)}
              disabled={!!reading}
              className={cn(
                "shrink-0 text-xs font-mono px-3 py-1 rounded-lg border transition-all",
                reading === r.uri ? "text-gray-600 border-gray-800" : cn("border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20")
              )}
            >
              {reading === r.uri ? <Loader2 className="w-3 h-3 animate-spin" /> : 'read'}
            </button>
          </div>
          {readResult[r.uri] && (
            <div className="border-t border-white/5 px-4 py-3 bg-black/30">
              <pre className="text-gray-500 font-mono text-xs whitespace-pre-wrap">{readResult[r.uri]}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MCP() {
  const { pack } = useContentPack();
  const [connectedServer, setConnectedServer] = useState<MCPServer | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tools' | 'resources'>('tools');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);

  const addLog = (entry: LogEntry) => {
    setLogEntries(prev => [...prev, entry]);
    setShowLog(true);
  };

  const handleConnect = async (server: MCPServer) => {
    if (connecting) return;
    setConnecting(server.id);
    setLogEntries([]);

    // Simulate the MCP handshake
    await new Promise(r => setTimeout(r, 200));

    const initReq = buildRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { roots: { listChanged: true }, sampling: {} },
      clientInfo: { name: 'ACE Educational Client', version: '1.0.0' }
    });
    addLog({ id: `init-req-${Date.now()}`, direction: 'client→server', label: 'initialize', payload: initReq, ts: Date.now() });

    await new Promise(r => setTimeout(r, 350));

    const initRes = buildResponse(initReq.id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, resources: { subscribe: true }, prompts: {} },
      serverInfo: { name: server.name, version: server.version }
    });
    addLog({ id: `init-res-${Date.now()}`, direction: 'server→client', label: 'initialize result', payload: initRes, ts: Date.now() });

    await new Promise(r => setTimeout(r, 150));

    const toolsReq = buildRequest('tools/list', {});
    addLog({ id: `tlist-req-${Date.now()}`, direction: 'client→server', label: 'tools/list', payload: toolsReq, ts: Date.now() });

    await new Promise(r => setTimeout(r, 300));

    const toolsRes = buildResponse(toolsReq.id, {
      tools: server.tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))
    });
    addLog({ id: `tlist-res-${Date.now()}`, direction: 'server→client', label: 'tools/list result', payload: toolsRes, ts: Date.now(), highlight: true });

    setConnectedServer(server);
    setConnecting(null);
    setActiveTab('tools');
  };

  const handleDisconnect = () => {
    setConnectedServer(null);
    setLogEntries([]);
    setShowLog(false);
  };

  const color = connectedServer ? COLOR[connectedServer.color as ColorKey] : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto w-full px-8 py-8 space-y-10 pb-16">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-3">Model Context Protocol (MCP)</h2>
          <p className="text-gray-400 text-base leading-relaxed">
            As AI models became more capable, a new problem emerged: how do we connect them to local files,
            databases, and enterprise tools without writing custom integration code for every model and IDE?
            Enter the Model Context Protocol.
          </p>
        </div>

        {/* The N-to-N Problem */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Network className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">The N-to-N Integration Nightmare</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Before MCP, if you wanted Claude to read your GitHub repos, Cursor to query your Postgres database,
            and ChatGPT to check your Slack messages, developers had to build custom plugins for each combination.
            This created an unsustainable N-to-N integration matrix.
          </p>
        </section>

        {/* Architecture */}
        <section className="space-y-5">
          <h3 className="text-xl font-semibold text-white">The Solution: "USB-C for AI"</h3>
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
            <p className="text-gray-300 mb-8 leading-relaxed">
              MCP is an open standard introduced by Anthropic. It standardizes how AI models (Clients) request
              information from data sources (Servers) using <span className="font-mono text-emerald-400 text-sm">JSON-RPC 2.0</span> over stdio or HTTP/SSE.
              If a tool exposes an MCP Server, any MCP-compatible Client can instantly access it.
            </p>
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 font-mono text-sm">
              <div className="flex-1 bg-black/50 border border-white/10 p-6 rounded-xl flex flex-col gap-3">
                <h4 className="text-white font-semibold text-center mb-1 font-sans text-sm">MCP Clients</h4>
                {['Claude Desktop', 'Cursor / Windsurf', 'Custom Agents'].map(c => (
                  <div key={c} className="bg-white/5 p-3 rounded-lg border border-white/10 text-center text-gray-300 text-xs">{c}</div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center px-4 py-6 md:py-0">
                <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 text-sm">
                  <Plug className="w-4 h-4" />MCP Standard
                </div>
                <p className="text-gray-700 text-xs font-mono mt-2">JSON-RPC 2.0</p>
                <div className="flex gap-6 mt-2">
                  <ArrowRight className="w-4 h-4 text-gray-700 rotate-90 md:rotate-0" />
                  <ArrowRight className="w-4 h-4 text-gray-700 rotate-90 md:rotate-180" />
                </div>
              </div>
              <div className="flex-1 bg-black/50 border border-white/10 p-6 rounded-xl flex flex-col gap-3">
                <h4 className="text-white font-semibold text-center mb-1 font-sans text-sm">MCP Servers</h4>
                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-center text-amber-400 flex items-center justify-center gap-2 text-xs"><FolderOpen className="w-3.5 h-3.5" />Local Filesystem</div>
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-center text-blue-400 flex items-center justify-center gap-2 text-xs"><Globe className="w-3.5 h-3.5" />GitHub API</div>
                <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center text-emerald-400 flex items-center justify-center gap-2 text-xs"><Database className="w-3.5 h-3.5" />Postgres DB</div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Concepts */}
        <section className="grid md:grid-cols-3 gap-5">
          {[
            { icon: <Server className="w-7 h-7 text-emerald-400" />, title: 'Resources', desc: 'Data the model can read — files, schemas, API responses. Think "read-only" context injected into the model\'s window.' },
            { icon: <Plug className="w-7 h-7 text-blue-400" />, title: 'Tools', desc: 'Functions the model can execute — SQL queries, commits, web fetches. These let the model take action in the world.' },
            { icon: <FileText className="w-7 h-7 text-amber-400" />, title: 'Prompts', desc: 'Pre-defined prompt templates users can invoke. A "Code Review" prompt that automatically injects the current git diff.' },
          ].map(c => (
            <div key={c.title} className="bg-[#121212] border border-white/10 rounded-2xl p-6">
              <div className="mb-4">{c.icon}</div>
              <h4 className="text-base font-medium text-white mb-2">{c.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </section>

        {/* ── Interactive Demo ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-semibold text-white">Interactive Protocol Explorer</h3>
            <span className="text-xs text-gray-600 font-mono border border-white/10 rounded-full px-3 py-1">simulated</span>
          </div>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Pick a server below to watch the real <span className="font-mono text-gray-400">JSON-RPC 2.0</span> handshake happen, then call tools and read resources exactly as an AI model would. The protocol messages are faithful to the MCP spec — only the data is simulated.
          </p>

          {/* Server cards */}
          {!connectedServer && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {pack.mcp.servers.map(server => {
                const c = COLOR[server.color as ColorKey];
                return (
                  <button
                    key={server.id}
                    onClick={() => handleConnect(server)}
                    disabled={!!connecting}
                    className={cn(
                      "text-left bg-[#121212] border rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed",
                      c.border
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", c.bg, c.text, 'border', c.border)}>
                      {connecting === server.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (SERVER_ICONS[server.id] ?? DEFAULT_SERVER_ICON)}
                    </div>
                    <h4 className="text-white font-semibold mb-1">{server.name}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed mb-4">{server.description}</p>
                    <div className={cn("text-xs font-mono px-3 py-1 rounded-full inline-flex items-center gap-1.5", c.badge)}>
                      <ChevronRight className="w-3 h-3" />
                      {connecting === server.id ? 'Connecting...' : 'Connect'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Connected state */}
          {connectedServer && color && (
            <div className="space-y-4">
              {/* Connected header */}
              <div className={cn("flex items-center gap-4 p-4 rounded-xl border", color.bg, color.border)}>
                <div className={cn("w-2 h-2 rounded-full animate-pulse", color.dot)} />
                <span className={cn("font-mono text-sm font-semibold", color.text)}>{connectedServer.name}</span>
                <span className="text-gray-600 text-xs font-mono">v{connectedServer.version}</span>
                <span className="text-gray-600 text-xs font-mono ml-auto">{connectedServer.tools.length} tools · {connectedServer.resources?.length ?? 0} resources</span>
                <button
                  onClick={handleDisconnect}
                  className="text-gray-600 hover:text-gray-400 transition-colors ml-2"
                  title="Disconnect"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Two-column: playground + log */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Left: tools/resources tabs */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex border-b border-white/10">
                    {(['tools', 'resources'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors",
                          activeTab === tab ? cn(color.text, 'border-b-2', color.border.replace('border', 'border-b')) : "text-gray-600 hover:text-gray-400"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="p-5">
                    {activeTab === 'tools'
                      ? <ToolPlayground server={connectedServer} onLog={addLog} />
                      : <ResourcesPanel server={connectedServer} onLog={addLog} />
                    }
                  </div>
                </div>

                {/* Right: protocol log */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '420px' }}>
                  <ProtocolLog entries={logEntries} onClear={() => setLogEntries([])} />
                </div>
              </div>

              {/* Switch server */}
              <button
                onClick={handleDisconnect}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Switch server
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}