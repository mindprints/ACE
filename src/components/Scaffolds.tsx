import React from 'react';
import { LayoutTemplate, Database, Code2, Zap, ArrowRight } from 'lucide-react';

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
                The IDE parses your entire project, chunks the code, and creates vector embeddings. 
                When you ask a question, it performs a semantic search to find the most relevant files 
                and injects them into the model's prompt automatically.
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
                + auth.ts (RAG)<br/>
                + Linter Error (Active)<br/>
                + Cursor Position
              </div>
            </div>

            <ArrowRight className="w-6 h-6 text-gray-600 hidden md:block" />

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg w-full md:w-1/4 text-center text-blue-400">
              Model Generates Diff
              <div className="text-xs text-blue-500/70 mt-2">
                @@ -15,3 +15,4 @@<br/>
                + await session.save()
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
