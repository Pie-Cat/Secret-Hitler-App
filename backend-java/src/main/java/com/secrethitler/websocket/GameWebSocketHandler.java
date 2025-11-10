package com.secrethitler.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrethitler.engine.GameEngine;
import com.secrethitler.models.*;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {
    private final WebSocketManager connectionManager;
    private final com.secrethitler.service.GameService gameService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GameWebSocketHandler(WebSocketManager connectionManager, 
                               com.secrethitler.service.GameService gameService) {
        this.connectionManager = connectionManager;
        this.gameService = gameService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String gameId = extractGameId(session);
        String playerName = extractPlayerName(session);

        if (gameId == null || playerName == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid game ID or player name"));
            return;
        }

        Game game = gameService.getGame(gameId);
        if (game == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Game not found"));
            return;
        }

        connectionManager.connect(session, gameId, playerName);

        // Send initial game state
        Map<String, Object> gameState = game.toDict(playerName);
        sendMessage(session, "game_state", gameState);

        // Send investigation result if available
        if (game.getExecutiveActionAvailable() != null && 
            game.getExecutiveActionAvailable().contains("investigate")) {
            Player president = game.getCurrentPresident();
            if (president != null && president.getName().equals(playerName) && 
                game.getExecutiveActionTarget() != null) {
                String result = GameEngine.getInvestigationResult(game, game.getExecutiveActionTarget());
                sendMessage(session, "investigation_result", Map.of(
                    "target", game.getExecutiveActionTarget(),
                    "result", result
                ));
            }
        }

        // Send policy peek if available
        if (game.getExecutiveActionAvailable() != null && 
            game.getExecutiveActionAvailable().contains("policy_peek")) {
            Player president = game.getCurrentPresident();
            if (president != null && president.getName().equals(playerName)) {
                java.util.List<String> peek = GameEngine.getPolicyPeek(game);
                sendMessage(session, "policy_peek", Map.of("policies", peek));
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String gameId = extractGameId(session);
        String playerName = extractPlayerName(session);

        if (gameId == null || playerName == null) {
            return;
        }

        Game game = gameService.getGame(gameId);
        if (game == null) {
            return;
        }

        try {
            Map<String, Object> data = objectMapper.readValue(message.getPayload(), Map.class);
            String action = (String) data.get("action");
            Map<String, Object> payload = (Map<String, Object>) data.getOrDefault("payload", Map.of());

            handleAction(session, game, gameId, playerName, action, payload);
        } catch (Exception e) {
            e.printStackTrace();
            sendMessage(session, "error", Map.of("message", "Invalid message format"));
        }
    }

    private void handleAction(WebSocketSession session, Game game, String gameId, 
                              String playerName, String action, Map<String, Object> payload) throws IOException {
        switch (action) {
            case "join_game":
                handleJoinGame(session, game, gameId, playerName);
                break;
            case "start_game":
                handleStartGame(session, game, gameId, playerName);
                break;
            case "nominate_chancellor":
                handleNominateChancellor(session, game, gameId, playerName, payload);
                break;
            case "cast_vote":
                handleCastVote(session, game, gameId, playerName, payload);
                break;
            case "president_discard":
                handlePresidentDiscard(session, game, gameId, playerName, payload);
                break;
            case "chancellor_enact":
                handleChancellorEnact(session, game, gameId, playerName, payload);
                break;
            case "executive_action":
                handleExecutiveAction(session, game, gameId, playerName, payload);
                break;
            case "get_game_state":
                handleGetGameState(session, game, playerName);
                break;
            case "ready":
                handleReady(session, game, gameId, playerName);
                break;
            case "chat_message":
                handleChatMessage(session, game, gameId, playerName, payload);
                break;
            case "update_rules":
                handleUpdateRules(session, game, gameId, playerName, payload);
                break;
            default:
                sendMessage(session, "error", Map.of("message", "Unknown action: " + action));
        }
    }

    private void handleUpdateRules(WebSocketSession session, Game game, String gameId, 
                                  String playerName, Map<String, Object> payload) throws IOException {
        // Only host can update rules
        if (!playerName.equals(game.getHostName())) {
            sendMessage(session, "error", Map.of("message", "Only the host can update rules"));
            return;
        }

        if (payload.containsKey("showRoleOnDeath")) {
            game.getRules().setShowRoleOnDeath((Boolean) payload.get("showRoleOnDeath"));
        }

        broadcastToGame(gameId, "rules_updated", Map.of("rules", game.getRules()));
        broadcastGameState(gameId);
    }

    private void handleJoinGame(WebSocketSession session, Game game, String gameId, String playerName) throws IOException {
        boolean success = GameEngine.addPlayer(game, playerName);
        if (success) {
            broadcastToGame(gameId, "player_joined", Map.of(
                "player_name", playerName,
                "total_players", game.getPlayers().size()
            ));
        } else {
            sendMessage(session, "error", Map.of("message", "Failed to join game"));
        }
        broadcastGameState(gameId);
    }

    private void handleStartGame(WebSocketSession session, Game game, String gameId, String playerName) throws IOException {
        if (GameEngine.startGame(game)) {
            // Send roles to each player
            for (Player player : game.getPlayers()) {
                Map<String, Object> playerState = game.toDict(player.getName());
                WebSocketSession playerSession = connectionManager.getSession(gameId, player.getName());
                if (playerSession != null) {
                    sendMessage(playerSession, "game_started", playerState);
                }
            }
        } else {
            sendMessage(session, "error", Map.of("message", "Cannot start game"));
        }
    }

    private void handleNominateChancellor(WebSocketSession session, Game game, String gameId, 
                                         String playerName, Map<String, Object> payload) throws IOException {
        String chancellorName = (String) payload.get("chancellor_name");
        if (GameEngine.nominateChancellor(game, playerName, chancellorName)) {
            broadcastToGame(gameId, "chancellor_nominated", Map.of(
                "chancellor_name", chancellorName,
                "phase", game.getCurrentPhase().getValue()
            ));
        } else {
            sendMessage(session, "error", Map.of("message", "Invalid nomination"));
        }
        broadcastGameState(gameId);
    }

    private void handleCastVote(WebSocketSession session, Game game, String gameId, 
                               String playerName, Map<String, Object> payload) throws IOException {
        Boolean vote = (Boolean) payload.get("vote");
        if (vote != null && GameEngine.castVote(game, playerName, vote)) {
            broadcastToGame(gameId, "vote_cast", Map.of(
                "player_name", playerName,
                "vote", vote
            ));

            // Check if all votes are cast
            if (GameEngine.checkAllVotesCast(game)) {
                GameEngine.resolveElection(game);

                // Broadcast results
                broadcastToGame(gameId, "election_resolved", Map.of(
                    "votes", game.getVotes(),
                    "passed", game.getCurrentPhase() == Phase.LEGISLATIVE,
                    "election_tracker", game.getElectionTracker(),
                    "phase", game.getCurrentPhase().getValue()
                ));

                broadcastGameState(gameId);
            }
        } else {
            sendMessage(session, "error", Map.of("message", "Invalid vote"));
        }
    }

    private void handlePresidentDiscard(WebSocketSession session, Game game, String gameId, 
                                       String playerName, Map<String, Object> payload) throws IOException {
        Integer policyIndex = (Integer) payload.get("policy_index");
        if (policyIndex != null && GameEngine.presidentDiscardPolicy(game, playerName, policyIndex)) {
            // Send updated hand to chancellor
            Player chancellor = game.getPlayerByName(game.getNominatedChancellor());
            if (chancellor != null) {
                WebSocketSession chancellorSession = connectionManager.getSession(gameId, chancellor.getName());
                if (chancellorSession != null) {
                    Map<String, Object> chancellorState = game.toDict(chancellor.getName());
                    sendMessage(chancellorSession, "game_state", chancellorState);
                }
            }
        } else {
            sendMessage(session, "error", Map.of("message", "Invalid discard"));
        }
    }

    private void handleChancellorEnact(WebSocketSession session, Game game, String gameId, 
                                       String playerName, Map<String, Object> payload) throws IOException {
        Integer policyIndex = (Integer) payload.get("policy_index");
        int prevLiberal = game.getLiberalPolicies();
        int prevFascist = game.getFascistPolicies();

        if (policyIndex != null && GameEngine.chancellorEnactPolicy(game, playerName, policyIndex)) {
                    // Determine which policy was enacted
                    String policyType = game.getLiberalPolicies() > prevLiberal ? "Liberal" : "Fascist";

                    // Add system message
                    String systemMsg = policyType + " policy enacted! " + 
                        (policyType.equals("Fascist") ? "Fascists gain another one!" : "Liberals advance!");
                    ChatMessage systemMessage = new ChatMessage("System", systemMsg, ChatMessage.MessageType.SYSTEM_MESSAGE);
                    game.getChatHistory().add(systemMessage);
                    if (game.getChatHistory().size() > 100) {
                        game.getChatHistory().remove(0);
                    }

                    broadcastToGame(gameId, "policy_enacted", Map.of(
                        "policy_type", policyType,
                        "liberal_policies", game.getLiberalPolicies(),
                        "fascist_policies", game.getFascistPolicies(),
                        "winner", game.getWinner() != null ? game.getWinner() : "",
                        "phase", game.getCurrentPhase().getValue()
                    ));
                    
                    // Broadcast system message
                    broadcastToGame(gameId, "chat_message", Map.of(
                        "sender", "System",
                        "message", systemMsg,
                        "timestamp", systemMessage.getTimestamp().toString(),
                        "type", "SYSTEM_MESSAGE"
                    ));

            broadcastGameState(gameId);

            // Check for executive actions
            if (game.getExecutiveActionAvailable() != null && game.getCurrentPhase() == Phase.EXECUTIVE) {
                Player president = game.getCurrentPresident();
                if (president != null) {
                    WebSocketSession presidentSession = connectionManager.getSession(gameId, president.getName());
                    if (presidentSession != null) {
                        Map<String, Object> presidentState = game.toDict(president.getName());
                        sendMessage(presidentSession, "executive_action_available", Map.of(
                            "action_type", game.getExecutiveActionAvailable(),
                            "game_state", presidentState
                        ));
                    }
                }
            }
        } else {
            sendMessage(session, "error", Map.of("message", "Invalid policy enactment"));
        }
    }

    private void handleExecutiveAction(WebSocketSession session, Game game, String gameId, 
                                      String playerName, Map<String, Object> payload) throws IOException {
        String actionType = (String) payload.get("action_type");
        String target = (String) payload.get("target");

        if (GameEngine.executeExecutiveAction(game, playerName, actionType, target)) {
            // Send investigation result if applicable
            if ("investigate".equals(actionType) && target != null) {
                String result = GameEngine.getInvestigationResult(game, target);
                sendMessage(session, "investigation_result", Map.of(
                    "target", target,
                    "result", result
                ));
            }

            // Broadcast executive action
            broadcastToGame(gameId, "executive_action_executed", Map.of(
                "action_type", actionType,
                "target", target != null ? target : "",
                "phase", game.getCurrentPhase().getValue()
            ));

            broadcastGameState(gameId);
        } else {
            sendMessage(session, "error", Map.of("message", "Invalid executive action"));
        }
    }

    private void handleGetGameState(WebSocketSession session, Game game, String playerName) throws IOException {
        Map<String, Object> playerState = game.toDict(playerName);
        sendMessage(session, "game_state", playerState);
    }

    private void handleReady(WebSocketSession session, Game game, String gameId, String playerName) throws IOException {
        game.getReadyStatus().put(playerName, true);
        broadcastToGame(gameId, "player_ready", Map.of(
            "player_name", playerName,
            "all_ready", GameEngine.allPlayersReady(game)
        ));

        // If all players ready, proceed to next phase
        if (GameEngine.allPlayersReady(game)) {
            GameEngine.resetReadyStatus(game);
            broadcastToGame(gameId, "all_players_ready", Map.of());
            broadcastGameState(gameId);
        }
    }

    private void handleChatMessage(WebSocketSession session, Game game, String gameId, 
                                   String playerName, Map<String, Object> payload) throws IOException {
        String message = (String) payload.get("message");
        if (message != null && !message.trim().isEmpty()) {
            ChatMessage chatMessage = new ChatMessage(playerName, message, ChatMessage.MessageType.PLAYER_MESSAGE);
            game.getChatHistory().add(chatMessage);
            // Keep only last 100 messages
            if (game.getChatHistory().size() > 100) {
                game.getChatHistory().remove(0);
            }

            broadcastToGame(gameId, "chat_message", Map.of(
                "sender", playerName,
                "message", message,
                "timestamp", chatMessage.getTimestamp().toString(),
                "type", "PLAYER_MESSAGE"
            ));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String gameId = extractGameId(session);
        String playerName = extractPlayerName(session);

        if (gameId != null && playerName != null) {
            connectionManager.disconnect(gameId, playerName);
            Game game = gameService.getGame(gameId);
            if (game != null) {
                // Remove player from game if in lobby
                if (game.getCurrentPhase() == Phase.LOBBY) {
                    game.getPlayers().removeIf(p -> p.getName().equals(playerName));
                }

                // Broadcast disconnection
                broadcastToGame(gameId, "player_disconnected", Map.of("player_name", playerName));
                broadcastGameState(gameId);
            }
        }
    }

    private String extractGameId(WebSocketSession session) {
        String uri = session.getUri().toString();
        String[] parts = uri.split("/");
        for (int i = 0; i < parts.length; i++) {
            if ("ws".equals(parts[i]) && i + 1 < parts.length) {
                return parts[i + 1];
            }
        }
        return null;
    }

    private String extractPlayerName(WebSocketSession session) {
        String uri = session.getUri().toString();
        String[] parts = uri.split("/");
        for (int i = 0; i < parts.length; i++) {
            if ("ws".equals(parts[i]) && i + 2 < parts.length) {
                return java.net.URLDecoder.decode(parts[i + 2], java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private void sendMessage(WebSocketSession session, String type, Object payload) throws IOException {
        Map<String, Object> message = Map.of("type", type, "payload", payload);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
    }

    private void broadcastToGame(String gameId, String type, Object payload) throws IOException {
        for (WebSocketSession session : connectionManager.getAllSessions(gameId)) {
            if (session.isOpen()) {
                sendMessage(session, type, payload);
            }
        }
    }

    private void broadcastGameState(String gameId) throws IOException {
        Game game = gameService.getGame(gameId);
        if (game == null) return;

        for (Player player : game.getPlayers()) {
            WebSocketSession session = connectionManager.getSession(gameId, player.getName());
            if (session != null && session.isOpen()) {
                Map<String, Object> playerState = game.toDict(player.getName());
                sendMessage(session, "game_state", playerState);
            }
        }
    }
}

