package com.gymflow.web;

import com.gymflow.dto.Dtos.FavoriteSummaryResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.FavoriteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Mục yêu thích")
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public FavoriteSummaryResponse getFavorites() {
        return favoriteService.getSummary(CurrentUser.get());
    }

    @PostMapping("/exercises/{id}")
    public Map<String, Boolean> toggleExercise(@PathVariable Long id) {
        boolean fav = favoriteService.toggleExercise(CurrentUser.get(), id);
        return Map.of("favorite", fav);
    }

    @DeleteMapping("/exercises/{id}")
    public Map<String, Boolean> removeExercise(@PathVariable Long id) {
        favoriteService.remove(CurrentUser.get(), "EXERCISE", String.valueOf(id));
        return Map.of("favorite", false);
    }

    @PostMapping("/equipment/{key}")
    public Map<String, Boolean> toggleEquipment(@PathVariable String key) {
        boolean fav = favoriteService.toggleEquipment(CurrentUser.get(), key);
        return Map.of("favorite", fav);
    }

    @DeleteMapping("/equipment/{key}")
    public Map<String, Boolean> removeEquipment(@PathVariable String key) {
        favoriteService.remove(CurrentUser.get(), "EQUIPMENT", key);
        return Map.of("favorite", false);
    }
}
