package com.secrethitler.service;

import com.secrethitler.bot.BotAI;
import com.secrethitler.engine.GameEngine;
import com.secrethitler.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class BotService {

    @Autowired
    private GameService gameService;

    @Async
    public CompletableFuture<Void> processBotActions(Game game, String gameId) {
        try {
            Thread.sleep(1000); // Small delay to make bot actions feel natural

            Phase phase = game.getCurrentPhase();
            Player currentPresident = game.getCurrentPresident();

            // Check if current president is a bot
            if (currentPresident != null && currentPresident.isBot()) {
                switch (phase) {
                    case ELECTION:
                        // Bot should nominate a chancellor
                        String chancellorName = BotAI.decideChancellorNomination(game, currentPresident);
                        if (chancellorName != null) {
                            GameEngine.nominateChancellor(game, currentPresident.getName(), chancellorName);
                        }
                        break;
                    case LEGISLATIVE:
                        // Bot president should discard a policy
                        if (!game.getPresidentHand().isEmpty()) {
                            int discardIndex = BotAI.decidePolicyDiscard(game, currentPresident, game.getPresidentHand());
                            GameEngine.presidentDiscardPolicy(game, currentPresident.getName(), discardIndex);
                        }
                        // Bot chancellor should enact a policy
                        Player chancellor = game.getPlayerByName(game.getNominatedChancellor());
                        if (chancellor != null && chancellor.isBot() && !game.getChancellorHand().isEmpty()) {
                            int enactIndex = BotAI.decidePolicyEnact(game, chancellor, game.getChancellorHand());
                            GameEngine.chancellorEnactPolicy(game, chancellor.getName(), enactIndex);
                        }
                        break;
                    case EXECUTIVE:
                        // Bot should execute executive action
                        if (game.getExecutiveActionAvailable() != null) {
                            String actionType = BotAI.decideExecutiveActionType(game, currentPresident, 
                                game.getExecutiveActionAvailable());
                            if (actionType != null) {
                                String target = BotAI.decideExecutiveAction(game, currentPresident, actionType);
                                if (target != null || actionType.equals("policy_peek")) {
                                    GameEngine.executeExecutiveAction(game, currentPresident.getName(), actionType, target);
                                }
                            }
                        }
                        break;
                }
            }

            // Check if any bot needs to vote
            if (phase == Phase.VOTING) {
                for (Player player : game.getPlayers()) {
                    if (player.isBot() && player.isAlive() && player.getVote() == null) {
                        boolean vote = BotAI.decideVote(game, player);
                        GameEngine.castVote(game, player.getName(), vote);
                        
                        // Check if all votes are cast
                        if (GameEngine.checkAllVotesCast(game)) {
                            GameEngine.resolveElection(game);
                        }
                    }
                }
            }

            // Bots automatically mark ready
            if (phase != Phase.LOBBY && phase != Phase.GAME_OVER) {
                for (Player player : game.getPlayers()) {
                    if (player.isBot() && player.isAlive()) {
                        game.getReadyStatus().put(player.getName(), true);
                    }
                }
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return CompletableFuture.completedFuture(null);
    }
}


