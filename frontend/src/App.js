import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import PlayerMenu from './components/PlayerMenu';
import Voting from './components/Voting';
import RoleCard from './components/RoleCard';
import wsService from './services/websocket';
import { Phase, isGameOver, getFascistPlayers } from './utils/gameState';

const HomePage = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setError(null);
      const apiHost = process.env.REACT_APP_API_HOST || 'http://localhost:8000';
      const response = await fetch(`${apiHost}/api/create-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.game_id) {
        navigate(`/game/${data.game_id}/${encodeURIComponent(playerName)}`);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error creating game:', err);
      setError(`Failed to create game: ${err.message}. Make sure the backend server is running on port 8000.`);
    }
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    navigate(`/game/${gameCode.toUpperCase()}/${encodeURIComponent(playerName)}`);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom align="center">
            Secret Hitler
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            A social deduction game for 5-10 players
          </Typography>

          <TextField
            fullWidth
            label="Your Name"
            variant="outlined"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCreateGame}
              sx={{ mb: 2 }}
            >
              Create Game
            </Button>

            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
              OR
            </Typography>

            <TextField
              fullWidth
              label="Game Code"
              variant="outlined"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              sx={{ mb: 2 }}
              placeholder="Enter game code"
            />

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleJoinGame}
            >
              Join Game
            </Button>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

const GamePage = () => {
  const { gameId, playerName } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId || !playerName) {
      navigate('/');
      return;
    }

    // Set up WebSocket handlers
    const handleGameState = (payload) => {
      setGameState(payload);
    };

    const handleGameStarted = (payload) => {
      setGameState(payload);
      setRoleRevealed(true);
    };

    const handleError = (payload) => {
      setError(payload.message || 'An error occurred');
    };

    const handlePlayerDisconnected = () => {
      setError('Connection lost. Attempting to reconnect...');
    };

    wsService.on('game_state', handleGameState);
    wsService.on('game_started', handleGameStarted);
    wsService.on('error', handleError);
    wsService.addEventListener('disconnected', handlePlayerDisconnected);

    // Connect to WebSocket
    wsService.connect(gameId, decodeURIComponent(playerName));

    // Fetch initial game state
    const apiHost = process.env.REACT_APP_API_HOST || 'http://localhost:8000';
    fetch(`${apiHost}/api/game/${gameId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setGameState(data);
      })
      .catch(err => {
        console.error('Error loading game:', err);
        setError(`Failed to load game: ${err.message}`);
      });

    return () => {
      wsService.off('game_state', handleGameState);
      wsService.off('game_started', handleGameStarted);
      wsService.off('error', handleError);
      wsService.removeEventListener('disconnected', handlePlayerDisconnected);
      wsService.disconnect();
    };
  }, [gameId, playerName, navigate]);

  if (!gameState) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Loading game...</Typography>
      </Container>
    );
  }

  const decodedPlayerName = decodeURIComponent(playerName);
  const currentPlayer = gameState.players?.find(p => p.name === decodedPlayerName);
  const fascistAllies = gameState.players ? getFascistPlayers(gameState, decodedPlayerName) : [];

  // Show lobby if game hasn't started
  if (!gameState.game_started) {
    return (
      <Lobby
        gameId={gameId}
        playerName={decodedPlayerName}
        onGameStart={(payload) => {
          setGameState(payload);
          setRoleRevealed(true);
        }}
      />
    );
  }

  // Show role card if game just started
  if (gameState.game_started && !roleRevealed && currentPlayer?.role) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <RoleCard 
          role={currentPlayer.role} 
          fascistAllies={fascistAllies}
        />
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setRoleRevealed(true)}
          >
            Continue to Game
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ m: 2 }}
        >
          {error}
        </Alert>
      )}

      <GameBoard gameState={gameState} playerName={decodedPlayerName} />

      {/* Voting Phase */}
      {gameState.current_phase === Phase.VOTING && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, backgroundColor: 'white', boxShadow: 3 }}>
          <Voting
            gameState={gameState}
            playerName={decodedPlayerName}
            onVote={() => {}}
            wsService={wsService}
          />
        </Box>
      )}

      {/* Player Menu (always visible at bottom) */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '40vh', overflowY: 'auto', backgroundColor: 'white', boxShadow: 3 }}>
        <PlayerMenu
          gameState={gameState}
          playerName={decodedPlayerName}
          wsService={wsService}
        />
      </Box>

      {/* Spacer to prevent content from being hidden behind fixed menu */}
      <Box sx={{ height: '40vh' }} />
    </Box>
  );
};

const JoinPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    navigate(`/game/${gameId}/${encodeURIComponent(playerName)}`);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom align="center">
            Join Game
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Game Code: <strong>{gameId}</strong>
          </Typography>

          <TextField
            fullWidth
            label="Your Name"
            variant="outlined"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoin();
              }
            }}
            sx={{ mb: 2 }}
            autoFocus
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleJoin}
            sx={{ mb: 2 }}
          >
            Join Game
          </Button>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join/:gameId" element={<JoinPage />} />
        <Route path="/game/:gameId/:playerName" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;

