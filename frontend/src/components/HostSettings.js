import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ImageIcon from '@mui/icons-material/Image';

const HostSettings = ({ gameId, isHost, gameState, onRulesUpdate, onTestGame }) => {
  const [open, setOpen] = useState(false);
  const [showRoleOnDeath, setShowRoleOnDeath] = useState(
    gameState?.rules?.showRoleOnDeath || false
  );
  const [numBots, setNumBots] = useState(5);

  const handleRulesChange = (rule, value) => {
    if (rule === 'showRoleOnDeath') {
      setShowRoleOnDeath(value);
      if (onRulesUpdate) {
        onRulesUpdate({ showRoleOnDeath: value });
      }
    }
  };

  const handleTestGame = () => {
    if (onTestGame) {
      onTestGame(numBots);
    }
    setOpen(false);
  };

  if (!isHost) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SettingsIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        Host Settings
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Host Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Optional Rules
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showRoleOnDeath}
                  onChange={(e) => handleRulesChange('showRoleOnDeath', e.target.checked)}
                />
              }
              label="Show role card when player is killed"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Game
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a test game with bots to practice or test the game mechanics.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Number of Bots"
              value={numBots}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 5 && val <= 10) {
                  setNumBots(val);
                }
              }}
              inputProps={{ min: 5, max: 10 }}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleTestGame}
              fullWidth
            >
              Create Test Game
            </Button>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Custom Images
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload custom images for cards and board (coming soon)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              disabled
              fullWidth
            >
              Upload Card Image
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              disabled
              fullWidth
              sx={{ mt: 1 }}
            >
              Upload Board Image
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HostSettings;


