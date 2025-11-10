package com.secrethitler.engine;

import com.secrethitler.models.*;
import java.util.*;
import java.util.stream.Collectors;

public class GameEngine {
    private static final Random random = new Random();

    public static Game createGame(String gameId) {
        return new Game(gameId);
    }

    public static boolean addPlayer(Game game, String playerName) {
        return addPlayer(game, playerName, false);
    }

    public static boolean addPlayer(Game game, String playerName, boolean isBot) {
        if (game.getPlayers().size() >= 10) {
            return false;
        }
        if (game.getPlayers().stream().anyMatch(p -> p.getName().equals(playerName))) {
            return false;
        }
        Player player = new Player(playerName);
        player.setBot(isBot);
        if (isBot) {
            player.setBotDifficulty("medium");
        }
        game.getPlayers().add(player);
        return true;
    }

    public static boolean canStartGame(Game game) {
        int playerCount = game.getPlayers().size();
        return playerCount >= 5 && playerCount <= 10;
    }

    public static boolean startGame(Game game) {
        if (!canStartGame(game)) {
            return false;
        }

        int numPlayers = game.getPlayers().size();

        // Assign roles based on player count
        List<Role> roles = new ArrayList<>();
        switch (numPlayers) {
            case 5:
                roles = Arrays.asList(Role.HITLER, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL);
                break;
            case 6:
                roles = Arrays.asList(Role.HITLER, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL);
                break;
            case 7:
                roles = Arrays.asList(Role.HITLER, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL);
                break;
            case 8:
                roles = Arrays.asList(Role.HITLER, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL);
                break;
            case 9:
                roles = Arrays.asList(Role.HITLER, Role.FASCIST, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL);
                break;
            case 10:
                roles = Arrays.asList(Role.HITLER, Role.FASCIST, Role.FASCIST, Role.FASCIST, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL, Role.LIBERAL);
                break;
        }

        // Shuffle roles
        Collections.shuffle(roles);
        for (int i = 0; i < game.getPlayers().size(); i++) {
            game.getPlayers().get(i).setRole(roles.get(i));
        }

        // Create and shuffle policy deck
        game.setPolicyDeck(new ArrayList<>());
        for (int i = 0; i < 6; i++) {
            game.getPolicyDeck().add(new Policy(PolicyType.LIBERAL, 0));
        }
        for (int i = 0; i < 11; i++) {
            game.getPolicyDeck().add(new Policy(PolicyType.FASCIST, 0));
        }
        Collections.shuffle(game.getPolicyDeck());

        // Set initial state - randomly select president
        game.setCurrentPhase(Phase.ELECTION);
        List<Player> alivePlayers = game.getAlivePlayers();
        if (!alivePlayers.isEmpty()) {
            game.setCurrentPresidentIndex(random.nextInt(alivePlayers.size()));
        }
        game.setGameStarted(true);

        return true;
    }

    public static boolean nominateChancellor(Game game, String presidentName, String chancellorName) {
        if (game.getCurrentPhase() != Phase.ELECTION) {
            return false;
        }

        Player president = game.getCurrentPresident();
        if (president == null || !president.getName().equals(presidentName)) {
            return false;
        }

        Player chancellor = game.getPlayerByName(chancellorName);
        if (chancellor == null || !chancellor.isAlive()) {
            return false;
        }

        // Cannot nominate previous chancellor (unless only 5 players)
        if (game.getLastChancellorName() != null && chancellorName.equals(game.getLastChancellorName())) {
            if (game.getAlivePlayers().size() > 5) {
                return false;
            }
        }

        // Cannot nominate self
        if (chancellorName.equals(presidentName)) {
            return false;
        }

        game.setNominatedChancellor(chancellorName);
        game.setCurrentPhase(Phase.VOTING);
        game.setVotes(new HashMap<>());

        // Reset all votes
        for (Player player : game.getPlayers()) {
            player.setVote(null);
        }

        return true;
    }

