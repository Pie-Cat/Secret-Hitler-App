import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert
} from '@mui/material';
import PolicyCard from './PolicyCard';
import { canPlayerPerformAction } from '../utils/gameState';

const PlayerMenu = ({ gameState, playerName, wsService }) => {
  const [investigationResult, setInvestigationResult] = useState(null);
  const [policyPeek, setPolicyPeek] = useState(null);
  const [executiveActionDialog, setExecutiveActionDialog] = useState(false);
  const [executiveActionType, setExecutiveActionType] = useState(null);

  // Set up message handlers
  React.useEffect(() => {
    const handleInvestigationResult = (payload) => {
      setInvestigationResult(payload);
    };

    const handlePolicyPeek = (payload) => {
      setPolicyPeek(payload.policies);
    };

    const handleExecutiveActionAvailable = (payload) => {
      setExecutiveActionType(payload.action_type);
      setExecutiveActionDialog(true);
    };

    wsService.on('investigation_result', handleInvestigationResult);
    wsService.on('policy_peek', handlePolicyPeek);
    wsService.on('executive_action_available', handleExecutiveActionAvailable);

    return () => {
      wsService.off('investigation_result', handleInvestigationResult);
      wsService.off('policy_peek', handlePolicyPeek);
      wsService.off('executive_action_available', handleExecutiveActionAvailable);
    };
  }, [wsService]);

  const handleNominateChancellor = (chancellorName) => {
    if (canPlayerPerformAction(gameState, playerName, 'nominate_chancellor')) {
      wsService.send('nominate_chancellor', { chancellor_name: chancellorName });
    }
  };

  const handlePresidentDiscard = (index) => {
    if (canPlayerPerformAction(gameState, playerName, 'president_discard')) {
      wsService.send('president_discard', { policy_index: index });
    }
  };

  const handleChancellorEnact = (index) => {
    if (canPlayerPerformAction(gameState, playerName, 'chancellor_enact')) {
      wsService.send('chancellor_enact', { policy_index: index });
    }
  };

  const handleExecutiveAction = (actionType, target = null) => {
    if (canPlayerPerformAction(gameState, playerName, 'executive_action')) {
      wsService.send('executive_action', { 
        action_type: actionType,
        target: target
      });
      setExecutiveActionDialog(false);
      setExecutiveActionType(null);
    }
  };

  const alivePlayers = gameState.players.filter(p => p.is_alive && p.name !== playerName);
  const canNominate = canPlayerPerformAction(gameState, playerName, 'nominate_chancellor');
  const canDiscard = canPlayerPerformAction(gameState, playerName, 'president_discard');
  const canEnact = canPlayerPerformAction(gameState, playerName, 'chancellor_enact');
  const canExecutiveAction = canPlayerPerformAction(gameState, playerName, 'executive_action');

  return (
    <Box sx={{ p: 2 }}>
      {/* Investigation Result */}
      {investigationResult && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Investigation Result: <strong>{investigationResult.target}</strong> is {investigationResult.result}
        </Alert>
      )}

      {/* Policy Peek */}
      {policyPeek && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Top 3 Policies:</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {policyPeek.map((policy, index) => (
              <PolicyCard key={index} policyType={policy} size="small" />
            ))}
          </Box>
        </Alert>
      )}

      {/* Nominate Chancellor */}
      {canNominate && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Nominate Chancellor
            </Typography>
            <List>
              {alivePlayers.map((player) => (
                <ListItem key={player.name} disablePadding>
                  <ListItemButton
                    onClick={() => handleNominateChancellor(player.name)}
                    disabled={gameState.last_chancellor_name === player.name && alivePlayers.length > 5}
                  >
                    <ListItemText 
                      primary={player.name}
                      secondary={gameState.last_chancellor_name === player.name && alivePlayers.length > 5 ? 'Cannot nominate previous chancellor' : ''}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* President Discard */}
      {canDiscard && gameState.president_hand && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Discard 1 Policy (President)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a policy to discard. The remaining 2 will be passed to the Chancellor.
            </Typography>
            <Grid container spacing={2}>
              {gameState.president_hand.map((policy, index) => (
                <Grid item xs={4} key={index}>
                  <PolicyCard
                    policyType={policy}
                    onClick={() => handlePresidentDiscard(index)}
                    size="medium"
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Chancellor Enact */}
      {canEnact && gameState.chancellor_hand && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Enact 1 Policy (Chancellor)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a policy to enact. The other will be discarded.
            </Typography>
            <Grid container spacing={2}>
              {gameState.chancellor_hand.map((policy, index) => (
                <Grid item xs={6} key={index}>
                  <PolicyCard
                    policyType={policy}
                    onClick={() => handleChancellorEnact(index)}
                    size="large"
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Executive Action */}
      {canExecutiveAction && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Executive Action Available
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setExecutiveActionDialog(true)}
            >
              Choose Action
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Executive Action Dialog */}
      <Dialog 
        open={executiveActionDialog} 
        onClose={() => setExecutiveActionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Choose Executive Action</DialogTitle>
        <DialogContent>
          {executiveActionType && (
            <List>
              {executiveActionType.includes('investigate') && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => {
                    // Show player selection for investigation
                    const target = prompt('Enter player name to investigate:');
                    if (target) {
                      handleExecutiveAction('investigate', target);
                    }
                  }}>
                    <ListItemText primary="Investigate" secondary="Learn a player's party membership" />
                  </ListItemButton>
                </ListItem>
              )}
              {executiveActionType.includes('special_election') && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => {
                    const target = prompt('Enter player name to be next President:');
                    if (target) {
                      handleExecutiveAction('special_election', target);
                    }
                  }}>
                    <ListItemText primary="Special Election" secondary="Choose the next President" />
                  </ListItemButton>
                </ListItem>
              )}
              {executiveActionType.includes('policy_peek') && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleExecutiveAction('policy_peek')}>
                    <ListItemText primary="Policy Peek" secondary="Look at the top 3 policies" />
                  </ListItemButton>
                </ListItem>
              )}
              {executiveActionType.includes('execution') && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => {
                    const target = prompt('Enter player name to execute:');
                    if (target) {
                      if (window.confirm(`Are you sure you want to execute ${target}?`)) {
                        handleExecutiveAction('execution', target);
                      }
                    }
                  }}>
                    <ListItemText primary="Execution" secondary="Execute a player" />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecutiveActionDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerMenu;

