package com.gymflow.web;

import com.gymflow.dto.CheckinDtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.CheckinService;
import com.gymflow.service.CrowdService;
import com.gymflow.service.TodayService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** V53 · Check-in tại quầy, mức đông phòng tập và trang "Hôm nay" của hội viên. */
@Tag(name = "Check-in & Hôm nay")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;
    private final CrowdService crowdService;
    private final TodayService todayService;

    /** Màn hình quầy: mã 6 số + ma trận QR, gọi lại khi hết secondsLeft. */
    @GetMapping("/checkins/kiosk")
    @PreAuthorize("hasRole('ADMIN')")
    public KioskCode kiosk(@RequestParam(required = false) String origin) {
        return checkinService.kiosk(origin);
    }

    @GetMapping("/checkins/today")
    @PreAuthorize("hasRole('ADMIN')")
    public CheckinToday today() {
        return checkinService.today();
    }

    @PostMapping("/checkins")
    @PreAuthorize("hasRole('MEMBER')")
    public CheckinResult checkin(@Valid @RequestBody CheckinRequest req) {
        return checkinService.checkin(CurrentUser.get(), req.code());
    }

    @PostMapping("/checkins/manual")
    @PreAuthorize("hasRole('ADMIN')")
    public CheckinResult manual(@Valid @RequestBody ManualCheckinRequest req) {
        return checkinService.manual(CurrentUser.get(), req.memberId());
    }

    @DeleteMapping("/checkins/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        checkinService.delete(id);
    }

    @GetMapping("/checkins/crowd")
    public CrowdResponse crowd() {
        return crowdService.crowd();
    }

    @GetMapping("/me/today")
    @PreAuthorize("hasRole('MEMBER')")
    public TodayResponse meToday() {
        return todayService.today(CurrentUser.get());
    }
}
