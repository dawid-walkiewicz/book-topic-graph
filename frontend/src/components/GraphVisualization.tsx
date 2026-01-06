import { useState, useCallback, useMemo, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { OrthographicView } from '@deck.gl/core';
import type { GraphData, GraphNode } from '../types/graph';
import { Box, CircularProgress, Typography } from '@mui/material';
import { GraphControls } from './GraphControls';

interface GraphVisualizationProps {
  graphData: GraphData | null;
  loading: boolean;
  onNodeClick: (node: GraphNode) => void;
  onRerender: () => void;
  nodeSize: number;
  onNodeSizeChange: (value: number) => void;
}

export const GraphVisualization = ({
  graphData,
  loading,
  onNodeClick,
  onRerender,
  nodeSize,
  onNodeSizeChange
}: GraphVisualizationProps) => {
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [webglReady, setWebglReady] = useState(false);

  const [viewState, setViewState] = useState({
    target: [0, 0] as [number, number],
    zoom: 8,
    minZoom: -2,
    maxZoom: 14,
  });

  // Calculate data bounds
  const dataBounds = useMemo(() => {
    if (!graphData?.nodes?.length) return null;

    const xs = graphData.nodes.map(n => n.x || 0);
    const ys = graphData.nodes.map(n => n.y || 0);

    return {
      centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
      centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }, [graphData]);

  // Center view when data loads
  useEffect(() => {
    if (dataBounds) {
      setViewState(prev => ({
        ...prev,
        target: [dataBounds.centerX, dataBounds.centerY],
      }));
    }
  }, [dataBounds]);

  const handleCenterView = useCallback(() => {
    if (!dataBounds) return;
    setViewState(prev => ({
      ...prev,
      target: [dataBounds.centerX, dataBounds.centerY],
      zoom: 8,
    }));
  }, [dataBounds]);

  const scatterLayer = useMemo(() => {
    if (!graphData?.nodes?.length) return null;

    return new ScatterplotLayer<GraphNode>({
      id: 'books-scatter',
      data: graphData.nodes,
      pickable: true,
      getPosition: (d: GraphNode) => [d.x || 0, d.y || 0],
      getRadius: nodeSize,
      radiusUnits: 'pixels',
      radiusMinPixels: 1,
      radiusMaxPixels: 50,
      getFillColor: [25, 118, 210, 200],
      onHover: (info) => setHoveredNode(info.object || null),
      onClick: (info) => {
        if (info.object) {
          onNodeClick(info.object);
        }
      },
      updateTriggers: {
        getRadius: nodeSize,
      },
    });
  }, [graphData, nodeSize, onNodeClick]);

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
        <Typography variant="h6">Loading book data...</Typography>
      </Box>
    );
  }

  if (!graphData?.nodes?.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6" color="text.secondary">
          No data to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      width="100%"
      height="100vh"
      position="relative"
      sx={{ background: '#f5f5f5' }}
    >
      <GraphControls
        onRerender={onRerender}
        nodeSize={nodeSize}
        onNodeSizeChange={onNodeSizeChange}
        onCenterView={handleCenterView}
      />
      <DeckGL
        views={new OrthographicView({ id: 'ortho', flipY: false })}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as typeof viewState)}
        controller={true}
        layers={scatterLayer ? [scatterLayer] : []}
        getCursor={({ isHovering }) => isHovering ? 'pointer' : 'grab'}
        onLoad={() => setWebglReady(true)}
        onError={(error) => console.warn('DeckGL error:', error)}
      />
      {!webglReady && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            zIndex: 1000,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6">Rendering points...</Typography>
        </Box>
      )}
      {hoveredNode && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            p: 2,
            borderRadius: 1,
            boxShadow: 3,
            maxWidth: 300,
            zIndex: 1000,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {hoveredNode.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hoveredNode.author}
          </Typography>
          {hoveredNode.publication_date && (
            <Typography variant="caption" color="text.secondary">
              {hoveredNode.publication_date}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
