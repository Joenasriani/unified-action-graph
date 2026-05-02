import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { Box, ShieldAlert, GitMerge, FileText } from 'lucide-react';

function StatCard({ label, value, icon: Icon, colorClass, badgeType }: any) {
  return (
    <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-4 flex flex-col justify-between h-32 relative">
      <div className="flex justify-between items-start text-slate-400">
        <span className="uag-header">{label}</span>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="text-3xl font-mono tracking-tighter text-slate-100 flex items-end justify-between">
        {value}
        {badgeType === 'cyan' && <span className="uag-badge uag-badge-cyan mb-2 text-[8px]">Active</span>}
        {badgeType === 'amber' && value > 0 && <span className="uag-badge uag-badge-amber mb-2 text-[8px]">Action Req</span>}
      </div>
    </div>
  );
}

export function CommandDashboard() {
  const { signals, detections, workflows, auditLogs, connectors } = usePlatformStore();

  const openWorkflows = workflows.filter(w => w.status !== 'CLOSED').length;
  const unprocessedSignals = signals.filter(s => !s.isProcessed).length;
  
  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1 text-slate-100 tracking-tight">Command Hub</h1>
        <p className="text-slate-400 text-sm">Unified system overview and active operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Unprocessed Signals" value={unprocessedSignals} icon={Box} colorClass="text-amber-500" badgeType="amber" />
        <StatCard label="Active Detections" value={detections.length} icon={ShieldAlert} colorClass="text-red-500" />
        <StatCard label="Open Workflows" value={openWorkflows} icon={GitMerge} colorClass="text-cyan-500" badgeType="cyan" />
        <StatCard label="Audit Events" value={auditLogs.length} icon={FileText} colorClass="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Audit Logs */}
        <div className="uag-panel border border-surface-700 rounded-lg flex flex-col h-96">
          <div className="p-4 border-b border-surface-700 flex items-center justify-between">
            <span className="uag-header">System Event Tape</span>
          </div>
          <div className="p-3 overflow-y-auto space-y-1 flex-1 bg-slate-950">
            {auditLogs.slice(0, 15).map(log => (
              <div key={log.id} className="uag-audit-line flex truncate text-slate-300">
                <span className="text-slate-500 shrink-0 mr-2">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>
                <span className="text-cyan-500 shrink-0 mr-2">{log.action}:</span>
                <span className="truncate">{log.details}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Status */}
        <div className="uag-panel border border-surface-700 rounded-lg flex flex-col h-96">
          <div className="p-4 border-b border-surface-700 flex items-center justify-between">
            <span className="uag-header">Connector Topography</span>
          </div>
          <div className="p-4 overflow-y-auto space-y-2">
            {connectors.map(conn => (
              <div key={conn.id} className="flex items-center justify-between p-3 rounded bg-surface-800/50 border border-surface-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${conn.status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`} />
                  <span className="font-medium text-slate-200">{conn.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono text-slate-500">{conn.type}</span>
                  <span className="text-xs text-slate-400">Last seen: {format(new Date(conn.lastSync), 'HH:mm')}</span>
                </div>
              </div>
            ))}
            <div className="p-3 border border-dashed border-slate-700 rounded text-center text-slate-500 text-sm hover:text-slate-300 hover:border-slate-500 cursor-pointer transition-colors">
              + Deploy New Connector (Autoswagger logic stub)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
