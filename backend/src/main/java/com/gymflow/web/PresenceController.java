package com.gymflow.web;

import com.gymflow.dto.Dtos.PresenceResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.PresenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Heartbeat trạng thái online cho Hội viên / Huấn luyện viên khi nhắn tin. */
@Tag(name = "Hiện diện")
@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    @PostMapping("/heartbeat")
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER')")
    public PresenceResponse heartbeat() {
        return presenceService.heartbeat(CurrentUser.get());
    }
}
