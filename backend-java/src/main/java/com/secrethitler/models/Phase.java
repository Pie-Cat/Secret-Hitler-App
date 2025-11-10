package com.secrethitler.models;

public enum Phase {
    LOBBY("Lobby"),
    ELECTION("Election"),
    VOTING("Voting"),
    LEGISLATIVE("Legislative"),
    EXECUTIVE("Executive"),
    GAME_OVER("Game_Over");

    private final String value;

    Phase(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}


