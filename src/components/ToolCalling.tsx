import React, { useState, useRef, useEffect } from 'react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import {
  Wrench, Send, Loader2, AlertCircle, CloudRain,
  TrendingUp, Calculator, Search, CheckCircle2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';
import { useContentPack } from '../context/ContentPackContext';

// ─── Tool Definitions (sent to the model) ────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather and forecast for a specific location using real-time data.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name, e.g. 'Tokyo' or 'New York'" }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get the current stock price and basic info for a given ticker symbol.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Stock ticker symbol, e.g. AAPL, TSLA, MSFT" }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Evaluate a mathematical expression. Supports arithmetic, algebra, and common math functions.",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Math expression to evaluate, e.g. '2 * (3 + 4)' or 'sqrt(144)'" }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information on any topic using DuckDuckGo.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    }
  }
];

// ─── Real Tool Implementations ─────────────────────────────────────────────

async function executeGetWeather(location: string): Promise<string> {
  try {
    // Step 1: Geocode the location
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return JSON.stringify({ error: `Location "${location}" not found.` });
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Step 2: Fetch weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`
    );
    const weatherData = await weatherRes.json();

    const wmoDescriptions: Record<number, string> = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
      61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
      80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail'
    };

    const c = weatherData.current;
    const d = weatherData.daily;

    return JSON.stringify({
      location: `${name}, ${country}`,
      temperature_c: c.temperature_2m,
      temperature_f: Math.round(c.temperature_2m * 9 / 5 + 32),
      feels_like_c: c.apparent_temperature,
      condition: wmoDescriptions[c.weather_code] ?? 'Unknown',
      humidity_pct: c.relative_humidity_2m,
      wind_kmh: c.wind_speed_10m,
      forecast_3_days: d.time.slice(0, 3).map((date: string, i: number) => ({
        date,
        high_c: d.temperature_2m_max[i],
        low_c: d.temperature_2m_min[i],
        condition: wmoDescriptions[d.weather_code[i]] ?? 'Unknown'
      }))
    });
  } catch (err: any) {
    return JSON.stringify({ error: `Weather fetch failed: ${err.message}` });
  }
}

async function executeGetStockPrice(symbol: string): Promise<string> {
  try {
    // Yahoo Finance public endpoint (no key required)
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.toUpperCase())}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();

    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) {
      return JSON.stringify({ error: `Symbol "${symbol}" not found or market data unavailable.` });
    }

    const change = meta.regularMarketPrice - meta.previousClose;
    const changePct = ((change / meta.previousClose) * 100).toFixed(2);

    return JSON.stringify({
      symbol: meta.symbol,
      name: meta.shortName ?? meta.symbol,
      price: meta.regularMarketPrice,
      currency: meta.currency,
      change: +change.toFixed(2),
      change_percent: `${changePct}%`,
      previous_close: meta.previousClose,
      day_high: meta.regularMarketDayHigh,
      day_low: meta.regularMarketDayLow,
      exchange: meta.exchangeName,
      market_state: meta.marketState
    });
  } catch (err: any) {
    return JSON.stringify({ error: `Stock fetch failed: ${err.message}` });
  }
}

function executeCalculate(expression: string): string {
  try {
    // Safe math evaluation: only allow numbers and math symbols
    const sanitized = expression
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/pow\(/g, 'Math.pow(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/floor\(/g, 'Math.floor(')
      .replace(/ceil\(/g, 'Math.ceil(')
      .replace(/round\(/g, 'Math.round(')
      .replace(/log\(/g, 'Math.log(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/PI/g, 'Math.PI')
      .replace(/E\b/g, 'Math.E');

    // Block anything that isn't math
    if (/[a-zA-Z]/.test(sanitized.replace(/Math\.[a-zA-Z]+/g, ''))) {
      return JSON.stringify({ error: 'Expression contains invalid characters.' });
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return JSON.stringify({ error: 'Result is not a finite number.' });
    }

    return JSON.stringify({ expression, result: +result.toPrecision(10) });
  } catch (err: any) {
    return JSON.stringify({ error: `Calculation error: ${err.message}` });
  }
}

async function executeWebSearch(query: string): Promise<string> {
  try {
    // DuckDuckGo Instant Answer API — CORS-friendly, no key needed
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
    );
    const data = await res.json();

    const results: any[] = [];

    if (data.AbstractText) {
      results.push({ type: 'abstract', title: data.Heading, snippet: data.AbstractText, url: data.AbstractURL });
    }

    if (data.Answer) {
      results.push({ type: 'instant_answer', answer: data.Answer });
    }

    // Related topics as additional context
    const related = (data.RelatedTopics ?? [])
      .filter((t: any) => t.Text)
      .slice(0, 4)
      .map((t: any) => ({ title: t.Text.split(' - ')[0], snippet: t.Text, url: t.FirstURL }));

    if (related.length > 0) results.push(...related);

    if (results.length === 0) {
      return JSON.stringify({
        query,
        note: 'No instant answer found. This is the DuckDuckGo Instant Answer API which works best for factual queries. For broader results, a full search engine API (Bing, Brave, Serper) would be needed.',
        suggestion: 'Try rephrasing as a direct factual question.'
      });
    }

    return JSON.stringify({ query, results });
  } catch (err: any) {
    return JSON.stringify({ error: `Search failed: ${err.message}` });
  }
}

// ─── Tool Dispatcher ──────────────────────────────────────────────────────────

async function executeTool(name: string, argsJson: string): Promise<string> {
  let args: any;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return JSON.stringify({ error: 'Invalid arguments JSON.' });
  }

  switch (name) {
    case 'get_weather':     return executeGetWeather(args.location);
    case 'get_stock_price': return executeGetStockPrice(args.symbol);
    case 'calculate':       return executeCalculate(args.expression);
    case 'web_search':      return executeWebSearch(args.query);
    default:                return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ─── Tool UI Metadata ─────────────────────────────────────────────────────────

const TOOL_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  get_weather:    { icon: <CloudRain className="w-3.5 h-3.5" />,   color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',     label: 'Weather' },
  get_stock_price:{ icon: <TrendingUp className="w-3.5 h-3.5" />,  color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', label: 'Stock' },
  calculate:      { icon: <Calculator className="w-3.5 h-3.5" />,  color: 'text-violet-400 border-violet-500/30 bg-violet-500/10', label: 'Calculate' },
  web_search:     { icon: <Search className="w-3.5 h-3.5" />,      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', label: 'Search' },
};

// ─── Tool Call Badge ──────────────────────────────────────────────────────────

function ToolCallBadge({ name, args, result, status }: {
  name: string;
  args: string;
  result?: string;
  status: 'running' | 'done' | 'error';
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TOOL_META[name] ?? { icon: <Wrench className="w-3.5 h-3.5" />, color: 'text-gray-400 border-gray-500/30 bg-gray-500/10', label: name };

  let parsedArgs: any = {};
  let parsedResult: any = null;
  try { parsedArgs = JSON.parse(args); } catch {}
  if (result) { try { parsedResult = JSON.parse(result); } catch { parsedResult = result; } }

  const argSummary = Object.values(parsedArgs).join(', ');

  return (
    <div className="flex justify-center my-2">
      <div className={cn("border rounded-xl text-xs font-mono max-w-lg w-full", meta.color)}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-2 px-4 py-2.5 hover:opacity-80 transition-opacity"
        >
          {status === 'running' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : status === 'done' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="font-semibold">{meta.label}</span>
          <span className="opacity-60">→</span>
          <span className="opacity-80 truncate">{argSummary}</span>
          <span className="ml-auto shrink-0 opacity-50">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </button>
        {expanded && (
          <div className="border-t border-current/20 px-4 py-3 space-y-2">
            <div>
              <span className="opacity-50 text-[10px] uppercase tracking-wider">Input</span>
              <pre className="mt-1 opacity-80 whitespace-pre-wrap break-all">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
            {parsedResult && (
              <div>
                <span className="opacity-50 text-[10px] uppercase tracking-wider">Output</span>
                <pre className="mt-1 opacity-80 whitespace-pre-wrap break-all">
                  {typeof parsedResult === 'object' ? JSON.stringify(parsedResult, null, 2) : parsedResult}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type UiMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool_call'; id: string; name: string; args: string; result?: string; status: 'running' | 'done' | 'error' };

export function ToolCalling() {
  const { pack, packId } = useContentPack();
  const [uiMessages, setUiMessages] = useState<UiMessage[]>([
    { role: 'assistant', content: pack.toolCalling.initialMessage }
  ]);
  // The actual conversation history sent to the API (no UI-only entries)
  const [apiMessages, setApiMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uiMessages, loading]);

  // Reset chat when pack changes
  useEffect(() => {
    setUiMessages([{ role: 'assistant', content: pack.toolCalling.initialMessage }]);
    setApiMessages([]);
    setInput('');
  }, [packId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateToolCallUi = (id: string, result: string, status: 'done' | 'error') => {
    setUiMessages(prev => prev.map(m =>
      m.role === 'tool_call' && m.id === id ? { ...m, result, status } : m
    ));
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    setInput('');
    setLoading(true);

    // Add user message to both UI and API history
    const userApiMsg = { role: 'user', content: messageText };
    const newApiMessages = [...apiMessages, userApiMsg];
    setApiMessages(newApiMessages);
    setUiMessages(prev => [...prev, { role: 'user', content: messageText }]);

    try {
      let currentApiMessages = newApiMessages;

      // Agentic loop — keep going until no more tool calls
      while (true) {
        const responseMessage = await fetchOpenRouterChatFull(
          currentApiMessages,
          'openai/gpt-4o',
          apiKey,
          TOOLS
        );

        currentApiMessages = [...currentApiMessages, responseMessage];

        // If the model wants to call tools
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          // Add tool call badges to UI (running state)
          const toolCallUiEntries: UiMessage[] = responseMessage.tool_calls.map((call: any) => ({
            role: 'tool_call' as const,
            id: call.id,
            name: call.function.name,
            args: call.function.arguments,
            status: 'running' as const
          }));
          setUiMessages(prev => [...prev, ...toolCallUiEntries]);

          // Execute all tool calls in parallel
          const toolResults = await Promise.all(
            responseMessage.tool_calls.map(async (call: any) => {
              const result = await executeTool(call.function.name, call.function.arguments);
              let parsedResult: any = null;
              try { parsedResult = JSON.parse(result); } catch {}
              const status = parsedResult?.error ? 'error' : 'done';
              updateToolCallUi(call.id, result, status);

              return {
                role: 'tool',
                tool_call_id: call.id,
                name: call.function.name,
                content: result
              };
            })
          );

          currentApiMessages = [...currentApiMessages, ...toolResults];
          // Loop again — give model the tool results so it can respond
          continue;
        }

        // No tool calls — final text response
        if (responseMessage.content) {
          setUiMessages(prev => [...prev, { role: 'assistant', content: responseMessage.content }]);
        }

        setApiMessages(currentApiMessages);
        break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-5">
        <h2 className="text-2xl font-semibold text-white mb-2">Tool Calling & Search</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Models are frozen in time based on their training data. <strong className="text-gray-300">Tool Calling</strong> lets
          a model request execution of external functions — APIs, searches, calculations — to gather real-time data before
          answering. The tools below are <em>real</em>: live weather from Open-Meteo, live stocks from Yahoo Finance,
          safe math eval, and DuckDuckGo search.
        </p>
      </div>

      {/* Tool legend */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 mb-4">
        {Object.entries(TOOL_META).map(([key, meta]) => (
          <span key={key} className={cn("text-xs font-mono border rounded-full px-3 py-1 flex items-center gap-1.5", meta.color)}>
            {meta.icon}
            {key}
          </span>
        ))}
        <span className="text-xs text-gray-600 self-center ml-1 italic">— all live, no mocks</span>
      </div>

      {error && (
        <div className="flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 bg-[#121212] border border-white/10 rounded-2xl flex flex-col overflow-hidden min-h-0">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {uiMessages.map((msg, idx) => {
            if (msg.role === 'tool_call') {
              return (
                <ToolCallBadge
                  key={idx}
                  name={msg.name}
                  args={msg.args}
                  result={msg.result}
                  status={msg.status}
                />
              );
            }

            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-5 py-3.5',
                  isUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-200'
                )}>
                  {isUser ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-sm text-gray-400">
                  {uiMessages.some(m => m.role === 'tool_call' && m.status === 'running')
                    ? 'Executing tools...'
                    : 'Model is thinking...'}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example prompts */}
        <div className="px-4 pt-3 flex gap-2 flex-wrap border-t border-white/5">
          {pack.toolCalling.examplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-xs text-gray-500 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed truncate max-w-[200px]"
              title={p}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about weather, stocks, math, or anything..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}