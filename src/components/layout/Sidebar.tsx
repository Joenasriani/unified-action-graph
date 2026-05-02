import React from 'react';
import {
  Activity, ShieldAlert, Network, Box, TerminalSquare, Search, GitMerge, FileText, Share2, Layers
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Command Hub', icon: TerminalSquare },
    { id: 'feeds', label: 'Raw Feeds', icon: Activity },
    { id: 'detections', label: 'Detections', icon: ShieldAlert },
    { id: 'graph', label: 'Entity Graph', icon: Network },
    { id: 'workflows', label: 'Workflows', icon: GitMerge },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  return (
    <div className="w-64 bg-surface-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 text-cyan-400">
        <Layers className="w-6 h-6" />
        <span className="font-mono font-bold tracking-tight text-lg">UAG.core</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                    isActive 
                      ? 'bg-brand-900/40 text-brand-500 border border-brand-900/50' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-surface-900/50">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Sys_Status</span>
          <span className="text-emerald-500 flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 -animate-pulse"/>NOMINAL</span>
        </div>
      </div>
    </div>
  );
}
