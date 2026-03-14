import React from 'react';
import { DEVELOPER_CURRICULUM, GENERALIST_CURRICULUM } from '../constants';
import { BookOpen, Settings, Terminal, Cpu, Network, Wrench, LayoutTemplate, Search, Code2, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Thread = 'developer' | 'generalist';

const DEV_ICONS: Record<string, React.ElementType> = {
  'setup': Settings,
  'basics': BookOpen,
  'scaffolds': LayoutTemplate,
  'tools': Wrench,
  'mcps': Network,
  'agents': Cpu,
  'cli': Terminal,
  'multi-agent': Search,
};

const GEN_ICONS: Record<string, React.ElementType> = {
  'g-setup': Settings,
  'g-basics': BookOpen,
  'g-tools': Search,
  'g-connectors': Network,
  'g-teach': BookOpen,
  'g-brief': Wrench,
  'g-delegate': Terminal,
  'g-research': Search,
  'g-teams': Users,
  'g-evolution': Cpu,
};

interface LayoutProps {
  children: React.ReactNode;
  activeChapterId: string;
  activeThread: Thread;
  onChapterSelect: (id: string) => void;
  onThreadSelect: (thread: Thread) => void;
}

export function Layout({ children, activeChapterId, activeThread, onChapterSelect, onThreadSelect }: LayoutProps) {
  const curriculum = activeThread === 'developer' ? DEVELOPER_CURRICULUM : GENERALIST_CURRICULUM;
  const icons = activeThread === 'developer' ? DEV_ICONS : GEN_ICONS;
  const accent = activeThread === 'developer' ? 'text-emerald-400' : 'text-violet-400';
  const activeTabStyle = activeThread === 'developer'
    ? 'bg-emerald-600 text-white'
    : 'bg-violet-600 text-white';

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 bg-[#121212] flex flex-col">
        <div className="p-5 border-b border-white/10 space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">AI Evolution</h1>
            <p className="text-xs text-gray-500 mt-0.5">Interactive Curriculum</p>
          </div>

          {/* Thread toggle */}
          <div className="flex rounded-lg bg-black/40 border border-white/10 p-0.5 gap-0.5">
            <button
              onClick={() => onThreadSelect('developer')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeThread === 'developer' ? activeTabStyle : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Code2 className="w-3 h-3" />
              Developer
            </button>
            <button
              onClick={() => onThreadSelect('generalist')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeThread === 'generalist'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Users className="w-3 h-3" />
              Generalist
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {curriculum.map((chapter) => {
              const Icon = icons[chapter.id] || BookOpen;
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
                  <Icon className={cn("w-4 h-4", isActive ? accent : "text-gray-500")} />
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
