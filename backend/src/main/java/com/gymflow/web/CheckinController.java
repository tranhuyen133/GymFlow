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

    /** Mã check-in của hôm nay (mỗi ngày một mã) + ma trận QR để in dán ở quầy. */
    @GetMapping("/checkins/daily-code")
    @PreAuthorize("hasRole('ADMIN')")
    public DailyCode dailyCode(@RequestParam(required = false) String origin) {
        return checkinService.dailyCode(origin);
    }

    /** Lễ tân quét thẻ hội viên hoặc gõ mã hội viên / số điện thoại. */
    @PostMapping("/checkins/desk")
    @PreAuthorize("hasRole('ADMIN')")
    public CheckinResult desk(@Valid @RequestBody DeskCheckinRequest req) {
        return checkinService.desk(CurrentUser.get(), req.query());
    }

    /** Thẻ hội viên (QR chứa mã hội viên) để đưa lễ tân quét. */
    @GetMapping("/me/checkin-card")
    @PreAuthorize("hasRole('MEMBER')")
    public MemberCard card() {
        return checkinService.card(CurrentUser.get());
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
