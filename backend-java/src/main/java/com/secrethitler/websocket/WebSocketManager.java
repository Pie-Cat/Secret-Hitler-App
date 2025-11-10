package com.secrethitler.websocket;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import org.springframework.web.socket.WebSocketSession;

@Component
public class WebSocketManager {
    // Maps game_id -> {player_name -> session}
    private final Map<String, Map<String, WebSocketSession>> activeConnections = new ConcurrentHashMap<>();

    public void connect(WebSocketSession session, String gameId, String playerName) {
        activeConnections.computeIfAbsent(gameId, k -> new ConcurrentHashMap<>()).put(playerName, session);
    }

    public void disconnect(String gameId, String playerName) {
        Map<String, WebSocketSession> gameConnections = activeConnections.get(gameId);
        if (gameConnections != null) {
            gameConnections.remove(playerName);
            if (gameConnections.isEmpty()) {
                activeConnections.remove(gameId);
            }
        }
    }

    public WebSocketSession getSession(String gameId, String playerName) {
        Map<String, WebSocketSession> gameConnections = activeConnections.get(gameId);
        if (gameConnections != null) {
            return gameConnections.get(playerName);
        }
        return null;
    }

    public List<String> getConnectedPlayers(String gameId) {
        Map<String, WebSocketSession> gameConnections = activeConnections.get(gameId);
        if (gameConnections != null) {
            return new ArrayList<>(gameConnections.keySet());
        }
        return new ArrayList<>();
    }

    public boolean isConnected(String gameId, String playerName) {
        Map<String, WebSocketSession> gameConnections = activeConnections.get(gameId);
        return gameConnections != null && gameConnections.containsKey(playerName);
    }

    public List<WebSocketSession> getAllSessions(String gameId) {
        Map<String, WebSocketSession> gameConnections = activeConnections.get(gameId);
        if (gameConnections != null) {
            return new ArrayList<>(gameConnections.values());
        }
        return new ArrayList<>();
    }
}


