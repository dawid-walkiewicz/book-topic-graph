import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { TOPIC_COLORS, TOPIC_LABELS } from '../constants/topicColors';
import type { GraphNode } from '../types/graph';

interface TopicLegendProps {
  nodes: GraphNode[];
  selectedTopic: number | null;
  onTopicClick: (topicId: number) => void;
}

export const TopicLegend = ({ nodes, selectedTopic, onTopicClick }: TopicLegendProps) => {
  const [expanded, setExpanded] = useState(true);

  // Calculate topic counts
  const topicCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    nodes.forEach(node => {
      if (node.topic !== undefined && node.topic !== null) {
        counts[node.topic] = (counts[node.topic] || 0) + 1;
      }
    });
    return counts;
  }, [nodes]);

  const topics = useMemo(() => {
    return Object.entries(TOPIC_LABELS)
      .map(([id, label]) => ({
        id: Number(id),
        label,
        color: TOPIC_COLORS[Number(id)],
        count: topicCounts[Number(id)] || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [topicCounts]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        right: 340,
        zIndex: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        width: expanded ? 280 : 48,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: expanded ? '1px solid #eee' : 'none',
        }}
      >
        {expanded && (
          <Typography variant="subtitle1" fontWeight="bold">
            Topics ({nodes.length.toLocaleString()} books)
          </Typography>
        )}
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <List dense sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)', py: 0 }}>
          {topics.map(topic => {
            const isSelected = selectedTopic === topic.id;
            const isFiltered = selectedTopic !== null && !isSelected;
            return (
              <ListItemButton
                key={topic.id}
                onClick={() => onTopicClick(topic.id)}
                selected={isSelected}
                sx={{
                  opacity: topic.count === 0 ? 0.5 : (isFiltered ? 0.5 : 1),
                  py: 0.5,
                  backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      backgroundColor: isFiltered
                        ? 'rgba(128, 128, 128, 0.5)'
                        : `rgba(${topic.color.join(',')})`,
                      border: isSelected ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.2)',
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={topic.label}
                  secondary={`${topic.count.toLocaleString()} books`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                  secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
    </Paper>
  );
};
