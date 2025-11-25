import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Layout } from './components/Layout';
import { GraphVisualization } from './components/GraphVisualization';
import { AddBookForm } from './components/AddBookForm';
import { BookDetailsPanel } from './components/BookDetailsPanel';
import type { GraphData, GraphNode } from './types/graph';
import { api } from './services/api';

const darkTheme = createTheme({
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
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = unlimited

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getGraph(5, 0.5);
      setGraphData(data);
    } catch (error) {
      console.error('Error loading graph:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedBook(node);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const handleBookAdded = () => {
    // Reload the graph when a new book is added
    loadGraph();
  };

  return (
    <ThemeProvider theme={darkTheme}>
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
          maxDistance={maxDistance}
          onMaxDistanceChange={setMaxDistance}
          onRerender={loadGraph}
        />
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
