package com.gymflow.web;

import com.gymflow.dto.Dtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.ConversationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Hội thoại Hội viên ↔ Huấn luyện viên")
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('MEMBER')")
    public ConversationResponse create(@Valid @RequestBody CreateConversationRequest req) {
        return conversationService.getOrCreate(CurrentUser.get(), req.trainerId());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER')")
    public List<ConversationResponse> list() {
        return conversationService.listConversations(CurrentUser.get());
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER')")
    public UnreadCountResponse unreadCount() {
        return conversationService.getUnreadCount(CurrentUser.get());
    }

    @GetMapping("/{id}/messages")
    public List<MessageResponseDto> getMessages(@PathVariable Long id,
                                                @RequestParam(required = false) Long before,
                                                @RequestParam(defaultValue = "50") int size) {
        return conversationService.getMessages(CurrentUser.get(), id, before, size);
    }

    @GetMapping("/{id}/messages/new")
    public List<MessageResponseDto> getNewMessages(@PathVariable Long id,
                                                   @RequestParam(required = false, defaultValue = "0") Long after) {
        return conversationService.getNewMessages(CurrentUser.get(), id, after);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponseDto sendMessage(@PathVariable Long id,
                                          @Valid @RequestBody SendMessageRequest req) {
        return conversationService.sendMessage(CurrentUser.get(), id, req.body());
    }

    @PostMapping("/{id}/read")
    public MessageResponse markAsRead(@PathVariable Long id) {
        conversationService.markAsRead(CurrentUser.get(), id);
        return new MessageResponse("Đã đánh dấu đã đọc");
    }
}
