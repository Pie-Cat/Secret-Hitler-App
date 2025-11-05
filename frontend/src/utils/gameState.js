export const Phase = {
  LOBBY: 'Lobby',
  ELECTION: 'Election',
  VOTING: 'Voting',
  LEGISLATIVE: 'Legislative',
  EXECUTIVE: 'Executive',
  GAME_OVER: 'Game_Over'
};

export const Role = {
  HITLER: 'Hitler',
  FASCIST: 'Fascist',
  LIBERAL: 'Liberal'
};

export const PolicyType = {
  LIBERAL: 'Liberal',
  FASCIST: 'Fascist'
};

export function canPlayerPerformAction(gameState, playerName, action) {
  const player = gameState.players.find(p => p.name === playerName);
  if (!player || !player.is_alive) {
    return false;
  }

  switch (action) {
    case 'nominate_chancellor':
      return gameState.current_phase === Phase.ELECTION && 
             gameState.current_president === playerName;
    
    case 'vote':
      return gameState.current_phase === Phase.VOTING;
    
    case 'president_discard':
      return gameState.current_phase === Phase.LEGISLATIVE && 
             gameState.current_president === playerName &&
             gameState.president_hand &&
             gameState.president_hand.length > 0;
    
    case 'chancellor_enact':
      return gameState.current_phase === Phase.LEGISLATIVE && 
             gameState.nominated_chancellor === playerName &&
             gameState.chancellor_hand &&
             gameState.chancellor_hand.length > 0;
    
    case 'executive_action':
      return gameState.current_phase === Phase.EXECUTIVE && 
             gameState.current_president === playerName;
    
    default:
      return false;
  }
}

export function getPlayerRole(gameState, playerName) {
  const player = gameState.players.find(p => p.name === playerName);
  return player ? player.role : null;
}

export function getFascistPlayers(gameState, playerName) {
  const currentPlayer = gameState.players.find(p => p.name === playerName);
  if (!currentPlayer || currentPlayer.role !== Role.FASCIST) {
    return [];
  }
  
  // Fascists can see other fascists and Hitler
  return gameState.players.filter(p => 
    p.name !== playerName && 
    (p.role === Role.FASCIST || p.role === Role.HITLER) &&
    p.is_alive
  );
}

export function isGameOver(gameState) {
  return gameState.current_phase === Phase.GAME_OVER || gameState.winner;
}

