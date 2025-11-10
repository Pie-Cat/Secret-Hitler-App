package com.secrethitler.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Player {
    private String name;
    private String username; // Customizable username
    private String profilePictureUrl; // URL to profile picture
    private List<String> selectedEmotes = new ArrayList<>(); // Emote preferences
    private Role role;
    private boolean isAlive = true;
    private boolean isPresident = false;
    private boolean isChancellor = false;
    private Boolean vote; // True = Ja, False = Nein, null = not voted
    private List<String> investigatedBy = new ArrayList<>(); // Players who investigated this player
    private boolean isExecuted = false;
    private boolean isBot = false; // Whether this is a bot player
    private String botDifficulty; // Bot difficulty level (if bot)

    public Player(String name) {
        this.name = name;
        this.username = name; // Default username to name
    }

    public Map<String, Object> toDict(boolean includeRole) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", name);
        data.put("username", username);
        data.put("profilePictureUrl", profilePictureUrl);
        data.put("selectedEmotes", selectedEmotes);
        data.put("is_alive", isAlive);
        data.put("is_president", isPresident);
        data.put("is_chancellor", isChancellor);
        data.put("vote", vote);
        data.put("is_executed", isExecuted);
        data.put("is_bot", isBot);
        
        if (includeRole && role != null) {
            data.put("role", role.getValue());
        }
        
        return data;
    }
}


