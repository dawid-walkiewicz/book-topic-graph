import { ToggleButton, ToggleButtonGroup, Typography, Box } from '@mui/material';
import type { EndpointType } from '../types/graph';

interface EndpointSelectorProps {
  value: EndpointType;
  onChange: (endpoint: EndpointType) => void;
  disabled?: boolean;
}

export const EndpointSelector = ({ value, onChange, disabled }: EndpointSelectorProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: EndpointType | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" gutterBottom fontWeight="medium">
        Projection
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="projection method"
        size="small"
        fullWidth
        disabled={disabled}
      >
        <ToggleButton value="pca">PCA</ToggleButton>
        <ToggleButton value="umap">UMAP</ToggleButton>
        <ToggleButton value="hybrid">Hybrid</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
