package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.Favorite;
import com.gymflow.domain.User;
import com.gymflow.dto.Dtos.FavoriteSummaryResponse;
import com.gymflow.repository.FavoriteRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public FavoriteSummaryResponse getSummary(AuthUser user) {
        if (user == null) return new FavoriteSummaryResponse(List.of(), List.of());
        List<Favorite> all = favoriteRepository.findByUserId(user.id());
        List<Long> exerciseIds = all.stream()
                .filter(f -> "EXERCISE".equalsIgnoreCase(f.getTargetType()))
                .map(f -> {
                    try {
                        return Long.parseLong(f.getTargetId());
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();

        List<String> equipmentKeys = all.stream()
                .filter(f -> "EQUIPMENT".equalsIgnoreCase(f.getTargetType()))
                .map(Favorite::getTargetId)
                .toList();

        return new FavoriteSummaryResponse(exerciseIds, equipmentKeys);
    }

    @Transactional
    public boolean toggleExercise(AuthUser user, Long exerciseId) {
        if (user == null) throw ApiException.unauthorized("Vui lòng đăng nhập để lưu mục yêu thích");
        String targetId = String.valueOf(exerciseId);
        var existing = favoriteRepository.findByUserIdAndTargetTypeAndTargetId(user.id(), "EXERCISE", targetId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        } else {
            User u = userRepository.getReferenceById(user.id());
            favoriteRepository.save(new Favorite(u, "EXERCISE", targetId));
            return true;
        }
    }

    @Transactional
    public boolean toggleEquipment(AuthUser user, String equipmentKey) {
        if (user == null) throw ApiException.unauthorized("Vui lòng đăng nhập để lưu mục yêu thích");
        String targetId = equipmentKey.trim().toLowerCase();
        var existing = favoriteRepository.findByUserIdAndTargetTypeAndTargetId(user.id(), "EQUIPMENT", targetId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        } else {
            User u = userRepository.getReferenceById(user.id());
            favoriteRepository.save(new Favorite(u, "EQUIPMENT", targetId));
            return true;
        }
    }

    @Transactional
    public void remove(AuthUser user, String targetType, String targetId) {
        if (user == null) throw ApiException.unauthorized("Vui lòng đăng nhập");
        favoriteRepository.deleteByUserIdAndTargetTypeAndTargetId(user.id(), targetType.toUpperCase(), targetId);
    }
}
