package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** V53 · Một lượt hội viên đến phòng tập (quét QR ở quầy hoặc quản lý check-in hộ). */
@Entity
@Table(name = "gym_checkins")
@Getter
@Setter
@NoArgsConstructor
public class GymCheckin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "checked_in_at", nullable = false)
    private LocalDateTime checkedInAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CheckinMethod method = CheckinMethod.QR;

    /** Quản lý bấm check-in hộ; null khi hội viên tự quét mã. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
