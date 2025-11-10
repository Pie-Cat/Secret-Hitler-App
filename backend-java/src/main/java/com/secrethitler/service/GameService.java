package com.secrethitler.service;

import com.secrethitler.models.Game;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    private final Map<String, Game> games = new ConcurrentHashMap<>();

    public Map<String, Game> getGames() {
        return games;
    }

    public Game getGame(String gameId) {
        return games.get(gameId);
    }

    public void addGame(Game game) {
        games.put(game.getGameId(), game);
    }

    public void removeGame(String gameId) {
        games.remove(gameId);
    }
}


