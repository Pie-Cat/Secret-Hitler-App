from enum import Enum
from typing import List, Optional, Dict
from dataclasses import dataclass, field


class Role(Enum):
    HITLER = "Hitler"
    FASCIST = "Fascist"
    LIBERAL = "Liberal"


class PolicyType(Enum):
    LIBERAL = "Liberal"
    FASCIST = "Fascist"


class Phase(Enum):
    LOBBY = "Lobby"
    ELECTION = "Election"
    VOTING = "Voting"
    LEGISLATIVE = "Legislative"
    EXECUTIVE = "Executive"
    GAME_OVER = "Game_Over"


@dataclass
class Policy:
    type: PolicyType
    position: int = 0  # Position in deck/hand


@dataclass
class Player:
    name: str
    role: Optional[Role] = None
    is_alive: bool = True
    is_president: bool = False
    is_chancellor: bool = False
    vote: Optional[bool] = None  # True = Ja, False = Nein
    investigated_by: List[str] = field(default_factory=list)  # Players who investigated this player
    is_executed: bool = False
    
    def to_dict(self, include_role: bool = False) -> Dict:
        """Convert player to dict, optionally including role"""
        data = {
            "name": self.name,
            "is_alive": self.is_alive,
            "is_president": self.is_president,
            "is_chancellor": self.is_chancellor,
            "vote": self.vote,
            "is_executed": self.is_executed
        }
        if include_role:
            data["role"] = self.role.value if self.role else None
        return data


@dataclass
class Game:
    game_id: str
    players: List[Player] = field(default_factory=list)
    policy_deck: List[Policy] = field(default_factory=list)
    discard_pile: List[Policy] = field(default_factory=list)
    liberal_policies: int = 0
    fascist_policies: int = 0
    election_tracker: int = 0
    current_phase: Phase = Phase.LOBBY
    current_president_index: int = 0
    last_chancellor_name: Optional[str] = None
    last_president_name: Optional[str] = None
    nominated_chancellor: Optional[str] = None
    votes: Dict[str, bool] = field(default_factory=dict)  # player_name -> vote
    president_hand: List[Policy] = field(default_factory=list)
    chancellor_hand: List[Policy] = field(default_factory=list)
    executive_action_available: Optional[str] = None  # Type of action available
    executive_action_target: Optional[str] = None  # Target of executive action
    winner: Optional[str] = None  # "Liberal" or "Fascist"
    game_started: bool = False
    
    def get_player_by_name(self, name: str) -> Optional[Player]:
        """Get player by name"""
        for player in self.players:
            if player.name == name:
                return player
        return None
    
    def get_alive_players(self) -> List[Player]:
        """Get all alive players"""
        return [p for p in self.players if p.is_alive]
    
    def get_current_president(self) -> Optional[Player]:
        """Get current president"""
        alive = self.get_alive_players()
        if not alive:
            return None
        return alive[self.current_president_index % len(alive)]
    
    def to_dict(self, player_name: Optional[str] = None) -> Dict:
        """Convert game to dict, with role visibility based on player"""
        player = self.get_player_by_name(player_name) if player_name else None
        include_role = False
        
        # Determine if this player should see roles
        if player and player.role:
            if player.role == Role.FASCIST:
                # Fascists see all fascist roles
                include_role = True
            elif player.role == Role.HITLER:
                # Hitler sees nothing (doesn't know fascists)
                include_role = False
        
        players_data = []
        for p in self.players:
            player_dict = p.to_dict(include_role=False)
            # Only show role to the player themselves or to fascists (if they're fascist/hitler)
            if player_name == p.name:
                player_dict["role"] = p.role.value if p.role else None
            elif include_role and p.role in [Role.FASCIST, Role.HITLER]:
                player_dict["role"] = p.role.value
            players_data.append(player_dict)
        
        return {
            "game_id": self.game_id,
            "players": players_data,
            "liberal_policies": self.liberal_policies,
            "fascist_policies": self.fascist_policies,
            "election_tracker": self.election_tracker,
            "current_phase": self.current_phase.value,
            "current_president": self.get_current_president().name if self.get_current_president() else None,
            "nominated_chancellor": self.nominated_chancellor,
            "last_chancellor_name": self.last_chancellor_name,
            "last_president_name": self.last_president_name,
            "votes": self.votes,
            "president_hand": [p.type.value for p in self.president_hand] if player_name == (self.get_current_president().name if self.get_current_president() else None) else None,
            "chancellor_hand": [p.type.value for p in self.chancellor_hand] if player_name == self.nominated_chancellor else None,
            "executive_action_available": self.executive_action_available,
            "executive_action_target": self.executive_action_target,
            "winner": self.winner,
            "game_started": self.game_started
        }

