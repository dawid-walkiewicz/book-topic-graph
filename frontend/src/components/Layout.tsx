import { ReactNode, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
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
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sieć Powiązań Między Książkami
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
