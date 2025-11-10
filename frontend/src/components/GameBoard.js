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
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { blue, red } from '@mui/material/colors';
import { Phase, isGameOver, getFascistPlayers } from '../utils/gameState';
import Chat from './Chat';
import wsService from '../services/websocket';

const GameBoard = ({ gameState, playerName }) => {
  const currentPlayer = gameState.players.find(p => p.name === playerName);
  const fascistAllies = getFascistPlayers(gameState, playerName);
  const gameEnded = isGameOver(gameState);

  const handleReady = () => {
    wsService.send('ready', {});
  };

  const isReady = gameState.ready_status && gameState.ready_status[playerName];
  const allReady = gameState.ready_status && 
    Object.values(gameState.ready_status).length === gameState.players.filter(p => p.is_alive).length &&
    Object.values(gameState.ready_status).every(v => v === true);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
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

      {/* Circular Player Layout */}
      <Card sx={{ mb: 3, position: 'relative', minHeight: 400 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom align="center">
            Players
          </Typography>
          <Box sx={{ position: 'relative', width: '100%', height: 400, mt: 2 }}>
            {/* Center Board Area */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 200,
              borderRadius: '50%',
              backgroundColor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              backgroundImage: gameState.custom_board_image_url 
                ? `url(${process.env.REACT_APP_API_HOST || 'http://localhost:8000'}${gameState.custom_board_image_url})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <Typography variant="h6" color="primary.contrastText">
                Board
              </Typography>
            </Box>

            {/* Players in Circle */}
            {gameState.players.map((player, index) => {
              const totalPlayers = gameState.players.length;
              const angle = (2 * Math.PI * index) / totalPlayers - Math.PI / 2; // Start from top
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    zIndex: 2
                  }}
                >
                  <Card sx={{
                    width: 120,
                    opacity: player.is_alive ? 1 : 0.5,
                    border: player.name === playerName ? 3 : 1,
                    borderColor: player.name === playerName ? 'primary.main' : 'divider'
                  }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      {player.profilePictureUrl ? (
                        <Box
                          component="img"
                          src={player.profilePictureUrl}
                          alt={player.username || player.name}
                          sx={{
                            width: '100%',
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 0.5
                          }}
                        />
                      ) : (
                        <Box sx={{
                          width: '100%',
                          height: 60,
                          backgroundColor: 'grey.300',
                          borderRadius: 1,
                          mb: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6">
                            {(player.username || player.name).substring(0, 2).toUpperCase()}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="caption" noWrap sx={{ display: 'block', textAlign: 'center' }}>
                        {player.username || player.name}
                        {player.name === playerName && ' (You)'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        {player.is_president && (
                          <Chip label="P" color="primary" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                        )}
                        {player.is_chancellor && (
                          <Chip label="C" color="secondary" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                        )}
                        {!player.is_alive && (
                          <Chip label="X" color="error" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                        )}
                        {player.vote !== null && gameState.current_phase === Phase.VOTING && (
                          <Chip 
                            label={player.vote ? '✓' : '✗'} 
                            color={player.vote ? 'success' : 'error'} 
                            size="small"
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
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

      {/* Ready Button */}
      {gameState.current_phase !== Phase.LOBBY && 
       gameState.current_phase !== Phase.GAME_OVER && 
       !allReady && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 20, zIndex: 1000 }}>
          <Button
            variant="contained"
            color={isReady ? 'success' : 'primary'}
            onClick={handleReady}
            disabled={isReady}
            size="large"
          >
            {isReady ? 'Ready!' : 'Mark Ready'}
          </Button>
        </Box>
      )}

      {/* System Messages in Chat */}
      {gameState.chat_history && gameState.chat_history.some(msg => msg.type === 'SYSTEM_MESSAGE') && (
        <Box sx={{ mt: 2 }}>
          {gameState.chat_history
            .filter(msg => msg.type === 'SYSTEM_MESSAGE')
            .slice(-5)
            .map((msg, idx) => (
              <Typography key={idx} variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {msg.message}
              </Typography>
            ))}
        </Box>
      )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Chat gameState={gameState} playerName={playerName} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default GameBoard;

