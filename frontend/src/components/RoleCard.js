import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { blue, red, yellow } from '@mui/material/colors';

const RoleCard = ({ role, fascistAllies = [] }) => {
  const [revealed, setRevealed] = useState(false);
  
  const getRoleColor = () => {
    switch (role) {
      case 'Liberal':
        return blue[500];
      case 'Fascist':
        return red[600];
      case 'Hitler':
        return yellow[700];
      default:
        return '#666';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'Liberal':
        return '⚖️';
      case 'Fascist':
        return '☠️';
      case 'Hitler':
        return '👑';
      default:
        return '❓';
    }
  };

  if (!revealed) {
    return (
      <Card sx={{ 
        maxWidth: 400, 
        mx: 'auto', 
        mt: 2, 
        p: 2,
        textAlign: 'center',
        backgroundColor: '#333',
        color: '#fff'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Role
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
            Click to reveal your secret role
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setRevealed(true)}
            fullWidth
          >
            Reveal Role
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      maxWidth: 400, 
      mx: 'auto', 
      mt: 2,
      backgroundColor: getRoleColor(),
      color: '#fff'
    }}>
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {getRoleIcon()}
        </Typography>
        <Typography variant="h5" gutterBottom>
          You are {role}
        </Typography>
        
        {role === 'Fascist' && fascistAllies.length > 0 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Your Fascist Allies:
            </Typography>
            {fascistAllies.map((ally, index) => (
              <Typography key={index} variant="body1">
                {ally.name}
              </Typography>
            ))}
          </Box>
        )}
        
        {role === 'Hitler' && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
            <Typography variant="body2">
              You do not know who the Fascists are. 
              If you are elected Chancellor after 3 Fascist policies are enacted, Fascists win!
            </Typography>
          </Box>
        )}
        
        {role === 'Liberal' && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
            <Typography variant="body2">
              Enact 5 Liberal policies or assassinate Hitler to win!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleCard;

