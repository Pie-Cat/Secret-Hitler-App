import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { blue, red } from '@mui/material/colors';
import { Phase, isGameOver, getFascistPlayers } from '../utils/gameState';

const GameBoard = ({ gameState, playerName }) => {
  const currentPlayer = gameState.players.find(p => p.name === playerName);
  const fascistAllies = getFascistPlayers(gameState, playerName);
  const gameEnded = isGameOver(gameState);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Winner Announcement */}
      {gameEnded && (
        <Card sx={{ mb: 2, backgroundColor: gameState.winner === 'Liberal' ? blue[100] : red[100] }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h3" gutterBottom>
              {gameState.winner === 'Liberal' ? '⚖️' : '☠️'}
            </Typography>
            <Typography variant="h4" gutterBottom>
              {gameState.winner} Win!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Game Over
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Policy Tracks */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color={blue[700]}>
                Liberal Policies
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(gameState.liberal_policies / 5) * 100} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 30, 
                    borderRadius: 1,
                    backgroundColor: blue[100],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: blue[500]
                    }
                  }} 
                />
                <Typography variant="h6" color={blue[700]}>
                  {gameState.liberal_policies} / 5
                </Typography>
              </Box>
              {gameState.liberal_policies >= 5 && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Liberals Win!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color={red[700]}>
                Fascist Policies
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(gameState.fascist_policies / 6) * 100} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 30, 
                    borderRadius: 1,
                    backgroundColor: red[100],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: red[600]
                    }
                  }} 
                />
                <Typography variant="h6" color={red[700]}>
                  {gameState.fascist_policies} / 6
                </Typography>
              </Box>
              {gameState.fascist_policies >= 6 && (
                <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                  Fascists Win!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Phase and Election Tracker */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Phase
              </Typography>
              <Chip 
                label={gameState.current_phase} 
                color="primary" 
                size="large"
                sx={{ fontSize: '1rem', py: 2.5 }}
              />
              {gameState.current_president && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  President: <strong>{gameState.current_president}</strong>
                </Typography>
              )}
              {gameState.nominated_chancellor && (
                <Typography variant="body2" color="text.secondary">
                  Nominated Chancellor: <strong>{gameState.nominated_chancellor}</strong>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Election Tracker
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(gameState.election_tracker / 3) * 100} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 20, 
                    borderRadius: 1 
                  }} 
                />
                <Typography variant="h6">
                  {gameState.election_tracker} / 3
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {gameState.election_tracker >= 3 && 'Top policy will be enacted!'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Players List */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Players
          </Typography>
          <List>
            {gameState.players.map((player, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {player.name}
                          {player.name === playerName && ' (You)'}
                        </Typography>
                        {player.is_president && (
                          <Chip label="President" color="primary" size="small" />
                        )}
                        {player.is_chancellor && (
                          <Chip label="Chancellor" color="secondary" size="small" />
                        )}
                        {!player.is_alive && (
                          <Chip label="Executed" color="error" size="small" />
                        )}
                        {player.vote !== null && gameState.current_phase === Phase.VOTING && (
                          <Chip 
                            label={player.vote ? 'Ja' : 'Nein'} 
                            color={player.vote ? 'success' : 'error'} 
                            size="small" 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      player.role && currentPlayer && currentPlayer.name === player.name
                        ? `Role: ${player.role}`
                        : player.role && currentPlayer && 
                          (currentPlayer.role === 'Fascist' || currentPlayer.role === 'Hitler') &&
                          (player.role === 'Fascist' || player.role === 'Hitler')
                        ? `Role: ${player.role}`
                        : null
                    }
                  />
                </ListItem>
                {index < gameState.players.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Fascist Allies (only visible to Fascists) */}
      {currentPlayer && currentPlayer.role === 'Fascist' && fascistAllies.length > 0 && (
        <Card sx={{ backgroundColor: red[50] }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Fascist Allies
            </Typography>
            <List>
              {fascistAllies.map((ally, index) => (
                <ListItem key={index}>
                  <ListItemText primary={ally.name} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default GameBoard;