    public static boolean castVote(Game game, String playerName, boolean vote) {
        if (game.getCurrentPhase() != Phase.VOTING) {
            return false;
        }

        Player player = game.getPlayerByName(playerName);
        if (player == null || !player.isAlive()) {
            return false;
        }

        player.setVote(vote);
        game.getVotes().put(playerName, vote);

        return true;
    }

    public static boolean checkAllVotesCast(Game game) {
        List<Player> alivePlayers = game.getAlivePlayers();
        return alivePlayers.stream().allMatch(p -> p.getVote() != null);
    }

    public static boolean resolveElection(Game game) {
        if (!checkAllVotesCast(game)) {
            return false;
        }

        List<Player> alivePlayers = game.getAlivePlayers();
        long jaVotes = game.getVotes().values().stream().filter(v -> v).count();
        long neinVotes = alivePlayers.size() - jaVotes;

        if (jaVotes > neinVotes) {
            // Election passes
            Player president = game.getCurrentPresident();
            Player chancellor = game.getPlayerByName(game.getNominatedChancellor());

            if (president != null) {
                president.setPresident(true);
            }
            if (chancellor != null) {
                chancellor.setChancellor(true);
            }

            game.setCurrentPhase(Phase.LEGISLATIVE);
            game.setElectionTracker(0);
            game.setLastPresidentName(president != null ? president.getName() : null);
            game.setLastChancellorName(chancellor != null ? chancellor.getName() : null);

            // Draw 3 policies for president
            drawPoliciesForPresident(game);
        } else {
            // Election fails
            game.setElectionTracker(game.getElectionTracker() + 1);
            game.setCurrentPhase(Phase.ELECTION);

            // Reset president and chancellor flags
            for (Player player : game.getPlayers()) {
                player.setPresident(false);
                player.setChancellor(false);
            }

            // If 3 failed elections, enact top policy
            if (game.getElectionTracker() >= 3) {
                enactTopPolicy(game);
                game.setElectionTracker(0);
            }

            // Advance to next president
            List<Player> alive = game.getAlivePlayers();
            if (!alive.isEmpty()) {
                game.setCurrentPresidentIndex((game.getCurrentPresidentIndex() + 1) % alive.size());
            }
            game.setNominatedChancellor(null);
        }

        return true;
    }

    public static boolean drawPoliciesForPresident(Game game) {
        if (game.getPolicyDeck().size() < 3) {
            // Shuffle discard pile back into deck
            game.getPolicyDeck().addAll(game.getDiscardPile());
            game.setDiscardPile(new ArrayList<>());
            Collections.shuffle(game.getPolicyDeck());
        }

        if (game.getPolicyDeck().size() < 3) {
            return false;
        }

        game.setPresidentHand(new ArrayList<>());
        for (int i = 0; i < 3; i++) {
            game.getPresidentHand().add(game.getPolicyDeck().remove(0));
        }

        return true;
    }

    public static boolean presidentDiscardPolicy(Game game, String presidentName, int policyIndex) {
        if (game.getCurrentPhase() != Phase.LEGISLATIVE) {
            return false;
        }

        Player president = game.getCurrentPresident();
        if (president == null || !president.getName().equals(presidentName)) {
            return false;
        }

        if (policyIndex < 0 || policyIndex >= game.getPresidentHand().size()) {
            return false;
        }

        Policy discarded = game.getPresidentHand().remove(policyIndex);
        game.getDiscardPile().add(discarded);

        // Pass remaining 2 to chancellor
        game.setChancellorHand(new ArrayList<>(game.getPresidentHand()));
        game.setPresidentHand(new ArrayList<>());

        return true;
    }

