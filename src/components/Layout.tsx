import React from 'react';
import { CURRICULUM } from '../constants';
import { BookOpen, Settings, Terminal, Cpu, Network, Wrench, LayoutTemplate, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ICONS: Record<string, React.ElementType> = {
  'setup': Settings,
  'basics': BookOpen,
  'scaffolds': LayoutTemplate,
  'tools': Wrench,
  'mcps': Network,
  'agents': Cpu,
  'cli': Terminal,
  'multi-agent': Search,
};

interface LayoutProps {
  children: React.ReactNode;
  activeChapterId: string;
  onChapterSelect: (id: string) => void;
}

export function Layout({ children, activeChapterId, onChapterSelect }: LayoutProps) {
  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 bg-[#121212] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-semibold text-white tracking-tight">AI Coding Evolution</h1>
          <p className="text-xs text-gray-500 mt-1">Interactive Curriculum</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {CURRICULUM.map((chapter) => {
              const Icon = ICONS[chapter.id] || BookOpen;
              const isActive = chapter.id === activeChapterId;
              
              return (
                <button
                  key={chapter.id}
                  onClick={() => onChapterSelect(chapter.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    isActive 
                      ? "bg-white/10 text-white font-medium" 
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-gray-500")} />
                  <span className="truncate">{chapter.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
