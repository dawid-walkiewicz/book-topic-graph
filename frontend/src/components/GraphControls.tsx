import { Box, Slider, Button, Typography, Paper } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";

interface GraphControlsProps {
  maxDistance: number;
  onMaxDistanceChange: (value: number) => void;
  onRerender: () => void;
  nodeSize: number;
  onNodeSizeChange: (value: number) => void;
  onCenterView: () => void;
}

export const GraphControls = ({
  maxDistance,
  onMaxDistanceChange,
  onRerender,
  nodeSize,
  onNodeSizeChange,
  onCenterView,
}: GraphControlsProps) => {
  const handleSliderChange = (_event: Event, value: number | number[]) => {
    onMaxDistanceChange(value as number);
  };

  const handleNodeSizeChange = (_event: Event, value: number | number[]) => {
    onNodeSizeChange(value as number);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 1000,
        padding: 2,
        minWidth: 280,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Kontrolki Grafu
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Rozmiar węzłów: {nodeSize}px
        </Typography>
        <Slider
          value={nodeSize}
          onChange={handleNodeSizeChange}
          min={2}
          max={50}
          step={1}
          valueLabelDisplay="auto"
          marks={[
            { value: 2, label: "2" },
            { value: 8, label: "8" },
            { value: 15, label: "15" },
            { value: 30, label: "30" },
            { value: 40, label: "40" },
            { value: 50, label: "50" },
          ]}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Maksymalna odległość:{" "}
          {maxDistance === 0 ? "Nieograniczona" : maxDistance}
        </Typography>
        <Slider
          value={maxDistance}
          onChange={handleSliderChange}
          min={0}
          max={3000}
          step={50}
          valueLabelDisplay="auto"
          marks={[
            { value: 0, label: "0 (wszystkie)" },
            { value: 1500, label: "1500" },
            { value: 3000, label: "3000" },
          ]}
        />
        <Typography variant="caption" color="text.secondary">
          0 = pokaż wszystkie połączenia (obecnie wyłączone)
        </Typography>
      </Box>

      <Button
        variant="outlined"
        fullWidth
        startIcon={<CenterFocusStrongIcon />}
        onClick={onCenterView}
        sx={{ mb: 2 }}
      >
        Wyśrodkuj Widok
      </Button>

      <Button
        variant="contained"
        fullWidth
        startIcon={<RefreshIcon />}
        onClick={onRerender}
      >
        Odśwież Graf
      </Button>
    </Paper>
  );
};
