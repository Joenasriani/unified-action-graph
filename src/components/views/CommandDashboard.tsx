import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { Box, ShieldAlert, GitMerge, FileText } from 'lucide-react';

function StatCard({ label, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-surface-800/50 border border-slate-700/50 rounded-lg p-4 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start text-slate-400">
        <span className="text-sm font-medium">{label}</span>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="text-3xl font-mono text-slate-100">
        {value}
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
        <StatCard label="Unprocessed Signals" value={unprocessedSignals} icon={Box} colorClass="text-amber-500" />
        <StatCard label="Active Detections" value={detections.length} icon={ShieldAlert} colorClass="text-red-500" />
        <StatCard label="Open Workflows" value={openWorkflows} icon={GitMerge} colorClass="text-cyan-500" />
        <StatCard label="Audit Events" value={auditLogs.length} icon={FileText} colorClass="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Audit Logs */}
        <div className="bg-surface-800/40 border border-slate-800 rounded-lg flex flex-col h-96">
          <div className="p-4 border-b border-slate-800 uppercase text-xs font-semibold text-slate-500 tracking-wider">
            System Event Tape
          </div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1 font-mono text-sm">
            {auditLogs.slice(0, 8).map(log => (
              <div key={log.id} className="flex space-x-3 text-slate-300">
                <span className="text-slate-500 shrink-0">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>
                <span className="text-brand-500 shrink-0">{log.action}</span>
                <span className="truncate">{log.details}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-surface-800/40 border border-slate-800 rounded-lg flex flex-col h-96">
          <div className="p-4 border-b border-slate-800 uppercase text-xs font-semibold text-slate-500 tracking-wider">
            Connector Topography
          </div>
          <div className="p-4 overflow-y-auto space-y-4">
            {connectors.map(conn => (
              <div key={conn.id} className="flex items-center justify-between p-3 rounded bg-surface-900 border border-slate-800">
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
