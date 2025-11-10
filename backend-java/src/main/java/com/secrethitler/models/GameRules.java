package com.secrethitler.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameRules {
    private boolean showRoleOnDeath = false; // Show role card when player is killed
    private boolean allowVeto = false; // Allow veto power (future)
    private boolean specialElectionRules = false; // Special election rules (future)
}


