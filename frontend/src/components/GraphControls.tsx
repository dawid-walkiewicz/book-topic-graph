import { Box, Slider, Button, Typography, Paper } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";

interface GraphControlsProps {
  onRerender: () => void;
  nodeSize: number;
  onNodeSizeChange: (value: number) => void;
  onCenterView: () => void;
}

export const GraphControls = ({
  onRerender,
  nodeSize,
  onNodeSizeChange,
  onCenterView,
}: GraphControlsProps) => {
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
        Controls
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Point Size: {nodeSize}px
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

      <Button
        variant="outlined"
        fullWidth
        startIcon={<CenterFocusStrongIcon />}
        onClick={onCenterView}
        sx={{ mb: 2 }}
      >
        Center View
      </Button>

      <Button
        variant="contained"
        fullWidth
        startIcon={<RefreshIcon />}
        onClick={onRerender}
      >
        Refresh Data
      </Button>
    </Paper>
  );
};
