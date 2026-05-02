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
          <h1 className="text-2xl font-bold mb-1 text-slate-100 tracking-tighter">Raw Feed Inbox</h1>
          <p className="text-slate-400 text-sm">Consolidated high-fidelity signals originating from configured connectors.</p>
        </div>
        <div className="uag-badge uag-badge-cyan">
          {signals.filter(s => !s.isProcessed).length} UNPROCESSED
        </div>
      </div>

      <div className="uag-panel rounded-lg border border-surface-700 overflow-hidden flex-1 shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-800/50 border-b border-surface-700">
              <th className="p-4 w-40 uag-header">Timestamp</th>
              <th className="p-4 w-32 uag-header">Priority</th>
              <th className="p-4 w-48 uag-header">Source</th>
              <th className="p-4 uag-header">Signal Type / Raw Data</th>
              <th className="p-4 w-32 text-right uag-header">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700 font-mono text-sm text-slate-300">
            {signals.map(signal => {
              const priorityColors = {
                CRITICAL: 'text-red-400 border-red-400 bg-red-400/10',
                HIGH: 'text-amber-400 border-amber-400 bg-amber-400/10',
                MEDIUM: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
                LOW: 'text-slate-400 border-slate-400 bg-slate-400/10'
              };

              return (
                <tr key={signal.id} className={signal.isProcessed ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-surface-800/60'}>
                  <td className="p-4 align-top text-xs text-slate-400">{format(new Date(signal.timestamp), 'MM-dd HH:mm:ss')}</td>
                  <td className="p-4 align-top">
                    <span className={`uag-badge ${priorityColors[signal.priority]}`}>
                      {signal.priority}
                    </span>
                  </td>
                  <td className="p-4 align-top font-bold text-cyan-500/80">{signal.source}</td>
                  <td className="p-4 align-top">
                    <div className="font-semibold text-slate-200 mb-1">{signal.type}</div>
                    <div className="text-xs text-slate-500 overflow-x-auto whitespace-pre rounded bg-slate-950 p-2 border border-surface-700 max-w-xl">
                      {JSON.stringify(signal.rawPayload, null, 2)}
                    </div>
                  </td>
                  <td className="p-4 align-top text-right">
                    {!signal.isProcessed ? (
                      <button 
                        onClick={() => promoteSignal(signal.id)}
                        className="uag-btn-action inline-flex flex-row items-center whitespace-nowrap"
                      >
                        Promote <ArrowRight className="w-4 h-4 ml-1" />
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
