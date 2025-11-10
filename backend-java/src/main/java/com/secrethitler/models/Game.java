package com.secrethitler.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Game {
    private String gameId;
    private List<Player> players = new ArrayList<>();
    private List<Policy> policyDeck = new ArrayList<>();
    private List<Policy> discardPile = new ArrayList<>();
    private int liberalPolicies = 0;
    private int fascistPolicies = 0;
    private int electionTracker = 0;
    private Phase currentPhase = Phase.LOBBY;
    private int currentPresidentIndex = 0;
    private String lastChancellorName;
    private String lastPresidentName;
    private String nominatedChancellor;
    private Map<String, Boolean> votes = new HashMap<>(); // player_name -> vote
    private List<Policy> presidentHand = new ArrayList<>();
    private List<Policy> chancellorHand = new ArrayList<>();
    private String executiveActionAvailable; // Type of action available
    private String executiveActionTarget; // Target of executive action
    private String winner; // "Liberal" or "Fascist"
    private boolean gameStarted = false;
    private GameRules rules = new GameRules();
    private Map<String, Boolean> readyStatus = new HashMap<>(); // player_name -> ready
    private List<ChatMessage> chatHistory = new ArrayList<>(); // Last N chat messages
    private String hostName; // Player who created the game
    private String customCardImageUrl; // Custom card image URL
    private String customBoardImageUrl; // Custom board image URL

    public Game(String gameId) {
        this.gameId = gameId;
    }

    public Player getPlayerByName(String name) {
        return players.stream()
                .filter(p -> p.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

    public List<Player> getAlivePlayers() {
        return players.stream()
                .filter(Player::isAlive)
                .collect(Collectors.toList());
    }

    public Player getCurrentPresident() {
        List<Player> alive = getAlivePlayers();
        if (alive.isEmpty()) {
            return null;
        }
        return alive.get(currentPresidentIndex % alive.size());
    }

    public Map<String, Object> toDict(String playerName) {
        Player viewingPlayer = getPlayerByName(playerName);
        boolean includeRole = false;

        // Determine if this player should see roles
        if (viewingPlayer != null && viewingPlayer.getRole() != null) {
            if (viewingPlayer.getRole() == Role.FASCIST) {
                // Fascists see all fascist roles
                includeRole = true;
            }
            // Hitler sees nothing (doesn't know fascists)
        }

        List<Map<String, Object>> playersData = new ArrayList<>();
        for (Player p : players) {
            Map<String, Object> playerDict = p.toDict(false);
            // Only show role to the player themselves or to fascists (if they're fascist/hitler)
            if (playerName != null && playerName.equals(p.getName())) {
                playerDict.put("role", p.getRole() != null ? p.getRole().getValue() : null);
            } else if (includeRole && p.getRole() != null && 
                      (p.getRole() == Role.FASCIST || p.getRole() == Role.HITLER)) {
                playerDict.put("role", p.getRole().getValue());
            }
            playersData.add(playerDict);
        }

        Player currentPresident = getCurrentPresident();
        Map<String, Object> result = new HashMap<>();
        result.put("game_id", gameId);
        result.put("players", playersData);
        result.put("liberal_policies", liberalPolicies);
        result.put("fascist_policies", fascistPolicies);
        result.put("election_tracker", electionTracker);
        result.put("current_phase", currentPhase.getValue());
        result.put("current_president", currentPresident != null ? currentPresident.getName() : null);
        result.put("nominated_chancellor", nominatedChancellor);
        result.put("last_chancellor_name", lastChancellorName);
        result.put("last_president_name", lastPresidentName);
        result.put("votes", votes);
        result.put("president_hand", 
            (playerName != null && currentPresident != null && playerName.equals(currentPresident.getName())) 
                ? presidentHand.stream().map(p -> p.getType().getValue()).collect(Collectors.toList())
                : null);
        result.put("chancellor_hand", 
            (playerName != null && nominatedChancellor != null && playerName.equals(nominatedChancellor))
                ? chancellorHand.stream().map(p -> p.getType().getValue()).collect(Collectors.toList())
                : null);
        result.put("executive_action_available", executiveActionAvailable);
        result.put("executive_action_target", executiveActionTarget);
        result.put("winner", winner);
        result.put("game_started", gameStarted);
        result.put("rules", rules);
        result.put("ready_status", readyStatus);
        result.put("chat_history", chatHistory.stream()
            .map(msg -> {
                Map<String, Object> msgMap = new HashMap<>();
                msgMap.put("sender", msg.getSender());
                msgMap.put("message", msg.getMessage());
                msgMap.put("timestamp", msg.getTimestamp().toString());
                msgMap.put("type", msg.getType().name());
                return msgMap;
            })
            .collect(Collectors.toList()));
        result.put("host_name", hostName);
        result.put("custom_card_image_url", customCardImageUrl);
        result.put("custom_board_image_url", customBoardImageUrl);

        return result;
    }
}