    public static boolean chancellorEnactPolicy(Game game, String chancellorName, int policyIndex) {
        if (game.getCurrentPhase() != Phase.LEGISLATIVE) {
            return false;
        }

        if (!chancellorName.equals(game.getNominatedChancellor())) {
            return false;
        }

        if (policyIndex < 0 || policyIndex >= game.getChancellorHand().size()) {
            return false;
        }

        Policy enacted = game.getChancellorHand().remove(policyIndex);
        if (!game.getChancellorHand().isEmpty()) {
            game.getDiscardPile().add(game.getChancellorHand().get(0)); // Discard the other one
        }
        game.setChancellorHand(new ArrayList<>());

        // Enact policy
        if (enacted.getType() == PolicyType.LIBERAL) {
            game.setLiberalPolicies(game.getLiberalPolicies() + 1);
        } else {
            game.setFascistPolicies(game.getFascistPolicies() + 1);
        }

        // Check win conditions
        checkWinConditions(game);

        if (game.getWinner() != null) {
            game.setCurrentPhase(Phase.GAME_OVER);
            return true;
        }

        // Check for executive action
        if (enacted.getType() == PolicyType.FASCIST) {
            checkExecutiveActions(game);
        }

        // Reset for next round
        resetForNextRound(game);

        return true;
    }

    public static boolean enactTopPolicy(Game game) {
        if (game.getPolicyDeck().isEmpty()) {
            if (!game.getDiscardPile().isEmpty()) {
                game.getPolicyDeck().addAll(game.getDiscardPile());
                game.setDiscardPile(new ArrayList<>());
                Collections.shuffle(game.getPolicyDeck());
            }
        }

        if (game.getPolicyDeck().isEmpty()) {
            return false;
        }

        Policy policy = game.getPolicyDeck().remove(0);
        if (policy.getType() == PolicyType.LIBERAL) {
            game.setLiberalPolicies(game.getLiberalPolicies() + 1);
        } else {
            game.setFascistPolicies(game.getFascistPolicies() + 1);
        }

        checkWinConditions(game);

        if (game.getWinner() != null) {
            game.setCurrentPhase(Phase.GAME_OVER);
            return true;
        }

        if (policy.getType() == PolicyType.FASCIST) {
            checkExecutiveActions(game);
        }

        return true;
    }

    public static void checkExecutiveActions(Game game) {
        int fascistPolicies = game.getFascistPolicies();
        if (fascistPolicies == 1) {
            game.setExecutiveActionAvailable("investigate");
        } else if (fascistPolicies == 2) {
            game.setExecutiveActionAvailable("investigate_or_special_election");
        } else if (fascistPolicies == 3) {
            game.setExecutiveActionAvailable("investigate_or_special_election_or_policy_peek");
        } else if (fascistPolicies == 4) {
            game.setExecutiveActionAvailable("investigate_or_special_election_or_execution");
        } else if (fascistPolicies == 5) {
            game.setExecutiveActionAvailable("investigate_or_special_election_or_execution");
        }
        // fascistPolicies >= 6 already checked in win conditions
    }

    public static boolean executeExecutiveAction(Game game, String presidentName, String actionType, String target) {
        Player president = game.getCurrentPresident();
        if (president == null || !president.getName().equals(presidentName)) {
            return false;
        }

        if (game.getCurrentPhase() != Phase.EXECUTIVE) {
            return false;
        }

        switch (actionType) {
            case "investigate":
                if (target == null) {
                    return false;
                }
                Player targetPlayer = game.getPlayerByName(target);
                if (targetPlayer == null || !targetPlayer.isAlive()) {
                    return false;
                }
                game.setExecutiveActionTarget(target);
                // Investigation result is sent to president separately
                break;
            case "special_election":
                if (target == null) {
                    return false;
                }
                Player targetPlayer2 = game.getPlayerByName(target);
                if (targetPlayer2 == null || !targetPlayer2.isAlive()) {
                    return false;
                }
                // Set next president
                List<Player> alivePlayers = game.getAlivePlayers();
                for (int i = 0; i < alivePlayers.size(); i++) {
                    if (alivePlayers.get(i).getName().equals(target)) {
                        game.setCurrentPresidentIndex(i);
                        break;
                    }
                }
                break;
            case "policy_peek":
                // Show top 3 cards (handled in game state)
                break;
            case "execution":
                if (target == null) {
                    return false;
                }
                Player targetPlayer3 = game.getPlayerByName(target);
                if (targetPlayer3 == null || !targetPlayer3.isAlive()) {
                    return false;
                }
                targetPlayer3.setAlive(false);
                targetPlayer3.setExecuted(true);
                game.setExecutiveActionTarget(target);

                // Check if Hitler was executed
                if (targetPlayer3.getRole() == Role.HITLER) {
                    checkWinConditions(game);
                }
                break;
            default:
                return false;
        }

        // Move to next phase
        resetForNextRound(game);
        return true;
    }

