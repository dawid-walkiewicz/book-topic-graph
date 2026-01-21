import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { OrthographicView } from '@deck.gl/core';
import type { GraphData, GraphNode, EndpointType, BookSourceFilter } from '../types/graph';
import { Box, CircularProgress, Typography } from '@mui/material';
import { GraphControls } from './GraphControls';
import { getTopicColor, NEW_BOOK_HIGHLIGHT_COLOR } from '../constants/topicColors';

const FILTERED_COLOR: [number, number, number, number] = [180, 180, 180, 100];
const SEARCH_HIGHLIGHT_COLOR: [number, number, number, number] = [0, 150, 255, 255]; // Bright blue ring
const PAN_THRESHOLD = 0.5; // Distance threshold to clear search highlight

interface GraphVisualizationProps {
  graphData: GraphData | null;
  loading: boolean;
  onNodeClick: (node: GraphNode) => void;
  onRerender: () => void;
  nodeSize: number;
  onNodeSizeChange: (value: number) => void;
  endpoint: EndpointType;
  onEndpointChange: (endpoint: EndpointType) => void;
  searchedBook?: GraphNode | null;
  onSearchedBookClear?: () => void;
  selectedTopic: number | null;
  sourceFilter: BookSourceFilter;
  onSourceFilterChange: (value: BookSourceFilter) => void;
}

export const GraphVisualization = ({
  graphData,
  loading,
  onNodeClick,
  onRerender,
  nodeSize,
  onNodeSizeChange,
  endpoint,
  onEndpointChange,
  searchedBook,
  onSearchedBookClear,
  selectedTopic,
  sourceFilter,
  onSourceFilterChange
}: GraphVisualizationProps) => {
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [webglReady, setWebglReady] = useState(false);
  const [highlightedBook, setHighlightedBook] = useState<GraphNode | null>(null);
  const highlightTargetRef = useRef<[number, number] | null>(null);

  const [viewState, setViewState] = useState({
    target: [0, 0] as [number, number],
    zoom: 8,
    minZoom: -2,
    maxZoom: 14,
  });

  // Filter nodes based on source filter
  const filteredNodes = useMemo(() => {
    if (!graphData?.nodes?.length) return [];

    switch (sourceFilter) {
      case 'user-added':
        return graphData.nodes.filter(n => n.wiki_id === -1);
      case 'original':
        return graphData.nodes.filter(n => n.wiki_id !== -1);
      default:
        return graphData.nodes;
    }
  }, [graphData, sourceFilter]);

  // Calculate data bounds
  const dataBounds = useMemo(() => {
    if (!filteredNodes.length) return null;

    const xs = filteredNodes.map(n => n.x || 0);
    const ys = filteredNodes.map(n => n.y || 0);

    return {
      centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
      centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }, [filteredNodes]);

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

  // Center on searched book and highlight it
  useEffect(() => {
    if (searchedBook?.x !== undefined && searchedBook?.y !== undefined) {
      const target: [number, number] = [searchedBook.x, searchedBook.y];
      setViewState(prev => ({
        ...prev,
        target,
      }));
      setHighlightedBook(searchedBook);
      highlightTargetRef.current = target;
      onSearchedBookClear?.();
    }
  }, [searchedBook, onSearchedBookClear]);

  // Handle view state changes to detect panning away from highlighted book
  const handleViewStateChange = useCallback(({ viewState: vs }: { viewState: Record<string, unknown> }) => {
    const newViewState = vs as typeof viewState;
    setViewState(newViewState);

    // Check if user has panned away from the highlighted book
    if (highlightedBook && highlightTargetRef.current) {
      const [origX, origY] = highlightTargetRef.current;
      const target = newViewState.target as [number, number];
      const [currX, currY] = target;
      const distance = Math.sqrt((currX - origX) ** 2 + (currY - origY) ** 2);

      if (distance > PAN_THRESHOLD) {
        setHighlightedBook(null);
        highlightTargetRef.current = null;
      }
    }
  }, [highlightedBook]);

  const scatterLayer = useMemo(() => {
    if (!filteredNodes.length) return null;

    return new ScatterplotLayer<GraphNode>({
      id: 'books-scatter',
      data: filteredNodes,
      pickable: true,
      getPosition: (d: GraphNode) => [d.x || 0, d.y || 0],
      getRadius: nodeSize,
      radiusUnits: 'pixels',
      radiusMinPixels: 1,
      radiusMaxPixels: 50,
      getFillColor: (d: GraphNode) => {
        if (selectedTopic === null) return getTopicColor(d.topic);
        return d.topic === selectedTopic ? getTopicColor(d.topic) : FILTERED_COLOR;
      },
      onHover: (info) => setHoveredNode(info.object || null),
      onClick: (info) => {
        if (info.object) {
          onNodeClick(info.object);
        }
      },
      updateTriggers: {
        getRadius: nodeSize,
        getFillColor: [filteredNodes, selectedTopic],
      },
    });
  }, [filteredNodes, nodeSize, onNodeClick, selectedTopic]);

  // Highlight layer for new books (wiki_id === -1)
  const newBooksHighlightLayer = useMemo(() => {
    if (!filteredNodes.length) return null;

    const newBooks = filteredNodes.filter(d => d.wiki_id === -1);
    if (newBooks.length === 0) return null;

    return new ScatterplotLayer<GraphNode>({
      id: 'new-books-highlight',
      data: newBooks,
      pickable: false,
      getPosition: (d: GraphNode) => [d.x || 0, d.y || 0],
      getRadius: nodeSize + 4,
      radiusUnits: 'pixels',
      radiusMinPixels: 5,
      radiusMaxPixels: 54,
      filled: false,
      stroked: true,
      getLineColor: NEW_BOOK_HIGHLIGHT_COLOR,
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      updateTriggers: {
        getRadius: nodeSize,
      },
    });
  }, [filteredNodes, nodeSize]);

  // Highlight layer for searched book
  const searchHighlightLayer = useMemo(() => {
    if (!highlightedBook) return null;

    return new ScatterplotLayer<GraphNode>({
      id: 'search-highlight',
      data: [highlightedBook],
      pickable: false,
      getPosition: (d: GraphNode) => [d.x || 0, d.y || 0],
      getRadius: nodeSize + 6,
      radiusUnits: 'pixels',
      radiusMinPixels: 8,
      radiusMaxPixels: 56,
      filled: false,
      stroked: true,
      getLineColor: SEARCH_HIGHLIGHT_COLOR,
      getLineWidth: 3,
      lineWidthUnits: 'pixels',
      updateTriggers: {
        getRadius: nodeSize,
      },
    });
  }, [highlightedBook, nodeSize]);

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
        endpoint={endpoint}
        onEndpointChange={onEndpointChange}
        sourceFilter={sourceFilter}
        onSourceFilterChange={onSourceFilterChange}
      />
      <DeckGL
        views={new OrthographicView({ id: 'ortho', flipY: false })}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={[newBooksHighlightLayer, searchHighlightLayer, scatterLayer].filter(Boolean)}
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
          {hoveredNode.topic_label && (
            <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
              {hoveredNode.topic_label}
            </Typography>
          )}
          {hoveredNode.publication_date && (
            <Typography variant="caption" color="text.secondary" display="block">
              {hoveredNode.publication_date}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
