import { useState, useMemo, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  Paper,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { GraphNode } from '../types/graph';

interface BookSearchProps {
  nodes: GraphNode[];
  onBookSelect: (book: GraphNode) => void;
}

export const BookSearch = ({ nodes, onBookSelect }: BookSearchProps) => {
  const [inputValue, setInputValue] = useState('');

  // Filter options based on input - limit to 50 for performance
  const filteredOptions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];

    const searchLower = inputValue.toLowerCase();
    return nodes
      .filter(node =>
        node.title.toLowerCase().includes(searchLower) ||
        node.author.toLowerCase().includes(searchLower)
      )
      .slice(0, 50);
  }, [nodes, inputValue]);

  const handleSelect = useCallback((_event: unknown, value: GraphNode | string | null) => {
    if (value && typeof value !== 'string') {
      onBookSelect(value);
      setInputValue('');
    }
  }, [onBookSelect]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        width: 400,
        maxWidth: 'calc(100vw - 700px)',
      }}
    >
      <Autocomplete
        freeSolo
        options={filteredOptions}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : `${option.title} - ${option.author}`
        }
        inputValue={inputValue}
        onInputChange={(_event, value) => setInputValue(value)}
        onChange={handleSelect}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search books by title or author..."
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {option.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.author}
                  {option.topic_label && ` · ${option.topic_label}`}
                </Typography>
              </Box>
            </Box>
          );
        }}
        noOptionsText={
          inputValue.length < 2
            ? "Type at least 2 characters"
            : "No books found"
        }
      />
    </Paper>
  );
};
