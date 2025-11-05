from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    """Manages WebSocket connections for the game"""
    
    def __init__(self):
        # Maps game_id -> {player_name -> websocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, game_id: str, player_name: str):
        """Connect a player to a game"""
        await websocket.accept()
        
        if game_id not in self.active_connections:
            self.active_connections[game_id] = {}
        
        # Disconnect existing connection for this player if any
        if player_name in self.active_connections[game_id]:
            try:
                await self.active_connections[game_id][player_name].close()
            except:
                pass
        
        self.active_connections[game_id][player_name] = websocket
    
    def disconnect(self, game_id: str, player_name: str):
        """Disconnect a player from a game"""
        if game_id in self.active_connections:
            if player_name in self.active_connections[game_id]:
                del self.active_connections[game_id][player_name]
            
            # Clean up empty game connections
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
    
    async def send_personal_message(self, message: dict, game_id: str, player_name: str):
        """Send a message to a specific player"""
        if game_id in self.active_connections:
            if player_name in self.active_connections[game_id]:
                try:
                    await self.active_connections[game_id][player_name].send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error sending message to {player_name}: {e}")
    
    async def broadcast_to_game(self, message: dict, game_id: str, exclude_player: str = None):
        """Broadcast a message to all players in a game"""
        if game_id in self.active_connections:
            disconnected = []
            for player_name, websocket in self.active_connections[game_id].items():
                if player_name == exclude_player:
                    continue
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error broadcasting to {player_name}: {e}")
                    disconnected.append(player_name)
            
            # Clean up disconnected players
            for player_name in disconnected:
                self.disconnect(game_id, player_name)
    
    def get_connected_players(self, game_id: str) -> List[str]:
        """Get list of connected players for a game"""
        if game_id in self.active_connections:
            return list(self.active_connections[game_id].keys())
        return []
    
    def is_connected(self, game_id: str, player_name: str) -> bool:
        """Check if a player is connected"""
        if game_id in self.active_connections:
            return player_name in self.active_connections[game_id]
        return False

