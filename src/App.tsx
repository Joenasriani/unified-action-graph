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
    <div className="flex h-screen w-full bg-surface-900 text-slate-200 overflow-hidden font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 overflow-hidden relative">
        {renderView()}
      </main>
    </div>
  );
}

