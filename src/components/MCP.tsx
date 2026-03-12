import React from 'react';
import { Network, Plug, Server, FileText, ArrowRight, Database, Globe } from 'lucide-react';

export function MCP() {
  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Model Context Protocol (MCP)</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            As AI models became more capable, a new problem emerged: how do we connect them to our local files, 
            databases, and enterprise tools without writing custom integration code for every single model and IDE? 
            Enter the Model Context Protocol.
          </p>
        </div>

        {/* The N-to-N Problem */}
        <section className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Network className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white">The N-to-N Integration Nightmare</h3>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Before MCP, if you wanted Claude to read your GitHub repos, Cursor to query your Postgres database, 
            and ChatGPT to check your Slack messages, developers had to build custom plugins for each combination. 
            This created an unsustainable N-to-N integration matrix.
          </p>
        </section>

        {/* The Solution: USB-C for AI */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-white">The Solution: "USB-C for AI"</h3>
          
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
            <p className="text-gray-300 mb-8 leading-relaxed">
              MCP is an open standard introduced by Anthropic. It standardizes how AI models (Clients) request 
              information from data sources (Servers). If a tool exposes an MCP Server, any MCP-compatible Client 
              can instantly access its data and capabilities.
            </p>

            {/* Architecture Diagram */}
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 font-mono text-sm">
              
              {/* Clients */}
              <div className="flex-1 bg-black/50 border border-white/10 p-6 rounded-xl flex flex-col gap-4">
                <h4 className="text-white font-semibold text-center mb-2 font-sans">MCP Clients</h4>
                <div className="bg-white/5 p-3 rounded border border-white/10 text-center text-gray-300">Claude Desktop</div>
                <div className="bg-white/5 p-3 rounded border border-white/10 text-center text-gray-300">Cursor / Windsurf</div>
                <div className="bg-white/5 p-3 rounded border border-white/10 text-center text-gray-300">Custom Agents</div>
              </div>

              {/* Protocol */}
              <div className="flex flex-col items-center justify-center px-4 py-8 md:py-0">
                <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                  <Plug className="w-4 h-4" />
                  MCP Standard
                </div>
                <div className="flex gap-8 mt-4">
                  <ArrowRight className="w-5 h-5 text-gray-600 rotate-90 md:rotate-0" />
                  <ArrowRight className="w-5 h-5 text-gray-600 rotate-90 md:rotate-180" />
                </div>
              </div>

              {/* Servers */}
              <div className="flex-1 bg-black/50 border border-white/10 p-6 rounded-xl flex flex-col gap-4">
                <h4 className="text-white font-semibold text-center mb-2 font-sans">MCP Servers</h4>
                <div className="bg-blue-500/10 p-3 rounded border border-blue-500/20 text-center text-blue-400 flex items-center justify-center gap-2">
                  <Database className="w-4 h-4" /> Postgres DB
                </div>
                <div className="bg-amber-500/10 p-3 rounded border border-amber-500/20 text-center text-amber-400 flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4" /> GitHub API
                </div>
                <div className="bg-purple-500/10 p-3 rounded border border-purple-500/20 text-center text-purple-400 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> Local Filesystem
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Core Concepts */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
            <Server className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">Resources</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Data that the model can read, like a specific file, a database schema, or an API response. 
              Think of these as "read-only" context.
            </p>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
            <Plug className="w-8 h-8 text-blue-400 mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">Tools</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Functions the model can execute, like running a SQL query, committing code, or fetching a web page. 
              These allow the model to take action.
            </p>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
            <FileText className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">Prompts</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Pre-defined templates that users can invoke. For example, a "Code Review" prompt that automatically 
              pulls in the current git diff as context.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
