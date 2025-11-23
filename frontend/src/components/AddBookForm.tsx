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
import { NewBookRequest } from '../types/graph';

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
      setError(err.response?.data?.error || 'Wystąpił błąd podczas dodawania książki');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.author && formData.plot_summary;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        Dodaj Nową Książkę
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Wprowadź dane książki, aby dodać ją do grafu powiązań.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Książka została pomyślnie dodana!
        </Alert>
      )}

      <TextField
        fullWidth
        label="Tytuł"
        value={formData.title}
        onChange={handleChange('title')}
        margin="normal"
        required
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Autor"
        value={formData.author}
        onChange={handleChange('author')}
        margin="normal"
        required
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Streszczenie fabularne"
        value={formData.plot_summary}
        onChange={handleChange('plot_summary')}
        margin="normal"
        required
        multiline
        rows={8}
        disabled={loading}
        helperText="Wprowadź pełne streszczenie książki - im bardziej szczegółowe, tym lepiej."
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        disabled={!isFormValid || loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Dodaj Książkę'}
      </Button>
    </Box>
  );
};
