import React, { useState, useRef, useEffect } from 'react';
import { fetchOpenRouterChatFull } from '../services/openRouter';
import { Wrench, Send, Loader2, AlertCircle, CloudRain, TrendingUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './Layout';

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a specific location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "The city and state, e.g., San Francisco, CA" }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get the current stock price for a given ticker symbol.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "The stock ticker symbol, e.g., AAPL, TSLA" }
        },
        required: ["symbol"]
      }
    }
  }
];

export function ToolCalling() {
  const [messages, setMessages] = useState<any[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am an AI equipped with tools. I can check the weather or look up stock prices. Try asking me: "What is the weather in Tokyo?" or "What is the price of AAPL?"' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    setError(null);
    const userMsg = { role: 'user', content: input.trim() };
    let currentMessages = [...messages, userMsg];
    
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    try {
      // 1. Send user message to model with tools available
      let responseMessage = await fetchOpenRouterChatFull(
        currentMessages.filter(m => m.role !== 'tool_ui'), // Filter out our custom UI messages
        'openai/gpt-4o', 
        apiKey, 
        TOOLS
      );

      currentMessages = [...currentMessages, responseMessage];
      setMessages(currentMessages);

      // 2. Check if the model wants to call a tool
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        
        // Add a UI-only message to show the user what's happening
        const toolCallsUi = responseMessage.tool_calls.map((call: any) => ({
          role: 'tool_ui',
          name: call.function.name,
          args: call.function.arguments
        }));
        currentMessages = [...currentMessages, ...toolCallsUi];
        setMessages(currentMessages);

        // 3. Execute the tools locally (Mock execution)
        const toolResults = responseMessage.tool_calls.map((call: any) => {
          const args = JSON.parse(call.function.arguments);
          let result = '';
          
          if (call.function.name === 'get_weather') {
            const temps = [65, 72, 85, 45, 55];
            const conditions = ['Sunny', 'Rainy', 'Cloudy', 'Partly Cloudy'];
            result = `{"temperature": ${temps[Math.floor(Math.random() * temps.length)]}, "condition": "${conditions[Math.floor(Math.random() * conditions.length)]}", "location": "${args.location}"}`;
          } else if (call.function.name === 'get_stock_price') {
            const price = (Math.random() * 500 + 50).toFixed(2);
            result = `{"symbol": "${args.symbol.toUpperCase()}", "price": $${price}, "currency": "USD"}`;
          } else {
            result = `{"error": "Unknown tool"}`;
          }

          return {
            role: 'tool',
            tool_call_id: call.id,
            name: call.function.name,
            content: result
          };
        });

        // Append tool results to conversation history
        currentMessages = [...currentMessages, ...toolResults];
        
        // 4. Send the tool results back to the model so it can formulate a final answer
        const finalResponse = await fetchOpenRouterChatFull(
          currentMessages.filter(m => m.role !== 'tool_ui'), 
          'openai/gpt-4o', 
          apiKey, 
          TOOLS
        );
        
        currentMessages = [...currentMessages, finalResponse];
        setMessages(currentMessages);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full">
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">Tool Calling & Search</h2>
        <p className="text-gray-400 text-sm">
          Models are frozen in time based on their training data. "Tool Calling" (or Function Calling) 
          allows a model to request the execution of external functions (like an API call, web search, or database query) 
          to gather real-time data before answering.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 bg-[#121212] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => {
            if (msg.role === 'tool') return null; // Hide raw tool responses
            if (msg.role === 'assistant' && !msg.content && msg.tool_calls) return null; // Hide empty assistant messages that just call tools

            if (msg.role === 'tool_ui') {
              return (
                <div key={idx} className="flex justify-center my-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-xs font-mono flex items-center gap-2">
                    <Wrench className="w-3 h-3" />
                    Executing {msg.name}({msg.args})
                  </div>
                </div>
              );
            }

            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-5 py-3.5",
                  isUser 
                    ? "bg-emerald-600 text-white" 
                    : "bg-white/5 border border-white/10 text-gray-200"
                )}>
                  {isUser ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none markdown-body">
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
                <span className="text-sm text-gray-400">Model is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex gap-4 mb-3 px-2">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Available Mock Tools:</span>
            <div className="flex gap-3">
              <span className="text-xs text-blue-400 flex items-center gap-1"><CloudRain className="w-3 h-3"/> get_weather</span>
              <span className="text-xs text-amber-400 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> get_stock_price</span>
            </div>
          </div>
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the weather or a stock price..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
