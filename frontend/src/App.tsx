import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Layout } from './components/Layout';
import { GraphVisualization } from './components/GraphVisualization';
import { AddBookForm } from './components/AddBookForm';
import { BookDetailsPanel } from './components/BookDetailsPanel';
import { TopicLegend } from './components/TopicLegend';
import { BookSearch } from './components/BookSearch';
import type { GraphData, GraphNode, EndpointType, BookSourceFilter } from './types/graph';
import { api } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<GraphNode | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [nodeSize, setNodeSize] = useState<number>(6);
  const [endpoint, setEndpoint] = useState<EndpointType>('umap');
  const [searchedBook, setSearchedBook] = useState<GraphNode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [sourceFilter, setSourceFilter] = useState<BookSourceFilter>('all');

  const handleTopicClick = (topicId: number) => {
    setSelectedTopic(prev => prev === topicId ? null : topicId);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNodesByEndpoint(endpoint);
      setGraphData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedBook(node);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const handleBookAdded = () => {
    loadData();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout
        drawerContent={
          <AddBookForm onBookAdded={handleBookAdded} />
        }
      >
        <GraphVisualization
          graphData={graphData}
          loading={loading}
          onNodeClick={handleNodeClick}
          onRerender={loadData}
          nodeSize={nodeSize}
          onNodeSizeChange={setNodeSize}
          endpoint={endpoint}
          onEndpointChange={setEndpoint}
          searchedBook={searchedBook}
          onSearchedBookClear={() => setSearchedBook(null)}
          selectedTopic={selectedTopic}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
        />
        {graphData?.nodes && (
          <>
            <TopicLegend
              nodes={graphData.nodes}
              selectedTopic={selectedTopic}
              onTopicClick={handleTopicClick}
            />
            <BookSearch nodes={graphData.nodes} onBookSelect={setSearchedBook} />
          </>
        )}
        <BookDetailsPanel
          book={selectedBook}
          open={detailsOpen}
          onClose={handleCloseDetails}
        />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
