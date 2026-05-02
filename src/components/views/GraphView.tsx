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
    <div className="relative h-full w-full flex flex-col bg-surface-900 overflow-hidden">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h1 className="text-2xl font-semibold mb-1 text-slate-100 tracking-tight drop-shadow-md">Entity Graph</h1>
        <p className="text-slate-400 text-sm drop-shadow-md">Relational view of entities derived from context and detections.</p>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full">
        {dimensions.width > 0 && (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={{ nodes: [...nodes], links: [...links] }} // Spread to ensure fresh ref for force-graph
            nodeLabel="label"
            nodeColor="color"
            nodeRelSize={4}
            linkColor={() => '#334155'}
            linkWidth={1.5}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            backgroundColor="#0B0F19" // Super dark Palantir style background
          />
        )}
      </div>
      
      {/* Legend overlay */}
      <div className="absolute bottom-6 right-6 z-10 bg-surface-800/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-lg">
        <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Topology Legend</h4>
        <div className="space-y-2 text-xs text-slate-300">
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#f87171] mr-2"/> IPs / Infrastructure</div>
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#38bdf8] mr-2"/> User Identities</div>
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#fbbf24] mr-2"/> Cloud Assets</div>
           <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2 animate-pulse"/> Active Detections</div>
        </div>
      </div>
    </div>
  );
}
