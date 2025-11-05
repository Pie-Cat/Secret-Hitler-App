import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { blue, red } from '@mui/material/colors';

const PolicyCard = ({ policyType, onClick, disabled = false, size = 'medium' }) => {
  const isLiberal = policyType === 'Liberal';
  const backgroundColor = isLiberal ? blue[500] : red[600];
  const textColor = '#fff';
  
  const cardStyles = {
    width: size === 'small' ? 80 : size === 'large' ? 120 : 100,
    height: size === 'small' ? 120 : size === 'large' ? 180 : 150,
    backgroundColor,
    color: textColor,
    cursor: onClick && !disabled ? 'pointer' : 'default',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.3s ease',
    '&:hover': onClick && !disabled ? {
      transform: 'scale(1.05)',
      boxShadow: 6
    } : {},
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid',
    borderColor: isLiberal ? blue[700] : red[800]
  };

  return (
    <Card 
      sx={cardStyles}
      onClick={onClick && !disabled ? onClick : undefined}
    >
      <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
        <Typography variant={size === 'small' ? 'body2' : size === 'large' ? 'h5' : 'h6'}>
          {policyType}
        </Typography>
        {size !== 'small' && (
          <Box sx={{ mt: 1, fontSize: size === 'large' ? '3rem' : '2rem' }}>
            {isLiberal ? '⚖️' : '☠️'}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PolicyCard;

