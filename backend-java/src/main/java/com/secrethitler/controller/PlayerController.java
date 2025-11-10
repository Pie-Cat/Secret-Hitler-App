package com.secrethitler.controller;

import com.secrethitler.models.Game;
import com.secrethitler.models.Player;
import com.secrethitler.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/player")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Autowired
    private GameService gameService;

    @PutMapping("/{playerName}/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable String playerName,
            @RequestBody Map<String, Object> profileData) {
        
        // Find player across all games
        for (Game game : gameService.getGames().values()) {
            Player player = game.getPlayerByName(playerName);
            if (player != null) {
                if (profileData.containsKey("username")) {
                    player.setUsername((String) profileData.get("username"));
                }
                if (profileData.containsKey("profilePictureUrl")) {
                    player.setProfilePictureUrl((String) profileData.get("profilePictureUrl"));
                }
                if (profileData.containsKey("selectedEmotes")) {
                    @SuppressWarnings("unchecked")
                    List<String> emotes = (List<String>) profileData.get("selectedEmotes");
                    player.setSelectedEmotes(emotes);
                }
                return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated"));
            }
        }
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Player not found"));
    }
}


