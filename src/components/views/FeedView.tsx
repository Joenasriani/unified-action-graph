import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export function FeedView() {
  const { signals, promoteSignal } = usePlatformStore();

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-7xl mx-auto flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-slate-100 tracking-tight">Raw Feed Inbox</h1>
          <p className="text-slate-400 text-sm">Consolidated high-fidelity signals originating from configured connectors.</p>
        </div>
      </div>

      <div className="bg-surface-800 rounded-lg border border-slate-700 overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-900 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4 w-40">Timestamp</th>
              <th className="p-4 w-32">Priority</th>
              <th className="p-4 w-48">Source</th>
              <th className="p-4">Signal Type / Raw Data</th>
              <th className="p-4 w-32 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-sm text-slate-300 bg-surface-800/50">
            {signals.map(signal => {
              const priorityColors = {
                CRITICAL: 'text-red-400 border-red-400 bg-red-400/10',
                HIGH: 'text-amber-400 border-amber-400 bg-amber-400/10',
                MEDIUM: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
                LOW: 'text-slate-400 border-slate-400 bg-slate-400/10'
              };

              return (
                <tr key={signal.id} className={signal.isProcessed ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-slate-800/80'}>
                  <td className="p-4 align-top text-xs">{format(new Date(signal.timestamp), 'MM-dd HH:mm:ss')}</td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 text-[10px] border rounded uppercase ${priorityColors[signal.priority]}`}>
                      {signal.priority}
                    </span>
                  </td>
                  <td className="p-4 align-top">{signal.source}</td>
                  <td className="p-4 align-top">
                    <div className="font-semibold text-brand-50 mb-1">{signal.type}</div>
                    <div className="text-xs text-slate-500 overflow-x-auto whitespace-pre rounded bg-surface-900 p-2 border border-slate-800 max-w-xl">
                      {JSON.stringify(signal.rawPayload, null, 2)}
                    </div>
                  </td>
                  <td className="p-4 align-top text-right">
                    {!signal.isProcessed ? (
                      <button 
                        onClick={() => promoteSignal(signal.id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold font-sans transition-colors"
                      >
                        Promote <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Promoted</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {signals.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                  No signals found currently.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
