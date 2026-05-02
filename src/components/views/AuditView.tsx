import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

export function AuditView() {
  const { auditLogs } = usePlatformStore();

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-5xl mx-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 text-slate-100 tracking-tighter">Immutable Audit Log</h1>
        <p className="text-slate-400 text-sm">Cryptographically verifiable sequence of events across the platform.</p>
      </div>

      <div className="uag-panel rounded-lg border border-surface-700 shadow-xl p-4 bg-slate-950">
        <div className="divide-y divide-surface-700/80 group">
          {auditLogs.map((log, i) => (
             <div key={log.id} className="py-2 hover:bg-surface-800/30 transition duration-150 flex items-start gap-4 font-mono text-sm group-hover:opacity-70 hover:!opacity-100">
                <div className="text-slate-500 w-36 shrink-0 mt-0.5">
                  {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                </div>
                <div className="flex flex-col gap-1 w-full max-w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-500 font-bold truncate">
                      {log.action}
                    </span>
                    <span className="text-slate-500 text-xs">//</span>
                    <span className="text-slate-400 text-xs">
                       Target: <span className="text-amber-500">{log.targetId}</span>
                    </span>
                  </div>
                  <div className="text-slate-300 mt-1 pl-4 border-l-2 border-surface-700 text-[11px]">
                    {log.details}
                  </div>
                </div>
                <div className="shrink-0 text-slate-600 text-xs text-right w-20">
                   {log.actor}
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
