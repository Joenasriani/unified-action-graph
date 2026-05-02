import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { CommandDashboard } from './components/views/CommandDashboard';
import { FeedView } from './components/views/FeedView';
import { DetectionView } from './components/views/DetectionView';
import { GraphView } from './components/views/GraphView';
import { WorkflowView } from './components/views/WorkflowView';
import { AuditView } from './components/views/AuditView';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <CommandDashboard />;
      case 'feeds': return <FeedView />;
      case 'detections': return <DetectionView />;
      case 'graph': return <GraphView />;
      case 'workflows': return <WorkflowView />;
      case 'audit': return <AuditView />;
      default: return <CommandDashboard />;
    }
  };

  return (
    <div className="grid grid-cols-[240px_1fr] grid-rows-[64px_1fr] h-screen w-full bg-surface-800 text-slate-200 overflow-hidden font-sans gap-[1px]">
      <header className="col-span-2 flex items-center justify-between px-6 bg-surface-900 relative z-20">
        <div><h1 className="text-lg font-bold tracking-tighter text-cyan-400">UNIFIED ACTION GRAPH <span className="text-slate-500 font-normal ml-2 text-xs uppercase">v1.0.4-BETA</span></h1></div>
        <div className="flex items-center gap-6 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM OPERATIONAL</div>
          <div className="flex items-center gap-2 text-slate-400">CONNECTED REPOS: 3</div>
          <div className="px-3 py-1 bg-surface-800 rounded border border-surface-700 font-mono">NODE: US-EAST-1</div>
        </div>
      </header>
      <div className="row-start-2 bg-surface-900 flex flex-col h-full overflow-hidden">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      </div>
      <main className="col-start-2 row-start-2 overflow-hidden relative uag-main-gradient flex flex-col h-full">
        <div className="absolute inset-0 uag-bg-dots pointer-events-none z-0"></div>
        <div className="relative z-10 h-full overflow-hidden w-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

