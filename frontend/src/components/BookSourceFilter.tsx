import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { BookSourceFilter as BookSourceFilterType } from '../types/graph';

interface BookSourceFilterProps {
  value: BookSourceFilterType;
  onChange: (value: BookSourceFilterType) => void;
}

const OPTIONS: { value: BookSourceFilterType; label: string }[] = [
  { value: 'all', label: 'All Books' },
  { value: 'user-added', label: 'My Books Only' },
  { value: 'original', label: 'Dataset Only' },
];

export const BookSourceFilter = ({ value, onChange }: BookSourceFilterProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as BookSourceFilterType);
  };

  return (
    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
      <InputLabel id="book-source-filter-label">Show</InputLabel>
      <Select
        labelId="book-source-filter-label"
        value={value}
        label="Show"
        onChange={handleChange}
      >
        {OPTIONS.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
