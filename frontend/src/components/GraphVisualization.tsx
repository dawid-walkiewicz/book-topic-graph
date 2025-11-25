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
}

export const GraphVisualization = ({
  graphData,
  loading,
  onNodeClick,
  maxDistance,
  onMaxDistanceChange,
  onRerender
}: GraphVisualizationProps) => {
  const graphRef = useRef<any>();

  const handleNodeClick = useCallback((node: any) => {
    onNodeClick(node as GraphNode);
  }, [onNodeClick]);

  // Filter links by distance
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;

    // If maxDistance is 0, show all links (unlimited)
    if (maxDistance === 0) {
      return graphData;
    }

    // Create a map of node positions for quick lookup
    const nodePositions = new Map<string, { x: number; y: number }>();
    graphData.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        nodePositions.set(node.id, { x: node.x, y: node.y });
      }
    });

    // Filter links based on Euclidean distance
    let debugCount = 0;
    const filteredLinks = graphData.links.filter((link: any) => {
      // Handle both string IDs and object references (ForceGraph mutates these)
      const sourceId = typeof link.source === 'object' && link.source !== null
        ? link.source.id
        : link.source;
      const targetId = typeof link.target === 'object' && link.target !== null
        ? link.target.id
        : link.target;

      const sourcePos = nodePositions.get(sourceId);
      const targetPos = nodePositions.get(targetId);

      if (!sourcePos || !targetPos) {
        console.warn('Missing positions for link:', { sourceId, targetId });
        return false;
      }

      // Calculate Euclidean distance
      const distance = Math.sqrt(
        Math.pow(sourcePos.x - targetPos.x, 2) +
        Math.pow(sourcePos.y - targetPos.y, 2)
      );

      const shouldShow = distance <= maxDistance;

      // Debug logging (first 5 links only)
      if (debugCount < 5) {
        console.log('Link distance:', distance.toFixed(2), 'maxDistance:', maxDistance, 'show:', shouldShow);
        debugCount++;
      }

      return shouldShow;
    });

    console.log(`Filtered ${filteredLinks.length} links out of ${graphData.links.length} (maxDistance: ${maxDistance})`);

    return {
      nodes: graphData.nodes,
      links: filteredLinks
    };
  }, [graphData, maxDistance]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.title;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#1976d2';
    ctx.fill();

    // Draw label on hover
    if (globalScale > 1.5) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      ctx.fillText(label, node.x, node.y + 10);
    }
  }, []);

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
