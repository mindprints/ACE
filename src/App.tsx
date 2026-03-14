import React, { useState } from 'react';
import { Layout, Thread } from './components/Layout';
import { Setup } from './components/Setup';
import { ModelComparison } from './components/ModelComparison';
import { Scaffolds } from './components/Scaffolds';
import { ToolCalling } from './components/ToolCalling';
import { MCP } from './components/MCP';
import { Agents } from './components/Agents';
import { AgentsMD } from './components/AgentsMD';
import { CLI } from './components/CLI';
import { MultiAgent } from './components/MultiAgent';
import { BrowserUse } from './components/Browseruse';
import { Timeline } from './components/Timeline';
import { IDEEvolution } from './components/Ideevolution';
import { GeneralistBasics } from './components/generalist/GeneralistBasics';
import { GeneralistTools } from './components/generalist/GeneralistTools';
import { GeneralistConnectors } from './components/generalist/GeneralistConnectors';
import { GeneralistTeach } from './components/generalist/GeneralistTeach';
import { GeneralistBrief } from './components/generalist/GeneralistBrief';
import { GeneralistDelegate } from './components/generalist/GeneralistDelegate';
import { GeneralistResearch } from './components/generalist/GeneralistResearch';
import { GeneralistTeams } from './components/generalist/GeneralistTeams';
import { GeneralistEvolution } from './components/generalist/GeneralistEvolution';
import { DEVELOPER_CURRICULUM, GENERALIST_CURRICULUM } from './constants';

export default function App() {
  const [activeThread, setActiveThread] = useState<Thread>('developer');
  const [devChapterId, setDevChapterId] = useState('timeline');
  const [genChapterId, setGenChapterId] = useState('timeline');

  const activeChapterId = activeThread === 'developer' ? devChapterId : genChapterId;

  const handleChapterSelect = (id: string) => {
    if (activeThread === 'developer') setDevChapterId(id);
    else setGenChapterId(id);
  };

  const handleThreadSelect = (thread: Thread) => {
    setActiveThread(thread);
  };

  const renderDeveloperContent = () => {
    switch (devChapterId) {
      case 'timeline':      return <Timeline />;
      case 'setup':         return <Setup onComplete={() => setDevChapterId('basics')} />;
      case 'basics':        return <ModelComparison />;
      case 'scaffolds':     return <Scaffolds />;
      case 'tools':         return <ToolCalling />;
      case 'mcps':          return <MCP />;
      case 'skills':        return <Agents />;
      case 'agents-md':     return <AgentsMD />;
      case 'cli':           return <CLI />;
      case 'browser-use':   return <BrowserUse />;
      case 'multi-agent':   return <MultiAgent />;
      case 'ide-evolution': return <IDEEvolution />;
      default: return <FallbackContent id={devChapterId} curriculum={DEVELOPER_CURRICULUM} />;
    }
  };

  const renderGeneralistContent = () => {
    switch (genChapterId) {
      case 'timeline':      return <Timeline />;
      case 'g-setup':       return <Setup onComplete={() => setGenChapterId('g-basics')} />;
      case 'g-basics':      return <GeneralistBasics />;
      case 'g-tools':       return <GeneralistTools />;
      case 'g-connectors':  return <GeneralistConnectors />;
      case 'g-teach':       return <GeneralistTeach />;
      case 'g-brief':       return <GeneralistBrief />;
      case 'g-delegate':    return <GeneralistDelegate />;
      case 'g-research':    return <GeneralistResearch />;
      case 'g-teams':       return <GeneralistTeams />;
      case 'g-evolution':   return <GeneralistEvolution />;
      default: return <FallbackContent id={genChapterId} curriculum={GENERALIST_CURRICULUM} />;
    }
  };

  return (
    <Layout
      activeChapterId={activeChapterId}
      activeThread={activeThread}
      onChapterSelect={handleChapterSelect}
      onThreadSelect={handleThreadSelect}
    >
      {activeThread === 'developer' ? renderDeveloperContent() : renderGeneralistContent()}
    </Layout>
  );
}

function FallbackContent({ id, curriculum }: { id: string; curriculum: typeof DEVELOPER_CURRICULUM }) {
  const chapter = curriculum.find(c => c.id === id);
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-3xl font-semibold text-white mb-4">{chapter?.title}</h2>
      <p className="text-gray-400 max-w-2xl text-lg">{chapter?.description}</p>
      <div className="mt-12 p-8 border border-dashed border-white/20 rounded-2xl bg-white/5">
        <p className="text-gray-500 text-sm">Module coming soon.</p>
      </div>
    </div>
  );
}
