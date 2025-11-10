package com.secrethitler.controller;

import com.secrethitler.engine.GameEngine;
import com.secrethitler.models.Game;
import com.secrethitler.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameService gameService;

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of("message", "Secret Hitler API"));
    }

    @PostMapping("/create-game")
    public ResponseEntity<Map<String, String>> createGame(@RequestBody(required = false) Map<String, Object> body) {
        String gameId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Game game = GameEngine.createGame(gameId);
        
        // Set host if provided
        if (body != null && body.containsKey("host_name")) {
            game.setHostName((String) body.get("host_name"));
        }
        
        gameService.addGame(game);
        return ResponseEntity.ok(Map.of("game_id", gameId));
    }

    @PostMapping("/create-test-game")
    public ResponseEntity<Map<String, String>> createTestGame(@RequestBody Map<String, Object> body) {
        Integer numBots = (Integer) body.getOrDefault("num_bots", 5);
        if (numBots < 5 || numBots > 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "Number of bots must be between 5 and 10"));
        }

        String gameId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Game game = GameEngine.createGame(gameId);
        
        // Set host if provided
        if (body.containsKey("host_name")) {
            game.setHostName((String) body.get("host_name"));
        }

        // Add bots
        for (int i = 1; i <= numBots; i++) {
            GameEngine.addPlayer(game, "Bot " + i, true);
        }

        gameService.addGame(game);
        return ResponseEntity.ok(Map.of("game_id", gameId));
    }

    @GetMapping("/game/{gameId}")
    public ResponseEntity<Map<String, Object>> getGame(@PathVariable String gameId) {
        Game game = gameService.getGame(gameId);
        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Game not found"));
        }
        return ResponseEntity.ok(game.toDict(null));
    }

    @GetMapping("/server-info")
    public ResponseEntity<Map<String, Object>> getServerInfo() {
        try {
            java.net.InetAddress localHost = java.net.InetAddress.getLocalHost();
            String hostAddress = localHost.getHostAddress();
            
            // Try to get network IP (not localhost)
            String networkIp = "localhost";
            try {
                java.net.NetworkInterface networkInterface = java.net.NetworkInterface.getNetworkInterfaces()
                    .asIterator().next();
                while (networkInterface != null) {
                    java.util.Enumeration<java.net.InetAddress> addresses = networkInterface.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        java.net.InetAddress addr = addresses.nextElement();
                        if (!addr.isLoopbackAddress() && addr instanceof java.net.Inet4Address) {
                            networkIp = addr.getHostAddress();
                            break;
                        }
                    }
                    if (!networkIp.equals("localhost")) break;
                    networkInterface = networkInterface.getNetworkInterfaces().hasMoreElements() 
                        ? networkInterface.getNetworkInterfaces().nextElement() : null;
                }
            } catch (Exception e) {
                // Fallback to localhost
            }
            
            return ResponseEntity.ok(Map.of(
                "host", networkIp,
                "port", 8000
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "host", "localhost",
                "port", 8000
            ));
        }
    }
}


