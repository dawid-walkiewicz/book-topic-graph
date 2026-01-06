import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import type { GraphNode } from '../types/graph';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface BookDetailsPanelProps {
  book: GraphNode | null;
  open: boolean;
  onClose: () => void;
}

export const BookDetailsPanel = ({ book, open, onClose }: BookDetailsPanelProps) => {
  if (!book) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          {book.title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="action" />
            <Typography variant="body1">
              <strong>Author:</strong> {book.author}
            </Typography>
          </Box>

          {book.publication_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon color="action" />
              <Typography variant="body1">
                <strong>Publication Date:</strong> {book.publication_date}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
