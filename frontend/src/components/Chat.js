import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import wsService from '../services/websocket';

const Chat = ({ gameState, playerName }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history from game state
    if (gameState && gameState.chat_history) {
      setMessages(gameState.chat_history.map(msg => ({
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        type: msg.type || 'PLAYER_MESSAGE'
      })));
    }
  }, [gameState]);

  useEffect(() => {
    const handleChatMessage = (payload) => {
      setMessages(prev => [...prev, {
        sender: payload.sender,
        message: payload.message,
        timestamp: payload.timestamp,
        type: payload.type || 'PLAYER_MESSAGE'
      }]);
    };

    wsService.on('chat_message', handleChatMessage);

    return () => {
      wsService.off('chat_message', handleChatMessage);
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      wsService.send('chat_message', { message: message.trim() });
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Chat</Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <List sx={{ py: 0 }}>
          {messages.map((msg, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <Box sx={{ width: '100%' }}>
                {msg.type === 'SYSTEM_MESSAGE' ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 0.5,
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    fontSize: '0.875rem'
                  }}>
                    {msg.message}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {getInitials(msg.sender)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {msg.sender}
                      </Typography>
                      <Typography variant="body2">{msg.message}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!gameState || gameState.current_phase === 'Game_Over'}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!message.trim() || !gameState || gameState.current_phase === 'Game_Over'}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default Chat;


