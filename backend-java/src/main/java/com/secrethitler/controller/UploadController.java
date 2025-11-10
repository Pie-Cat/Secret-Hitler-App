package com.secrethitler.controller;

import com.secrethitler.models.Game;
import com.secrethitler.service.FileStorageService;
import com.secrethitler.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UploadController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private GameService gameService;

    @PostMapping("/upload/profile-picture")
    public ResponseEntity<Map<String, Object>> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String fileUrl = fileStorageService.storeFile(file, "profiles");
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @PostMapping("/game/{gameId}/upload/card-image")
    public ResponseEntity<Map<String, Object>> uploadCardImage(
            @PathVariable String gameId,
            @RequestParam("file") MultipartFile file) {
        try {
            Game game = gameService.getGame(gameId);
            if (game == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Game not found"));
            }

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String fileUrl = fileStorageService.storeFile(file, "cards");
            game.setCustomCardImageUrl(fileUrl);
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @PostMapping("/game/{gameId}/upload/board-image")
    public ResponseEntity<Map<String, Object>> uploadBoardImage(
            @PathVariable String gameId,
            @RequestParam("file") MultipartFile file) {
        try {
            Game game = gameService.getGame(gameId);
            if (game == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Game not found"));
            }

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String fileUrl = fileStorageService.storeFile(file, "boards");
            game.setCustomBoardImageUrl(fileUrl);
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
}


