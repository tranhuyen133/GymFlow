package com.gymflow.service;

import com.gymflow.dto.CheckinDtos.CrowdResponse;
import com.gymflow.dto.CheckinDtos.HourValue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CrowdServiceTest {

    /** Thứ Ba 17/11/2026, 10:15. */
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 17, 10, 15);

    /** 4 thứ Ba trước: mỗi tuần 8 lượt lúc 18h, 2 lượt lúc 10h, 1 lượt lúc 14h. */
    private static List<LocalDateTime> sample() {
        List<LocalDateTime> list = new ArrayList<>();
        for (int w = 1; w <= 4; w++) {
            LocalDate d = NOW.toLocalDate().minusWeeks(w);
            for (int i = 0; i < 8; i++) list.add(d.atTime(18, i * 5));
            for (int i = 0; i < 2; i++) list.add(d.atTime(10, i * 5));
            list.add(d.atTime(14, 0));
        }
        return list;
    }

    @Test
    @DisplayName("Trung bình theo giờ của đúng thứ hôm nay, tìm giờ đông nhất và giờ vắng sắp tới")
    void averagesPeakQuiet() {
        CrowdResponse r = CrowdService.build(sample(), "CHECKIN", NOW, 3);
        assertThat(r.dayOfWeek()).isEqualTo(2);
        assertThat(r.today()).first().extracting(HourValue::hour).isEqualTo(CrowdService.OPEN_HOUR);
        assertThat(r.today().stream().filter(h -> h.hour() == 18).findFirst().orElseThrow().value()).isEqualTo(8.0);
        assertThat(r.today().stream().filter(h -> h.hour() == 10).findFirst().orElseThrow().value()).isEqualTo(2.0);
        assertThat(r.peakHour()).isEqualTo(18);
        assertThat(r.quietHour()).isEqualTo(11);
        assertThat(r.level()).isEqualTo("QUIET");
        assertThat(r.inGymNow()).isEqualTo(3);
        assertThat(r.enoughData()).isTrue();
        assertThat(r.week()).hasSize(7);
        assertThat(r.week().get(0)).hasSize(24);
    }

    @Test
    @DisplayName("Giờ cao điểm là BUSY, không có dữ liệu thì UNKNOWN")
    void levels() {
        CrowdResponse busy = CrowdService.build(sample(), "CHECKIN", NOW.withHour(18), 0);
        assertThat(busy.level()).isEqualTo("BUSY");
        CrowdResponse none = CrowdService.build(List.of(), "SCHEDULE", NOW, 0);
        assertThat(none.level()).isEqualTo("UNKNOWN");
        assertThat(none.peakHour()).isNull();
        assertThat(none.quietHour()).isNull();
        assertThat(none.enoughData()).isFalse();
        CrowdResponse closed = CrowdService.build(sample(), "CHECKIN", NOW.withHour(23), 0);
        assertThat(closed.level()).isEqualTo("UNKNOWN");
    }

    @Test
    void levelThresholds() {
        assertThat(CrowdService.levelOf(0.2)).isEqualTo("QUIET");
        assertThat(CrowdService.levelOf(0.5)).isEqualTo("NORMAL");
        assertThat(CrowdService.levelOf(0.9)).isEqualTo("BUSY");
    }
}
