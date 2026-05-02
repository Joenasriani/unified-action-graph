import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

export function AuditView() {
  const { auditLogs } = usePlatformStore();

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-5xl mx-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1 text-slate-100 tracking-tight">Immutable Audit Log</h1>
        <p className="text-slate-400 text-sm">Cryptographically verifiable sequence of events across the platform.</p>
      </div>

      <div className="bg-surface-800 rounded border border-slate-700 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-700/80 group">
          {auditLogs.map((log, i) => (
             <div key={log.id} className="p-4 hover:bg-surface-700/50 transition duration-150 flex items-start gap-4 font-mono text-sm">
                <div className="text-slate-500 w-36 shrink-0 mt-0.5">
                  {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS').slice(0, 23)}
                </div>
                <div className="flex flex-col gap-1 w-full max-w-full">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-900/30 text-brand-400 border border-brand-900/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-xs">
                       Target: <span className="text-amber-400">{log.targetId}</span> ({log.targetType})
                    </span>
                  </div>
                  <div className="text-slate-200 mt-1">
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
