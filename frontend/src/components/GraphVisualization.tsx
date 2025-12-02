import { useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, GraphNode, GraphLink } from '../types/graph';
import { Box, CircularProgress, Typography } from '@mui/material';
import { GraphControls } from './GraphControls';

interface GraphVisualizationProps {
  graphData: GraphData | null;
  loading: boolean;
  onNodeClick: (node: GraphNode) => void;
  maxDistance: number;
  onMaxDistanceChange: (value: number) => void;
  onRerender: () => void;
  nodeSize: number;
  onNodeSizeChange: (value: number) => void;
}

export const GraphVisualization = ({
  graphData,
  loading,
  onNodeClick,
  maxDistance,
  onMaxDistanceChange,
  onRerender,
  nodeSize,
  onNodeSizeChange
}: GraphVisualizationProps) => {
  const graphRef = useRef<any>();

  const handleNodeClick = useCallback((node: any) => {
    onNodeClick(node as GraphNode);
  }, [onNodeClick]);

  const handleCenterView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(1000, 50); // 1 second animation, 50px padding
    }
  }, []);

  // Filter links by distance
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;

    // Disable all connections - show only nodes
    return {
      nodes: graphData.nodes,
      links: [] // Empty array = no connections displayed
    };
  }, [graphData]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.title;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#1976d2';
    ctx.fill();

    // Draw label on hover
    if (globalScale > 1.5) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      ctx.fillText(label, node.x, node.y + nodeSize + 5);
    }
  }, [nodeSize]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">Wczytuję graf książek...</Typography>
      </Box>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6" color="text.secondary">
          Brak danych do wyświetlenia
        </Typography>
      </Box>
    );
  }

  return (
    <Box width="100%" height="100vh" position="relative">
      <GraphControls
        maxDistance={maxDistance}
        onMaxDistanceChange={onMaxDistanceChange}
        onRerender={onRerender}
        nodeSize={nodeSize}
        onNodeSizeChange={onNodeSizeChange}
        onCenterView={handleCenterView}
      />
      <ForceGraph2D
        ref={graphRef}
        graphData={filteredGraphData || graphData}
        nodeId="id"
        nodeLabel={(node: any) => `${node.title}\n${node.author}`}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        onNodeClick={handleNodeClick}
        linkWidth={(link: any) => Math.max(0.5, link.value * 2)}
        linkColor={() => 'rgba(150, 150, 150, 0.3)'}
        linkDirectionalParticles={0}
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </Box>
  );
};
