import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Layout } from './components/Layout';
import { GraphVisualization } from './components/GraphVisualization';
import { AddBookForm } from './components/AddBookForm';
import { BookDetailsPanel } from './components/BookDetailsPanel';
import type { GraphData, GraphNode } from './types/graph';
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

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getNodes();
      setGraphData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
