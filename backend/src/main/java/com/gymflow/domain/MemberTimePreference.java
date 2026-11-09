package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

/** Khung giờ hội viên muốn đến tập trong tuần; HLV dựa vào đây để xếp ca làm và lịch tập. */
@Entity
@Table(name = "member_time_preferences")
@Getter
@Setter
@NoArgsConstructor
public class MemberTimePreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    /** 1 = Thứ Hai … 7 = Chủ nhật (ISO-8601) */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
}
