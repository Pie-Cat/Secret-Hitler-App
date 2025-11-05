import random
from typing import List, Optional, Dict
from models import Game, Player, Policy, Role, PolicyType, Phase


class GameEngine:
    """Core game logic for Secret Hitler"""
    
    @staticmethod
    def create_game(game_id: str) -> Game:
        """Create a new game"""
        return Game(game_id=game_id)
    
    @staticmethod
    def add_player(game: Game, player_name: str) -> bool:
        """Add a player to the game"""
        if len(game.players) >= 10:
            return False
        if any(p.name == player_name for p in game.players):
            return False
        game.players.append(Player(name=player_name))
        return True
    
    @staticmethod
    def can_start_game(game: Game) -> bool:
        """Check if game can start (5-10 players)"""
        return 5 <= len(game.players) <= 10
    
    @staticmethod
    def start_game(game: Game) -> bool:
        """Start the game: assign roles and shuffle deck"""
        if not GameEngine.can_start_game(game):
            return False
        
        num_players = len(game.players)
        
        # Assign roles based on player count
        roles: List[Role] = []
        if num_players == 5:
            roles = [Role.HITLER, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL]
        elif num_players == 6:
            roles = [Role.HITLER, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL]
        elif num_players == 7:
            roles = [Role.HITLER, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL]
        elif num_players == 8:
            roles = [Role.HITLER, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL]
        elif num_players == 9:
            roles = [Role.HITLER, Role.FASCIST, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL]
        elif num_players == 10:
            roles = [Role.HITLER, Role.FASCIST, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL]
        
        # Shuffle roles
        random.shuffle(roles)
        for i, player in enumerate(game.players):
            player.role = roles[i]
        
        # Create and shuffle policy deck
        game.policy_deck = []
        for _ in range(6):
            game.policy_deck.append(Policy(type=PolicyType.LIBERAL))
        for _ in range(11):
            game.policy_deck.append(Policy(type=PolicyType.FASCIST))
        random.shuffle(game.policy_deck)
        
        # Set initial state
        game.current_phase = Phase.ELECTION
        game.current_president_index = 0
        game.game_started = True
        
        return True
    
    @staticmethod
    def nominate_chancellor(game: Game, president_name: str, chancellor_name: str) -> bool:
        """Nominate a chancellor"""
        if game.current_phase != Phase.ELECTION:
            return False
        
        president = game.get_current_president()
        if not president or president.name != president_name:
            return False
        
        chancellor = game.get_player_by_name(chancellor_name)
        if not chancellor or not chancellor.is_alive:
            return False
        
        # Cannot nominate previous chancellor (unless only 5 players)
        if game.last_chancellor_name and chancellor_name == game.last_chancellor_name:
            if len(game.get_alive_players()) > 5:
                return False
        
        # Cannot nominate self
        if chancellor_name == president_name:
            return False
        
        game.nominated_chancellor = chancellor_name
        game.current_phase = Phase.VOTING
        game.votes = {}
        
        # Reset all votes
        for player in game.players:
            player.vote = None
        
        return True
    
    @staticmethod
    def cast_vote(game: Game, player_name: str, vote: bool) -> bool:
        """Cast a vote"""
        if game.current_phase != Phase.VOTING:
            return False
        
        player = game.get_player_by_name(player_name)
        if not player or not player.is_alive:
            return False
        
        player.vote = vote
        game.votes[player_name] = vote
        
        return True
    
    @staticmethod
    def check_all_votes_cast(game: Game) -> bool:
        """Check if all alive players have voted"""
        alive_players = game.get_alive_players()
        return all(p.vote is not None for p in alive_players)
    
    @staticmethod
    def resolve_election(game: Game) -> bool:
        """Resolve the election and proceed to appropriate phase"""
        if not GameEngine.check_all_votes_cast(game):
            return False
        
        alive_players = game.get_alive_players()
        ja_votes = sum(1 for v in game.votes.values() if v)
        nein_votes = len(alive_players) - ja_votes
        
        if ja_votes > nein_votes:
            # Election passes
            president = game.get_current_president()
            chancellor = game.get_player_by_name(game.nominated_chancellor)
            
            if president:
                president.is_president = True
            if chancellor:
                chancellor.is_chancellor = True
            
            game.current_phase = Phase.LEGISLATIVE
            game.election_tracker = 0
            game.last_president_name = president.name if president else None
            game.last_chancellor_name = chancellor.name if chancellor else None
            
            # Draw 3 policies for president
            GameEngine.draw_policies_for_president(game)
        else:
            # Election fails
            game.election_tracker += 1
            game.current_phase = Phase.ELECTION
            
            # Reset president and chancellor flags
            for player in game.players:
                player.is_president = False
                player.is_chancellor = False
            
            # If 3 failed elections, enact top policy
            if game.election_tracker >= 3:
                GameEngine.enact_top_policy(game)
                game.election_tracker = 0
            
            # Advance to next president
            game.current_president_index = (game.current_president_index + 1) % len(game.get_alive_players())
            game.nominated_chancellor = None
        
        return True
    
    @staticmethod
    def draw_policies_for_president(game: Game) -> bool:
        """Draw 3 policies for president"""
        if len(game.policy_deck) < 3:
            # Shuffle discard pile back into deck
            game.policy_deck.extend(game.discard_pile)
            game.discard_pile = []
            random.shuffle(game.policy_deck)
        
        if len(game.policy_deck) < 3:
            return False
        
        game.president_hand = [game.policy_deck.pop(0) for _ in range(3)]
        return True
    
    @staticmethod
    def president_discard_policy(game: Game, president_name: str, policy_index: int) -> bool:
        """President discards one policy"""
        if game.current_phase != Phase.LEGISLATIVE:
            return False
        
        president = game.get_current_president()
        if not president or president.name != president_name:
            return False
        
        if policy_index < 0 or policy_index >= len(game.president_hand):
            return False
        
        discarded = game.president_hand.pop(policy_index)
        game.discard_pile.append(discarded)
        
        # Pass remaining 2 to chancellor
        game.chancellor_hand = game.president_hand.copy()
        game.president_hand = []
        
        return True
    
    @staticmethod
    def chancellor_enact_policy(game: Game, chancellor_name: str, policy_index: int) -> bool:
        """Chancellor enacts a policy"""
        if game.current_phase != Phase.LEGISLATIVE:
            return False
        
        if chancellor_name != game.nominated_chancellor:
            return False
        
        if policy_index < 0 or policy_index >= len(game.chancellor_hand):
            return False
        
        enacted = game.chancellor_hand.pop(policy_index)
        game.discard_pile.append(game.chancellor_hand[0])  # Discard the other one
        game.chancellor_hand = []
        
        # Enact policy
        if enacted.type == PolicyType.LIBERAL:
            game.liberal_policies += 1
        else:
            game.fascist_policies += 1
        
        # Check win conditions
        GameEngine.check_win_conditions(game)
        
        if game.winner:
            game.current_phase = Phase.GAME_OVER
            return True
        
        # Check for executive action
        if enacted.type == PolicyType.FASCIST:
            GameEngine.check_executive_actions(game)
        
        # Reset for next round
        GameEngine.reset_for_next_round(game)
        
        return True
    
    @staticmethod
    def enact_top_policy(game: Game) -> bool:
        """Enact top policy after 3 failed elections"""
        if len(game.policy_deck) < 1:
            if game.discard_pile:
                game.policy_deck.extend(game.discard_pile)
                game.discard_pile = []
                random.shuffle(game.policy_deck)
        
        if len(game.policy_deck) < 1:
            return False
        
        policy = game.policy_deck.pop(0)
        if policy.type == PolicyType.LIBERAL:
            game.liberal_policies += 1
        else:
            game.fascist_policies += 1
        
        GameEngine.check_win_conditions(game)
        
        if game.winner:
            game.current_phase = Phase.GAME_OVER
            return True
        
        if policy.type == PolicyType.FASCIST:
            GameEngine.check_executive_actions(game)
        
        return True
    
    @staticmethod
    def check_executive_actions(game: Game) -> None:
        """Check and set available executive actions based on fascist policies"""
        if game.fascist_policies == 1:
            game.executive_action_available = "investigate"
        elif game.fascist_policies == 2:
            game.executive_action_available = "investigate_or_special_election"
        elif game.fascist_policies == 3:
            game.executive_action_available = "investigate_or_special_election_or_policy_peek"
        elif game.fascist_policies == 4:
            game.executive_action_available = "investigate_or_special_election_or_execution"
        elif game.fascist_policies == 5:
            game.executive_action_available = "investigate_or_special_election_or_execution"
        elif game.fascist_policies >= 6:
            # Already checked in win conditions
            pass
    
    @staticmethod
    def execute_executive_action(game: Game, president_name: str, action_type: str, target: Optional[str] = None) -> bool:
        """Execute an executive action"""
        president = game.get_current_president()
        if not president or president.name != president_name:
            return False
        
        if game.current_phase != Phase.EXECUTIVE:
            return False
        
        if action_type == "investigate":
            if not target:
                return False
            target_player = game.get_player_by_name(target)
            if not target_player or not target_player.is_alive:
                return False
            game.executive_action_target = target
            # Investigation result is sent to president separately
        elif action_type == "special_election":
            if not target:
                return False
            target_player = game.get_player_by_name(target)
            if not target_player or not target_player.is_alive:
                return False
            # Set next president
            alive_players = game.get_alive_players()
            for i, player in enumerate(alive_players):
                if player.name == target:
                    game.current_president_index = i
                    break
        elif action_type == "policy_peek":
            # Show top 3 cards (handled in game state)
            pass
        elif action_type == "execution":
            if not target:
                return False
            target_player = game.get_player_by_name(target)
            if not target_player or not target_player.is_alive:
                return False
            target_player.is_alive = False
            target_player.is_executed = True
            game.executive_action_target = target
            
            # Check if Hitler was executed
            if target_player.role == Role.HITLER:
                GameEngine.check_win_conditions(game)
        else:
            return False
        
        # Move to next phase
        GameEngine.reset_for_next_round(game)
        return True
    
    @staticmethod
    def get_investigation_result(game: Game, target_name: str) -> str:
        """Get investigation result for a player"""
        target = game.get_player_by_name(target_name)
        if not target or not target.role:
            return "Unknown"
        
        if target.role == Role.LIBERAL:
            return "Liberal"
        else:
            return "Fascist"  # Don't reveal if Hitler specifically
    
    @staticmethod
    def get_policy_peek(game: Game) -> List[str]:
        """Get top 3 policies for policy peek"""
        if len(game.policy_deck) < 3:
            if game.discard_pile:
                game.policy_deck.extend(game.discard_pile)
                game.discard_pile = []
                random.shuffle(game.policy_deck)
        
        peek = []
        for i in range(min(3, len(game.policy_deck))):
            peek.append(game.policy_deck[i].type.value)
        
        return peek
    
    @staticmethod
    def reset_for_next_round(game: Game) -> None:
        """Reset game state for next round"""
        # Reset president and chancellor flags
        for player in game.players:
            player.is_president = False
            player.is_chancellor = False
            player.vote = None
        
        game.votes = {}
        game.president_hand = []
        game.chancellor_hand = []
        game.nominated_chancellor = None
        game.executive_action_available = None
        game.executive_action_target = None
        
        # If executive action is available, go to executive phase
        if game.executive_action_available:
            game.current_phase = Phase.EXECUTIVE
        else:
            game.current_phase = Phase.ELECTION
            game.current_president_index = (game.current_president_index + 1) % len(game.get_alive_players())
    
    @staticmethod
    def check_win_conditions(game: Game) -> None:
        """Check if game has ended"""
        # Liberals win: 5 liberal policies
        if game.liberal_policies >= 5:
            game.winner = "Liberal"
            game.current_phase = Phase.GAME_OVER
            return
        
        # Fascists win: 6 fascist policies
        if game.fascist_policies >= 6:
            game.winner = "Fascist"
            game.current_phase = Phase.GAME_OVER
            return
        
        # Fascists win: Hitler elected chancellor after 3+ fascist policies
        if game.fascist_policies >= 3:
            chancellor = game.get_player_by_name(game.nominated_chancellor)
            if chancellor and chancellor.role == Role.HITLER and chancellor.is_chancellor:
                game.winner = "Fascist"
                game.current_phase = Phase.GAME_OVER
                return
        
        # Liberals win: Hitler executed
        hitler = next((p for p in game.players if p.role == Role.HITLER), None)
        if hitler and hitler.is_executed:
            game.winner = "Liberal"
            game.current_phase = Phase.GAME_OVER
            return