    public static String getInvestigationResult(Game game, String targetName) {
        Player target = game.getPlayerByName(targetName);
        if (target == null || target.getRole() == null) {
            return "Unknown";
        }

        if (target.getRole() == Role.LIBERAL) {
            return "Liberal";
        } else {
            return "Fascist"; // Don't reveal if Hitler specifically
        }
    }

    public static List<String> getPolicyPeek(Game game) {
        if (game.getPolicyDeck().size() < 3) {
            if (!game.getDiscardPile().isEmpty()) {
                game.getPolicyDeck().addAll(game.getDiscardPile());
                game.setDiscardPile(new ArrayList<>());
                Collections.shuffle(game.getPolicyDeck());
            }
        }

        List<String> peek = new ArrayList<>();
        for (int i = 0; i < Math.min(3, game.getPolicyDeck().size()); i++) {
            peek.add(game.getPolicyDeck().get(i).getType().getValue());
        }

        return peek;
    }

    public static void resetForNextRound(Game game) {
        // Reset president and chancellor flags
        for (Player player : game.getPlayers()) {
            player.setPresident(false);
            player.setChancellor(false);
            player.setVote(null);
        }

        game.setVotes(new HashMap<>());
        game.setPresidentHand(new ArrayList<>());
        game.setChancellorHand(new ArrayList<>());
        game.setNominatedChancellor(null);
        game.setExecutiveActionAvailable(null);
        game.setExecutiveActionTarget(null);

        // If executive action is available, go to executive phase
        if (game.getExecutiveActionAvailable() != null) {
            game.setCurrentPhase(Phase.EXECUTIVE);
        } else {
            game.setCurrentPhase(Phase.ELECTION);
            List<Player> alive = game.getAlivePlayers();
            if (!alive.isEmpty()) {
                game.setCurrentPresidentIndex((game.getCurrentPresidentIndex() + 1) % alive.size());
            }
        }
    }

    public static void checkWinConditions(Game game) {
        // Liberals win: 5 liberal policies
        if (game.getLiberalPolicies() >= 5) {
            game.setWinner("Liberal");
            game.setCurrentPhase(Phase.GAME_OVER);
            return;
        }

        // Fascists win: 6 fascist policies
        if (game.getFascistPolicies() >= 6) {
            game.setWinner("Fascist");
            game.setCurrentPhase(Phase.GAME_OVER);
            return;
        }

        // Fascists win: Hitler elected chancellor after 3+ fascist policies
        if (game.getFascistPolicies() >= 3) {
            Player chancellor = game.getPlayerByName(game.getNominatedChancellor());
            if (chancellor != null && chancellor.getRole() == Role.HITLER && chancellor.isChancellor()) {
                game.setWinner("Fascist");
                game.setCurrentPhase(Phase.GAME_OVER);
                return;
            }
        }

        // Liberals win: Hitler executed
        Optional<Player> hitler = game.getPlayers().stream()
                .filter(p -> p.getRole() == Role.HITLER)
                .findFirst();
        if (hitler.isPresent() && hitler.get().isExecuted()) {
            game.setWinner("Liberal");
            game.setCurrentPhase(Phase.GAME_OVER);
        }
    }

    public static boolean allPlayersReady(Game game) {
        List<Player> alivePlayers = game.getAlivePlayers();
        return alivePlayers.stream()
                .allMatch(p -> game.getReadyStatus().getOrDefault(p.getName(), false));
    }

    public static void resetReadyStatus(Game game) {
        game.setReadyStatus(new HashMap<>());
    }
}


