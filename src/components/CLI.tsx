import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronRight, Loader2, AlertCircle, Command } from 'lucide-react';
import { fetchOpenRouterChat } from '../services/openRouter';
import { cn } from './Layout';

interface LogEntry {
  id: string;
  type: 'command' | 'output' | 'system' | 'error';
  content: string;
}

export function CLI() {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'init1', type: 'system', content: 'AI CLI initialized. Type a natural language command.' },
    { id: 'init2', type: 'system', content: 'Example: "Find all TODOs in the src folder and save to todos.txt"' }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;

    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      setError('Please configure your OpenRouter API key in the Setup section first.');
      return;
    }

    const userCommand = input.trim();
    setInput('');
    setError(null);
    setIsExecuting(true);

    // Add user's natural language command to logs
    setLogs(prev => [...prev, { id: Date.now().toString(), type: 'command', content: `# ${userCommand}` }]);

    try {
      const systemPrompt = `You are a terminal AI assistant (like Aider or GitHub Copilot CLI). 
The user will give you a natural language goal.
You must return a JSON array of 1 to 3 bash commands to achieve this goal.
DO NOT wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON array of strings.
Example: ["mkdir my-project", "cd my-project", "npm init -y"]`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userCommand }
      ];

      const response = await fetchOpenRouterChat(messages, 'openai/gpt-4o', apiKey);
      
      // Try to parse the response as JSON
      let commands: string[] = [];
      try {
        // Clean up potential markdown formatting if the model ignored instructions
        const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        commands = JSON.parse(cleanedResponse);
        if (!Array.isArray(commands)) throw new Error("Not an array");
      } catch (parseErr) {
        console.error("Failed to parse commands:", response);
        throw new Error("The model failed to return a valid JSON array of commands.");
      }

      // Simulate executing the commands one by one
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        
        // 1. Show the command
        setLogs(prev => [...prev, { id: `${Date.now()}-${i}-cmd`, type: 'command', content: `$ ${cmd}` }]);
        
        // 2. Fake delay for execution
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 3. Show mock output
        let mockOutput = `Executed successfully.`;
        if (cmd.includes('grep') || cmd.includes('find')) {
          mockOutput = `src/main.ts:12: // TODO: Refactor this\nsrc/utils.ts:45: // TODO: Add error handling`;
        } else if (cmd.includes('npm') || cmd.includes('yarn')) {
          mockOutput = `added 42 packages, and audited 43 packages in 2s\n\nfound 0 vulnerabilities`;
        } else if (cmd.includes('git')) {
          mockOutput = `[main 1a2b3c4] Automated commit\n 1 file changed, 10 insertions(+)`;
        } else if (cmd.includes('ls')) {
          mockOutput = `package.json  src  public  README.md  tsconfig.json`;
        }

        setLogs(prev => [...prev, { id: `${Date.now()}-${i}-out`, type: 'output', content: mockOutput }]);
      }

    } catch (err: any) {
      setLogs(prev => [...prev, { id: Date.now().toString(), type: 'error', content: `Error: ${err.message}` }]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-5xl mx-auto w-full gap-6">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-semibold text-white mb-2">The CLI Renaissance</h2>
        <p className="text-gray-400 text-sm max-w-3xl">
          AI is returning to the terminal. Tools like Aider, OpenDevin, and GitHub Copilot CLI allow developers 
          to use natural language to execute complex shell commands, refactor codebases, and manage git workflows 
          without leaving the command line.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Terminal Window */}
      <div className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden flex flex-col font-mono shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-[#1a1a1a] border-b border-white/10 px-4 py-2 flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            ai-cli-agent ~ bash
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
          {logs.map((log) => (
            <div key={log.id} className={cn(
              "whitespace-pre-wrap break-words",
              log.type === 'system' && "text-blue-400",
              log.type === 'command' && "text-emerald-400 font-semibold",
              log.type === 'output' && "text-gray-300",
              log.type === 'error' && "text-red-400"
            )}>
              {log.content}
            </div>
          ))}
          {isExecuting && (
            <div className="flex items-center gap-2 text-gray-500 mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is translating command...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Terminal Input */}
        <div className="bg-[#1a1a1a] border-t border-white/10 p-2">
          <form onSubmit={handleCommand} className="flex items-center gap-2 px-2">
            <Command className="w-4 h-4 text-emerald-500 shrink-0" />
            <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isExecuting}
              placeholder="e.g., Find all TypeScript files and count the lines of code..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-sm py-2"
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
}
