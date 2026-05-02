import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { usePlatformStore } from '../../store/usePlatformStore';

export function GraphView() {
  const { nodes, links } = usePlatformStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<any>(null);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    }
    // delay initially to let layout settle
    setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force graph to fit view periodically just in case
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, [nodes.length, dimensions]); // Only rezoom when topology or size changes significantly

  return (
    <div className="relative h-full w-full flex flex-col bg-transparent overflow-hidden">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold mb-1 text-slate-100 tracking-tighter drop-shadow-md">Entity Graph</h1>
        <p className="text-slate-400 text-sm drop-shadow-md">Relational view of entities derived from context and detections.</p>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full relative z-0">
        {dimensions.width > 0 && (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={{ nodes: [...nodes], links: [...links] }} // Spread to ensure fresh ref for force-graph
            nodeLabel="label"
            nodeColor={(node) => node.color === '#ef4444' ? '#22d3ee' : node.color} // Recolor detection node to cyan
            nodeRelSize={4}
            linkColor={() => 'rgba(51, 65, 85, 0.5)'}
            linkWidth={1}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            backgroundColor="transparent"
          />
        )}
      </div>
      
      {/* Legend overlay */}
      <div className="absolute bottom-6 right-6 z-10 bg-surface-900/80 backdrop-blur-md border border-surface-700/50 p-4 rounded-lg">
        <h4 className="uag-header mb-2">Topology Legend</h4>
        <div className="space-y-2 text-xs text-slate-300 font-mono">
           <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#f87171] mr-2 shadow-[0_0_8px_rgba(248,113,113,0.5)]"/> IPs / Infrastructure</div>
           <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#38bdf8] mr-2 shadow-[0_0_8px_rgba(56,189,248,0.5)]"/> User Identities</div>
           <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#fbbf24] mr-2 shadow-[0_0_8px_rgba(251,191,36,0.5)]"/> Cloud Assets</div>
           <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse"/> Active Detections</div>
        </div>
      </div>
    </div>
  );
}
