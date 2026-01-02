import { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../services/api';
import type { NewBookRequest } from '../types/graph';

interface AddBookFormProps {
  onBookAdded: () => void;
}

export const AddBookForm = ({ onBookAdded }: AddBookFormProps) => {
  const [formData, setFormData] = useState<NewBookRequest>({
    title: '',
    author: '',
    plot_summary: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof NewBookRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.addBook(formData);
      setSuccess(true);
      setFormData({ title: '', author: '', plot_summary: '' });

      // Notify parent to refresh the graph
      setTimeout(() => {
        onBookAdded();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while adding the book');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.author && formData.plot_summary;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        Add New Book
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter book details to add it to the visualization.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Book has been added successfully!
        </Alert>
      )}

      <TextField
        fullWidth
        label="Title"
        value={formData.title}
        onChange={handleChange('title')}
        margin="normal"
        required
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Author"
        value={formData.author}
        onChange={handleChange('author')}
        margin="normal"
        required
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Plot Summary"
        value={formData.plot_summary}
        onChange={handleChange('plot_summary')}
        margin="normal"
        required
        multiline
        rows={8}
        disabled={loading}
        helperText="Enter a detailed plot summary - the more detailed, the better."
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        disabled={!isFormValid || loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Add Book'}
      </Button>
    </Box>
  );
};
