import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  LinearProgress
} from '@mui/material';
import { green, red } from '@mui/material/colors';

const Voting = ({ gameState, playerName, onVote, wsService }) => {
  const player = gameState.players.find(p => p.name === playerName);
  const hasVoted = player && player.vote !== null;
  
  const alivePlayers = gameState.players.filter(p => p.is_alive);
  const votesCast = alivePlayers.filter(p => p.vote !== null).length;
  const totalVoters = alivePlayers.length;
  
  const jaVotes = Object.values(gameState.votes || {}).filter(v => v === true).length;
  const neinVotes = Object.values(gameState.votes || {}).filter(v => v === false).length;

  return (
    <Box sx={{ p: 2 }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom align="center">
            Election Voting
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 2 }}>
            President: <strong>{gameState.current_president}</strong><br />
            Nominated Chancellor: <strong>{gameState.nominated_chancellor}</strong>
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Votes Cast: {votesCast} / {totalVoters}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(votesCast / totalVoters) * 100} 
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
          
          {votesCast > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: green[50], 
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" color={green[700]}>
                    {jaVotes}
                  </Typography>
                  <Typography variant="body2" color={green[700]}>
                    Ja Votes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: red[50], 
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" color={red[700]}>
                    {neinVotes}
                  </Typography>
                  <Typography variant="body2" color={red[700]}>
                    Nein Votes
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {!hasVoted && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={() => {
              onVote(true);
              wsService.send('cast_vote', { vote: true });
            }}
            sx={{ 
              minWidth: 120,
              backgroundColor: green[600],
              '&:hover': { backgroundColor: green[700] }
            }}
          >
            JA
          </Button>
          <Button
            variant="contained"
            color="error"
            size="large"
            onClick={() => {
              onVote(false);
              wsService.send('cast_vote', { vote: false });
            }}
            sx={{ 
              minWidth: 120,
              backgroundColor: red[600],
              '&:hover': { backgroundColor: red[700] }
            }}
          >
            NEIN
          </Button>
        </Box>
      )}
      
      {hasVoted && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            You voted: <strong>{player.vote ? 'JA' : 'NEIN'}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Waiting for other players to vote...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Voting;

