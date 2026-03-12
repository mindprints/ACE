import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Setup } from './components/Setup';
import { ModelComparison } from './components/ModelComparison';
import { Scaffolds } from './components/Scaffolds';
import { ToolCalling } from './components/ToolCalling';
import { MCP } from './components/MCP';
import { Agents } from './components/Agents';
import { CLI } from './components/CLI';
import { MultiAgent } from './components/MultiAgent';
import { CURRICULUM } from './constants';

export default function App() {
  const [activeChapterId, setActiveChapterId] = useState('setup');

  const renderContent = () => {
    switch (activeChapterId) {
      case 'setup':
        return <Setup onComplete={() => setActiveChapterId('basics')} />;
      case 'basics':
        return <ModelComparison />;
      case 'scaffolds':
        return <Scaffolds />;
      case 'tools':
        return <ToolCalling />;
      case 'mcps':
        return <MCP />;
      case 'agents':
        return <Agents />;
      case 'cli':
        return <CLI />;
      case 'multi-agent':
        return <MultiAgent />;
      default:
        const chapter = CURRICULUM.find(c => c.id === activeChapterId);
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-3xl font-semibold text-white mb-4">{chapter?.title}</h2>
            <p className="text-gray-400 max-w-2xl text-lg">{chapter?.description}</p>
            <div className="mt-12 p-8 border border-dashed border-white/20 rounded-2xl bg-white/5">
              <p className="text-gray-500 font-mono text-sm">
                // Module under construction.
                <br />
                // Interactive demo coming soon.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout activeChapterId={activeChapterId} onChapterSelect={setActiveChapterId}>
      {renderContent()}
    </Layout>
  );
}




