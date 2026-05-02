import React from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { GitMerge, Fingerprint } from 'lucide-react';

export function DetectionView() {
  const { detections, createWorkflow } = usePlatformStore();

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-7xl mx-auto flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-slate-100 tracking-tighter">Detections</h1>
          <p className="text-slate-400 text-sm">Confirmed signals awaiting workflow assignment and analysis.</p>
        </div>
        {detections.length > 0 && <div className="uag-badge uag-badge-amber">{detections.filter(d => !d.workflowId).length} UNASSIGNED</div>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {detections.map(det => (
          <div key={det.id} className="bg-surface-900 border border-surface-700 hover:border-surface-600 rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors relative overflow-hidden shadow-lg">
            {det.workflowId && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                 <div className="absolute top-4 -right-12 w-40 text-center bg-cyan-500 font-bold text-[10px] text-surface-900 py-1 rotate-45 flex items-center justify-center tracking-wider">
                    ASSIGNED
                 </div>
              </div>
            )}
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <ShieldIcon priority={det.priority} />
                <h3 className="text-lg font-bold text-slate-100 uppercase tracking-tight">{det.title}</h3>
                <span className="uag-badge border border-surface-700 bg-surface-800 text-slate-400">
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
                    <span key={e} className="ml-1 bg-surface-800 text-cyan-400 border border-surface-700 px-1.5 rounded">
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
                  className="mt-4 md:mt-0 uag-btn-action flex items-center"
                >
                  <GitMerge className="w-4 h-4 mr-2" /> Assign to Workflow
                </button>
              ) : (
                <div className="mt-4 md:mt-0 flex items-center text-cyan-400 text-sm font-mono border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 rounded-md">
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
