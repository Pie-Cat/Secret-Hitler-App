import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import wsService from '../services/websocket';

const Lobby = ({ gameId, playerName, onGameStart }) => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate join URL
  const joinUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${gameId}`;
  }, [gameId]);

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    // Set up message handlers
    const handlePlayerJoined = (payload) => {
      setPlayers(prev => {
        const updated = [...prev];
        if (!updated.find(p => p.name === payload.player_name)) {
          updated.push({ name: payload.player_name });
        }
        return updated;
      });
    };

    const handlePlayerDisconnected = (payload) => {
      setPlayers(prev => prev.filter(p => p.name !== payload.player_name));
    };

    const handleGameStarted = (payload) => {
      onGameStart(payload);
    };

    const handleGameState = (payload) => {
      if (payload.players) {
        setPlayers(payload.players.map(p => ({ name: p.name })));
      }
    };

    const handleError = (payload) => {
      setError(payload.message || 'An error occurred');
      setLoading(false);
    };

    wsService.on('player_joined', handlePlayerJoined);
    wsService.on('player_disconnected', handlePlayerDisconnected);
    wsService.on('game_started', handleGameStarted);
    wsService.on('game_state', handleGameState);
    wsService.on('error', handleError);

    // Handle connection
    const handleConnected = () => {
      setLoading(false);
      // Send join message after connection is established
      wsService.send('join_game', {});
    };

    wsService.addEventListener('connected', handleConnected);

    // Join the game
    if (gameId && playerName) {
      setLoading(true);
      if (!wsService.isConnected()) {
        wsService.connect(gameId, playerName);
      } else {
        // Already connected, send join immediately
        wsService.send('join_game', {});
        setLoading(false);
      }
    }

    return () => {
      wsService.off('player_joined', handlePlayerJoined);
      wsService.off('player_disconnected', handlePlayerDisconnected);
      wsService.off('game_started', handleGameStarted);
      wsService.off('game_state', handleGameState);
      wsService.off('error', handleError);
      wsService.removeEventListener('connected', handleConnected);
    };
  }, [gameId, playerName, onGameStart]);

  const handleStartGame = () => {
    if (players.length < 5) {
      setError('Need at least 5 players to start');
      return;
    }
    if (players.length > 10) {
      setError('Maximum 10 players allowed');
      return;
    }
    setLoading(true);
    wsService.send('start_game', {});
  };

  // Calculate if game can start - only recalculates when players change
  const canStart = useMemo(() => {
    return players.length >= 5 && players.length <= 10;
  }, [players.length]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Secret Hitler
          </Typography>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Game Code: <strong>{gameId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share this code or scan the QR code to join
            </Typography>
          </Box>

          {/* QR Code and Join URL */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>
              Scan to Join
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'white', 
                borderRadius: 2,
                display: 'inline-block'
              }}>
                <QRCodeSVG 
                  value={joinUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Join URL:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundColor: 'white',
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      flexGrow: 1, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-all',
                      fontSize: '0.75rem'
                    }}
                  >
                    {joinUrl}
                  </Typography>
                  <Tooltip title={copied ? "Copied!" : "Copy URL"}>
                    <IconButton 
                      size="small" 
                      onClick={handleCopyUrl}
                      color={copied ? "success" : "default"}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Players ({players.length}/10)
            </Typography>
            <List>
              {players.map((player, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={player.name}
                    secondary={player.name === playerName ? 'You' : ''}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartGame}
              disabled={!canStart || loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Start Game'
              )}
            </Button>
          </Box>

          {!canStart && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              {players.length < 5 
                ? `Need ${5 - players.length} more player${5 - players.length > 1 ? 's' : ''} to start`
                : 'Too many players (max 10)'
              }
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Lobby;
