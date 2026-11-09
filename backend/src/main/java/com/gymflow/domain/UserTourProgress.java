package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_tour_progress")
@IdClass(UserTourProgressId.class)
@Getter
@Setter
@NoArgsConstructor
public class UserTourProgress {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "tour_key", nullable = false, length = 50)
    private String tourKey;

    @Column(nullable = false)
    private Integer step = 0;

    @Column(nullable = false, length = 20)
    private String status = "PAUSED"; // PAUSED, DONE, SKIPPED

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserTourProgress(Long userId, String tourKey, Integer step, String status) {
        this.userId = userId;
        this.tourKey = tourKey;
        this.step = step == null ? 0 : step;
        this.status = status == null ? "PAUSED" : status;
        this.updatedAt = LocalDateTime.now();
    }
}
