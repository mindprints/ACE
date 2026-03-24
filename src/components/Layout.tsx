import React, { useState } from 'react';
import { DEVELOPER_CURRICULUM, GENERALIST_CURRICULUM } from '../constants';
import { BookOpen, Settings, Terminal, Cpu, Network, Wrench, LayoutTemplate, Search, Code2, Users, ClipboardList, Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Thread = 'developer' | 'generalist' | 'assignments';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const curriculum = activeThread === 'developer' ? DEVELOPER_CURRICULUM : GENERALIST_CURRICULUM;
  const icons = activeThread === 'developer' ? DEV_ICONS : GEN_ICONS;
  const accent = activeThread === 'developer' ? 'text-emerald-400' : 'text-violet-400';
  const activeTabStyle = activeThread === 'developer'
    ? 'bg-emerald-600 text-white'
    : 'bg-violet-600 text-white';

  const handleChapterSelect = (id: string) => {
    onChapterSelect(id);
    setSidebarOpen(false);
  };

  const handleThreadSelect = (thread: Thread) => {
    onThreadSelect(thread);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static column on desktop */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-[#121212] flex flex-col transition-transform duration-200",
        "md:static md:translate-x-0 md:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">AI Evolution</h1>
              <p className="text-xs text-gray-500 mt-0.5">Interactive Curriculum</p>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-500 hover:text-gray-300 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thread toggle — hidden on assignments view */}
          <div className={cn("flex rounded-lg bg-black/40 border border-white/10 p-0.5 gap-0.5", activeThread === 'assignments' && "opacity-40 pointer-events-none")}>
            <button
              onClick={() => handleThreadSelect('developer')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeThread === 'developer' ? activeTabStyle : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Code2 className="w-3 h-3" />
              Developer
            </button>
            <button
              onClick={() => handleThreadSelect('generalist')}
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
          {activeThread !== 'assignments' && (
            <nav className="space-y-1 px-3">
              {curriculum.map((chapter) => {
                const Icon = icons[chapter.id] || BookOpen;
                const isActive = chapter.id === activeChapterId;

                return (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterSelect(chapter.id)}
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
          )}
        </div>

        {/* Assignments link */}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={() => handleThreadSelect('assignments')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
              activeThread === 'assignments'
                ? "bg-amber-500/15 text-amber-400 font-medium border border-amber-500/20"
                : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
            )}
          >
            <ClipboardList className={cn("w-4 h-4", activeThread === 'assignments' ? "text-amber-400" : "text-gray-600")} />
            <span>Assignments &amp; Links</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0a] min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white">AI Evolution</span>
        </div>
        {children}
      </main>
    </div>
  );
}
