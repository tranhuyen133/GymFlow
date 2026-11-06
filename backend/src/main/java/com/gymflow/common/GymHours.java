package com.gymflow.common;

import java.time.LocalTime;

/** Giờ mở cửa phòng tập. Ca làm HLV, giờ tập mong muốn của hội viên và buổi tập đều phải nằm trong khung này. */
public final class GymHours {
    public static final LocalTime OPEN = LocalTime.of(5, 0);
    public static final LocalTime CLOSE = LocalTime.of(22, 0);
    public static final String LABEL = "05:00–22:00";

    private GymHours() {
    }

    public static boolean contains(LocalTime start, LocalTime end) {
        return !start.isBefore(OPEN) && !end.isAfter(CLOSE) && end.isAfter(start);
    }
}
