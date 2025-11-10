package com.secrethitler.models;

public enum PolicyType {
    LIBERAL("Liberal"),
    FASCIST("Fascist");

    private final String value;

    PolicyType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}


