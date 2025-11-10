package com.secrethitler.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {
    private String sender;
    private String message;
    private LocalDateTime timestamp;
    private MessageType type;

    public enum MessageType {
        PLAYER_MESSAGE,
        SYSTEM_MESSAGE
    }

    public ChatMessage(String sender, String message, MessageType type) {
        this.sender = sender;
        this.message = message;
        this.type = type;
        this.timestamp = LocalDateTime.now();
    }
}


