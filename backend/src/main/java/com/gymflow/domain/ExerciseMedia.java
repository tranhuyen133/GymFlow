package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_media")
@Getter
@Setter
@NoArgsConstructor
public class ExerciseMedia {

    public enum MediaType {
        IMAGE, GIF, VIDEO_EMBED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private MediaType mediaType;

    @Column(name = "url_or_key", nullable = false, length = 255)
    private String urlOrKey;

    @Column(length = 255)
    private String caption;

    @Column(name = "license_type", length = 100)
    private String licenseType;

    @Column(name = "source_attribution", length = 255)
    private String sourceAttribution;

    @Column(name = "is_cover", nullable = false)
    private boolean cover = false;

    @Column(name = "is_approved", nullable = false)
    private boolean approved = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
