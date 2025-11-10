package com.secrethitler.bot;

import com.secrethitler.models.*;
import java.util.*;
import java.util.stream.Collectors;

public class BotAI {
    private static final Random random = new Random();

    public static boolean decideVote(Game game, Player bot) {
        // Simple strategy: vote yes if bot is fascist/hitler, random otherwise
        if (bot.getRole() == Role.FASCIST || bot.getRole() == Role.HITLER) {
            // Fascists generally vote yes to help their team
            return random.nextDouble() > 0.2; // 80% chance to vote yes
        } else {
            // Liberals vote more randomly
            return random.nextBoolean();
        }
    }

    public static String decideChancellorNomination(Game game, Player bot) {
        List<Player> alivePlayers = game.getAlivePlayers();
        List<Player> candidates = alivePlayers.stream()
                .filter(p -> !p.getName().equals(bot.getName())) // Can't nominate self
                .filter(p -> !p.getName().equals(game.getLastChancellorName()) || alivePlayers.size() <= 5) // Can't nominate last chancellor unless 5 players
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            return null;
        }

        // Simple strategy: random selection
        return candidates.get(random.nextInt(candidates.size())).getName();
    }

    public static int decidePolicyDiscard(Game game, Player bot, List<Policy> hand) {
        if (hand.isEmpty()) {
            return 0;
        }

        // Strategy: if fascist/hitler, try to discard liberal policies
        // If liberal, discard randomly
        if (bot.getRole() == Role.FASCIST || bot.getRole() == Role.HITLER) {
            // Find liberal policies to discard
            for (int i = 0; i < hand.size(); i++) {
                if (hand.get(i).getType() == PolicyType.LIBERAL) {
                    return i;
                }
            }
        }

        // Random discard
        return random.nextInt(hand.size());
    }

    public static int decidePolicyEnact(Game game, Player bot, List<Policy> hand) {
        if (hand.isEmpty()) {
            return 0;
        }

        // Strategy: if fascist/hitler, try to enact fascist policies
        // If liberal, try to enact liberal policies
        if (bot.getRole() == Role.FASCIST || bot.getRole() == Role.HITLER) {
            // Find fascist policies to enact
            for (int i = 0; i < hand.size(); i++) {
                if (hand.get(i).getType() == PolicyType.FASCIST) {
                    return i;
                }
            }
        } else {
            // Find liberal policies to enact
            for (int i = 0; i < hand.size(); i++) {
                if (hand.get(i).getType() == PolicyType.LIBERAL) {
                    return i;
                }
            }
        }

        // Random selection
        return random.nextInt(hand.size());
    }

    public static String decideExecutiveAction(Game game, Player bot, String actionType) {
        List<Player> alivePlayers = game.getAlivePlayers();
        
        switch (actionType) {
            case "investigate":
            case "investigate_or_special_election":
            case "investigate_or_special_election_or_policy_peek":
            case "investigate_or_special_election_or_execution":
                // Randomly select a player to investigate
                List<Player> targets = alivePlayers.stream()
                        .filter(p -> !p.getName().equals(bot.getName()))
                        .collect(Collectors.toList());
                if (!targets.isEmpty()) {
                    return targets.get(random.nextInt(targets.size())).getName();
                }
                break;
            case "execution":
                // If fascist, try to execute suspected liberals
                // Otherwise random
                if (bot.getRole() == Role.FASCIST || bot.getRole() == Role.HITLER) {
                    // Try to find a liberal to execute
                    for (Player target : alivePlayers) {
                        if (!target.getName().equals(bot.getName()) && 
                            target.getRole() == Role.LIBERAL) {
                            return target.getName();
                        }
                    }
                }
                // Random execution
                List<Player> executionTargets = alivePlayers.stream()
                        .filter(p -> !p.getName().equals(bot.getName()))
                        .collect(Collectors.toList());
                if (!executionTargets.isEmpty()) {
                    return executionTargets.get(random.nextInt(executionTargets.size())).getName();
                }
                break;
        }
        
        return null;
    }

    public static String decideExecutiveActionType(Game game, Player bot, String availableActions) {
        if (availableActions == null) {
            return null;
        }

        String[] actions = availableActions.split("_or_");
        if (actions.length == 0) {
            return null;
        }

        // Simple strategy: prefer execution if available, then investigate, then others
        for (String action : actions) {
            if (action.equals("execution")) {
                return "execution";
            }
        }
        for (String action : actions) {
            if (action.equals("investigate")) {
                return "investigate";
            }
        }

        // Random selection
        return actions[random.nextInt(actions.length)];
    }
}


