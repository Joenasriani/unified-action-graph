import React, { useState } from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { format } from 'date-fns';
import { Play, CheckCircle, XCircle, Clock, Search, ChevronRight } from 'lucide-react';

export function WorkflowView() {
  const { workflows, detections, executeAction, closeWorkflow } = usePlatformStore();
  const [selectedWfId, setSelectedWfId] = useState<string | null>(null);

  const selectedWf = workflows.find(w => w.id === selectedWfId);
  const relatedDetection = selectedWf ? detections.find(d => d.id === selectedWf.detectionId) : null;

  return (
    <div className="h-full flex overflow-hidden w-full relative bg-transparent">
      
      {/* Left List Pane (Kanban-esque list) */}
      <div className={`border-r border-surface-700 flex flex-col transition-all duration-300 bg-surface-900/50 backdrop-blur-sm ${selectedWfId ? 'w-1/3' : 'w-full max-w-7xl mx-auto px-6 py-6 border-none'}`}>
        {!selectedWfId && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1 text-slate-100 tracking-tighter">Active Workflows</h1>
            <p className="text-slate-400 text-sm">Manage automated recommendations and execute mitigations.</p>
          </div>
        )}
        
        <div className={`flex-1 overflow-y-auto ${selectedWfId ? 'p-4' : ''}`}>
          <div className="space-y-3">
            {workflows.map(wf => {
              const det = detections.find(d => d.id === wf.detectionId);
              const isSelected = selectedWfId === wf.id;
              return (
                <div 
                  key={wf.id}
                  onClick={() => setSelectedWfId(wf.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-surface-800 border-cyan-500 shadow-[0_0_10px_rgba(6,184,212,0.15)] ring-1 ring-cyan-500/50' 
                      : 'bg-surface-800/80 border-surface-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                      {wf.id}
                    </span>
                    <span className={`uag-badge ${
                      wf.status === 'CLOSED' ? 'bg-surface-700 text-slate-400 border-surface-600' :
                      wf.status === 'IN_PROGRESS' ? 'uag-badge-amber' : 
                      'uag-badge-cyan'
                    }`}>
                      {wf.status}
                    </span>
                  </div>
                  <div className="font-medium text-slate-200 text-sm mb-1 line-clamp-1">{det?.title || 'Unknown Detection'}</div>
                  <div className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Updated: {format(new Date(wf.updatedAt), 'HH:mm:ss')}
                  </div>
                </div>
              );
            })}
            
            {workflows.length === 0 && (
               <div className="text-center p-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                 No active workflows. Promote a detection first.
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedWfId && selectedWf && (
        <div className="w-2/3 flex flex-col bg-surface-900 h-full shadow-2xl relative animate-in slide-in-from-right-4 duration-300 border-l border-surface-700 z-10">
           {/* Header */}
           <div className="p-6 border-b border-surface-700 flex justify-between items-start bg-surface-900">
             <div>
               <div className="flex items-center space-x-2 mb-2">
                 <button onClick={() => setSelectedWfId(null)} className="text-slate-500 hover:text-slate-300 mr-2">
                   <ChevronRight className="w-5 h-5 rotate-180" />
                 </button>
                 <span className="font-mono text-cyan-400 font-bold tracking-tight">WORKFLOW TICKET // {selectedWf.id}</span>
               </div>
               <h2 className="text-xl font-bold text-slate-100 uppercase tracking-tight">{relatedDetection?.title}</h2>
               <p className="text-sm text-slate-400 mt-1 max-w-2xl">{relatedDetection?.description}</p>
             </div>
             
             {selectedWf.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    closeWorkflow(selectedWf.id, "Manually dismissed/resolved by operator.");
                  }}
                  className="px-4 py-2 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-md text-slate-300 text-sm font-semibold transition-colors"
                >
                  Close Case
                </button>
             )}
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-900">
              
              {/* Context Block */}
              <div>
                <h3 className="uag-header mb-3 border-b border-surface-700 pb-2">Forensic Context</h3>
                <div className="bg-surface-800/80 rounded border border-surface-700 p-4 font-mono text-sm text-slate-300 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <span className="text-slate-500 block mb-1">Entities Involved:</span>
                       {relatedDetection?.relatedEntities.map(e => <div key={e} className="text-amber-500 font-bold">{e}</div>)}
                     </div>
                     <div>
                       <span className="text-slate-500 block mb-1">Confidence Score:</span>
                       <div className="text-cyan-400 font-bold">{relatedDetection?.confidence}</div>
                     </div>
                  </div>
                </div>
              </div>

              {/* COAs / Actions */}
              <div>
                <div className="flex justify-between items-end mb-3 border-b border-surface-700 pb-2">
                  <h3 className="uag-header">Recommended Courses of Action</h3>
                  <span className="text-[10px] text-cyan-500 font-mono">Powered by Deterministic Engine (MVP)</span>
                </div>
                
                <div className="space-y-3">
                  {selectedWf.coursesOfAction.map(coa => (
                    <div key={coa.id} className={`p-4 rounded-xl border flex items-start justify-between transition-colors ${
                      coa.isExecuted ? 'bg-surface-800/50 border-surface-700 opacity-60' : 'bg-surface-800 border-cyan-500/30 shadow-md'
                    }`}>
                      <div className="flex-1 pr-4">
                         <div className="flex items-center space-x-2 mb-1">
                           <span className={`uag-badge ${
                             coa.type === 'MITIGATION' ? 'uag-badge-amber text-[8px]' : 'uag-badge-cyan text-[8px]'
                           }`}>
                             {coa.type}
                           </span>
                           <span className="font-semibold text-slate-200 text-sm uppercase">{coa.label}</span>
                         </div>
                         <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{coa.description}</p>
                         
                         {coa.isExecuted && coa.executedAt && (
                           <div className="text-xs text-cyan-500 font-mono mt-3 flex items-center">
                             <CheckCircle className="w-3 h-3 mr-1" /> Executed at {format(new Date(coa.executedAt), 'HH:mm')}
                           </div>
                         )}
                      </div>
                      
                      {!coa.isExecuted && selectedWf.status !== 'CLOSED' && (
                        <button
                          onClick={() => executeAction(selectedWf.id, coa.id)}
                          className="uag-btn-action shrink-0 flex items-center"
                        >
                          Execute
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {selectedWf.coursesOfAction.length === 0 && (
                    <div className="text-slate-500 text-sm">No actions generated for this detection signature.</div>
                  )}
                </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
