from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import uuid
from typing import Dict
from models import Game, Phase
from game_engine import GameEngine
from websocket_manager import ConnectionManager

app = FastAPI()

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for mobile device access
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory game storage
games: Dict[str, Game] = {}
manager = ConnectionManager()


def generate_game_id() -> str:
    """Generate a unique game ID"""
    return str(uuid.uuid4())[:8].upper()


@app.get("/")
async def root():
    return {"message": "Secret Hitler API"}


@app.post("/api/create-game")
async def create_game():
    """Create a new game"""
    game_id = generate_game_id()
    game = GameEngine.create_game(game_id)
    games[game_id] = game
    return {"game_id": game_id}


@app.get("/api/game/{game_id}")
async def get_game(game_id: str):
    """Get game state (for initial load)"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    return games[game_id].to_dict()


@app.websocket("/ws/{game_id}/{player_name}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, player_name: str):
    """WebSocket endpoint for game communication"""
    if game_id not in games:
        await websocket.close(code=1008, reason="Game not found")
        return
    
    await manager.connect(websocket, game_id, player_name)
    game = games[game_id]
    
    # Send initial game state
    game_state = game.to_dict(player_name)
    await manager.send_personal_message({
        "type": "game_state",
        "payload": game_state
    }, game_id, player_name)
    
    # Send investigation result if available
    if game.executive_action_available and "investigate" in game.executive_action_available:
        president = game.get_current_president()
        if president and president.name == player_name and game.executive_action_target:
            result = GameEngine.get_investigation_result(game, game.executive_action_target)
            await manager.send_personal_message({
                "type": "investigation_result",
                "payload": {
                    "target": game.executive_action_target,
                    "result": result
                }
            }, game_id, player_name)
    
    # Send policy peek if available
    if game.executive_action_available and "policy_peek" in game.executive_action_available:
        president = game.get_current_president()
        if president and president.name == player_name:
            peek = GameEngine.get_policy_peek(game)
            await manager.send_personal_message({
                "type": "policy_peek",
                "payload": {
                    "policies": peek
                }
            }, game_id, player_name)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            payload = message.get("payload", {})
            
            # Handle different actions
            if action == "join_game":
                success = GameEngine.add_player(game, player_name)
                if success:
                    await manager.broadcast_to_game({
                        "type": "player_joined",
                        "payload": {
                            "player_name": player_name,
                            "total_players": len(game.players)
                        }
                    }, game_id)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Failed to join game"}
                    }, game_id, player_name)
            
            elif action == "start_game":
                if GameEngine.start_game(game):
                    # Send roles to each player
                    for player in game.players:
                        player_state = game.to_dict(player.name)
                        await manager.send_personal_message({
                            "type": "game_started",
                            "payload": player_state
                        }, game_id, player.name)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Cannot start game"}
                    }, game_id, player_name)
            
            elif action == "nominate_chancellor":
                chancellor_name = payload.get("chancellor_name")
                if GameEngine.nominate_chancellor(game, player_name, chancellor_name):
                    await manager.broadcast_to_game({
                        "type": "chancellor_nominated",
                        "payload": {
                            "chancellor_name": chancellor_name,
                            "phase": game.current_phase.value
                        }
                    }, game_id)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Invalid nomination"}
                    }, game_id, player_name)
            
            elif action == "cast_vote":
                vote = payload.get("vote")  # True = Ja, False = Nein
                if GameEngine.cast_vote(game, player_name, vote):
                    await manager.broadcast_to_game({
                        "type": "vote_cast",
                        "payload": {
                            "player_name": player_name,
                            "vote": vote
                        }
                    }, game_id)
                    
                    # Check if all votes are cast
                    if GameEngine.check_all_votes_cast(game):
                        GameEngine.resolve_election(game)
                        
                        # Broadcast results
                        await manager.broadcast_to_game({
                            "type": "election_resolved",
                            "payload": {
                                "votes": game.votes,
                                "passed": game.current_phase == Phase.LEGISLATIVE,
                                "election_tracker": game.election_tracker,
                                "phase": game.current_phase.value
                            }
                        }, game_id)
                        
                        # Send updated game state
                        for p in game.players:
                            if manager.is_connected(game_id, p.name):
                                player_state = game.to_dict(p.name)
                                await manager.send_personal_message({
                                    "type": "game_state",
                                    "payload": player_state
                                }, game_id, p.name)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Invalid vote"}
                    }, game_id, player_name)
            
            elif action == "president_discard":
                policy_index = payload.get("policy_index")
                if GameEngine.president_discard_policy(game, player_name, policy_index):
                    # Send updated hand to chancellor
                    chancellor = game.get_player_by_name(game.nominated_chancellor)
                    if chancellor and manager.is_connected(game_id, chancellor.name):
                        chancellor_state = game.to_dict(chancellor.name)
                        await manager.send_personal_message({
                            "type": "game_state",
                            "payload": chancellor_state
                        }, game_id, chancellor.name)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Invalid discard"}
                    }, game_id, player_name)
            
            elif action == "chancellor_enact":
                policy_index = payload.get("policy_index")
                # Store previous counts to determine which policy was enacted
                prev_liberal = game.liberal_policies
                prev_fascist = game.fascist_policies
                if GameEngine.chancellor_enact_policy(game, player_name, policy_index):
                    # Determine which policy was enacted
                    if game.liberal_policies > prev_liberal:
                        policy_type = "Liberal"
                    else:
                        policy_type = "Fascist"
                    
                    await manager.broadcast_to_game({
                        "type": "policy_enacted",
                        "payload": {
                            "policy_type": policy_type,
                            "liberal_policies": game.liberal_policies,
                            "fascist_policies": game.fascist_policies,
                            "winner": game.winner,
                            "phase": game.current_phase.value
                        }
                    }, game_id)
                    
                    # Send updated game state to all players
                    for p in game.players:
                        if manager.is_connected(game_id, p.name):
                            player_state = game.to_dict(p.name)
                            await manager.send_personal_message({
                                "type": "game_state",
                                "payload": player_state
                            }, game_id, p.name)
                    
                    # Check for executive actions
                    if game.executive_action_available and game.current_phase == Phase.EXECUTIVE:
                        president = game.get_current_president()
                        if president:
                            president_state = game.to_dict(president.name)
                            await manager.send_personal_message({
                                "type": "executive_action_available",
                                "payload": {
                                    "action_type": game.executive_action_available,
                                    "game_state": president_state
                                }
                            }, game_id, president.name)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Invalid policy enactment"}
                    }, game_id, player_name)
            
            elif action == "executive_action":
                action_type = payload.get("action_type")
                target = payload.get("target")
                
                if GameEngine.execute_executive_action(game, player_name, action_type, target):
                    # Send investigation result if applicable
                    if action_type == "investigate" and target:
                        result = GameEngine.get_investigation_result(game, target)
                        await manager.send_personal_message({
                            "type": "investigation_result",
                            "payload": {
                                "target": target,
                                "result": result
                            }
                        }, game_id, player_name)
                    
                    # Broadcast executive action
                    await manager.broadcast_to_game({
                        "type": "executive_action_executed",
                        "payload": {
                            "action_type": action_type,
                            "target": target,
                            "phase": game.current_phase.value
                        }
                    }, game_id)
                    
                    # Send updated game state to all players
                    for p in game.players:
                        if manager.is_connected(game_id, p.name):
                            player_state = game.to_dict(p.name)
                            await manager.send_personal_message({
                                "type": "game_state",
                                "payload": player_state
                            }, game_id, p.name)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Invalid executive action"}
                    }, game_id, player_name)
            
            elif action == "get_game_state":
                player_state = game.to_dict(player_name)
                await manager.send_personal_message({
                    "type": "game_state",
                    "payload": player_state
                }, game_id, player_name)
            
            # Always send updated game state after actions
            if game.current_phase != Phase.GAME_OVER:
                for p in game.players:
                    if manager.is_connected(game_id, p.name):
                        player_state = game.to_dict(p.name)
                        await manager.send_personal_message({
                            "type": "game_state",
                            "payload": player_state
                        }, game_id, p.name)
            
    except WebSocketDisconnect:
        manager.disconnect(game_id, player_name)
        # Remove player from game if in lobby
        if game.current_phase == Phase.LOBBY:
            game.players = [p for p in game.players if p.name != player_name]
        
        # Broadcast disconnection and updated game state
        await manager.broadcast_to_game({
            "type": "player_disconnected",
            "payload": {"player_name": player_name}
        }, game_id)
        
        # Send updated game state to all remaining players
        for p in game.players:
            if manager.is_connected(game_id, p.name):
                player_state = game.to_dict(p.name)
                await manager.send_personal_message({
                    "type": "game_state",
                    "payload": player_state
                }, game_id, p.name)
    except Exception as e:
        print(f"Error in websocket: {e}")
        manager.disconnect(game_id, player_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

