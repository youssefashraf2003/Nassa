import { Card } from "./ui/card";
import { useStudyMetrics } from "@/hooks/useStudies";
// Use the 2D-only build to avoid A-Frame/VR peer deps
import ForceGraph2D from "react-force-graph-2d";
import { useEffect, useMemo, useRef, useState } from "react";

export const KnowledgeGraph = () => {
  const { data: metrics } = useStudyMetrics();

  if (!metrics) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-foreground mb-6">🌐 Knowledge Graph Explorer</h1>
      <p className="text-muted-foreground mb-8">
        Visualize the relationships between key topics, experiments, and outcomes. Hover over a connection (edge) to see supporting publications.
      </p>

      <Card className="p-8 bg-card border-border/50">
        <div className="relative h-[60vh] flex flex-col gap-6">
          {/* Static snapshot image */}
          <div className="w-full overflow-hidden rounded-md border border-border/50">
            <img src="/knowledge_graph.png" alt="Knowledge Graph" className="w-full max-h-64 object-contain bg-background" />
          </div>

          {/* Interactive force-directed graph from generated JSON */}
          <div className="flex-1 min-h-[600px] rounded-md border border-border/50 bg-white">
            {useMemo(() => {
              // Load once per render
              return <GraphLoader fallbackTopics={metrics.keyTopics || []} />;
            }, [metrics.keyTopics])}
          </div>

          <div className="flex justify-around w-full flex-wrap gap-4">
            {metrics.keyTopics.map((topic, idx) => {
              const isEmerging = topic.toLowerCase().includes('radiation');
              return (
                <div
                  key={topic}
                  className={`px-6 py-3 rounded-full text-center font-medium shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isEmerging 
                      ? 'bg-accent text-accent-foreground shadow-[0_0_10px_rgba(255,153,0,0.5)]' 
                      : 'bg-primary/20 text-primary border-2 border-primary shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                  }`}
                >
                  {topic}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Drag nodes to rearrange connections dynamically. The static image above is a snapshot, while the graph is interactive.
            </p>
            <p className="text-primary text-xs mt-2">
              Total Nodes: {metrics.keyTopics.length} | Total Connections: {metrics.totalStudies}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <Card className="p-4 bg-background border-border/50">
              <h3 className="font-semibold text-primary mb-2">Core Topics</h3>
              <p className="text-sm text-muted-foreground">Highly researched areas with strong consensus</p>
            </Card>
            <Card className="p-4 bg-background border-border/50">
              <h3 className="font-semibold text-accent mb-2">Emerging Areas</h3>
              <p className="text-sm text-muted-foreground">New research directions with growing interest</p>
            </Card>
            <Card className="p-4 bg-background border-border/50">
              <h3 className="font-semibold text-green-400 mb-2">Knowledge Gaps</h3>
              <p className="text-sm text-muted-foreground">Under-researched areas needing attention</p>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};

const GraphLoader = ({ fallbackTopics }: { fallbackTopics: string[] }) => {
  const [data, setData] = useState<{ nodes: any[]; links: any[] } | null>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/knowledge_graph.json')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('missing json')))
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => {
        if (cancelled) return;
        const nodes = fallbackTopics.map((t, i) => ({ id: t, group: i % 3 }));
        const links = fallbackTopics.map((t, i) => ({ source: t, target: fallbackTopics[(i + 1) % fallbackTopics.length] }));
        setData({ nodes, links });
      });
    return () => { cancelled = true; };
  }, [fallbackTopics]);

  if (!data) return null;

  // Tuning forces for spacing and readability
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Increase distances and repulsion so nodes are spaced
    const linkForce = fg.d3Force('link');
    if (linkForce && linkForce.distance) linkForce.distance(180);
    const chargeForce = fg.d3Force('charge');
    if (chargeForce && chargeForce.strength) chargeForce.strength(-600);
    // stabilize
    fg.zoomToFit(400, 60);
  }, [data]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={data}
      nodeAutoColorBy={(n: any) => n.type || n.group}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.004}
      cooldownTicks={0}
      enableNodeDrag
      warmupTicks={0}
      d3VelocityDecay={0.9}
      backgroundColor="#ffffff"
      nodeRelSize={12}
      nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.id;
        const fontSize = Math.max(10, 18 / globalScale);
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth + 10, fontSize + 6];

        // draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color || '#3182ce';
        ctx.fill();

        // draw label background
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(node.x + 8, node.y - fontSize, bckgDimensions[0], bckgDimensions[1]);

        // draw text
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x + 12, node.y);
      }}
      // keep links visible and readable
      linkColor={() => '#9ca3af'}
      linkWidth={() => 1}
      linkLabel={(l: any) => l.label || ''}
      linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!link.label) return;
        const start = link.source;
        const end = link.target;
        if (!start || !end) return;
        const text = String(link.label);
        const fontSize = Math.max(9, 14 / globalScale);
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.fillStyle = '#dc2626'; // red like PNG
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.save();
        ctx.translate(midX, midY);
        // simple orientation
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.rotate(angle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, 0, -2);
        ctx.restore();
      }}
    />
  );
}
