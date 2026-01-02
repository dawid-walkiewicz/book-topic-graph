import { useState, type ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface LayoutProps {
  children: ReactNode;
  drawerContent: ReactNode;
}

export const Layout = ({ children, drawerContent }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Book Topic Graph
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="add book"
            onClick={toggleDrawer}
          >
            <AddIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 400, p: 3 }}
          role="presentation"
        >
          {drawerContent}
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
};
