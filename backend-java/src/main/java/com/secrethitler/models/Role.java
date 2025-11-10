package com.secrethitler.models;

public enum Role {
    HITLER("Hitler"),
    FASCIST("Fascist"),
    LIBERAL("Liberal");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}


