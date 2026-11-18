package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** V55 · Huy hiệu hội viên đã đạt. Mã huy hiệu xem BadgeRules. */
@Entity
@Table(name = "member_badges")
@Getter
@Setter
@NoArgsConstructor
public class MemberBadge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 40)
    private String code;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt;

    /** null = hội viên chưa xem, trang Hôm nay hiện hiệu ứng chúc mừng. */
    @Column(name = "seen_at")
    private LocalDateTime seenAt;
}
