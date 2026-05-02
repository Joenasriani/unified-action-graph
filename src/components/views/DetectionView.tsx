import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { GitMerge, Fingerprint } from 'lucide-react';

export function DetectionView() {
  const { detections, createWorkflow } = usePlatformStore();

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-7xl mx-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1 text-slate-100 tracking-tight">Detections</h1>
        <p className="text-slate-400 text-sm">Confirmed signals awaiting workflow assignment and analysis.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {detections.map(det => (
          <div key={det.id} className="bg-surface-800 border border-slate-700/80 hover:border-slate-600 rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors relative overflow-hidden">
            {det.workflowId && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                 <div className="absolute top-4 -right-12 w-40 text-center bg-emerald-600 font-bold text-[10px] text-white py-1 rotate-45 flex items-center justify-center">
                    ASSIGNED
                 </div>
              </div>
            )}
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <ShieldIcon priority={det.priority} />
                <h3 className="text-lg font-medium text-slate-100">{det.title}</h3>
                <span className="text-xs font-mono text-slate-500 bg-surface-900 px-2 py-0.5 rounded border border-slate-800">
                  {det.id}
                </span>
              </div>
              
              <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
                {det.description}
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center text-xs font-mono text-slate-500">
                  <Fingerprint className="w-3 h-3 mr-1" />
                  Entities: {det.relatedEntities.map(e => (
                    <span key={e} className="ml-1 bg-brand-900/40 text-brand-400 border border-brand-900 px-1.5 rounded">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end justify-between shrink-0 h-full min-h-[100px]">
              <div className="text-xs font-mono text-slate-500">
                {format(new Date(det.timestamp), 'yyyy-MM-dd HH:mm:ss')}
              </div>
              
              {!det.workflowId ? (
                <button
                  onClick={() => createWorkflow(det.id)}
                  className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-slate-700 hover:bg-brand-600 text-white rounded font-medium text-sm transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                >
                  <GitMerge className="w-4 h-4 mr-2" /> Assign to Workflow
                </button>
              ) : (
                <div className="mt-4 md:mt-0 flex items-center text-emerald-500 text-sm font-mono border border-emerald-900/50 bg-emerald-900/10 px-3 py-1.5 rounded">
                  <GitMerge className="w-4 h-4 mr-2" /> {det.workflowId}
                </div>
              )}
            </div>
          </div>
        ))}

        {detections.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
            <ShieldAlert className="w-12 h-12 mb-4 text-slate-600" />
            <p>No active detections.</p>
            <p className="text-sm">Promote signals from the Feed to create detections.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldIcon({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    CRITICAL: 'text-red-500',
    HIGH: 'text-amber-500',
    MEDIUM: 'text-yellow-500',
    LOW: 'text-slate-400',
  };
  return <ShieldAlert className={`w-6 h-6 ${colors[priority] || 'text-slate-400'}`} />;
}
