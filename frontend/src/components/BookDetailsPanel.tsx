import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
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
              <strong>Autor:</strong> {book.author}
            </Typography>
          </Box>

          {book.publication_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon color="action" />
              <Typography variant="body1">
                <strong>Data publikacji:</strong> {book.publication_date}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary">
              <strong>ID węzła:</strong> {book.id}
            </Typography>
          </Box>

          {(book.x !== undefined && book.y !== undefined) && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Współrzędne w grafie:</strong> ({book.x.toFixed(2)}, {book.y.toFixed(2)})
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Chip
              label="Kliknij na inne książki, aby zobaczyć ich szczegóły"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
};
