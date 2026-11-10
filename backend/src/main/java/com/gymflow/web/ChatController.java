package com.gymflow.web;

import com.gymflow.dto.Dtos.ChatConversationResponse;
import com.gymflow.dto.Dtos.ChatCreateConversationResponse;
import com.gymflow.dto.Dtos.ChatHistoryResponse;
import com.gymflow.dto.Dtos.ChatMessageResponse;
import com.gymflow.dto.Dtos.ChatSendRequest;
import com.gymflow.dto.Dtos.ChatSuggestion;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Trợ lý GymFlow")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/suggestions")
    public List<ChatSuggestion> suggestions() {
        return chatService.suggestions(CurrentUser.get());
    }

    @GetMapping("/conversations")
    public List<ChatConversationResponse> conversations() {
        return chatService.conversations(CurrentUser.get());
    }

    @PostMapping("/conversations")
    public ChatCreateConversationResponse createConversation() {
        return chatService.createConversation(CurrentUser.get());
    }

    @GetMapping("/conversations/{id}")
    public ChatHistoryResponse history(@PathVariable Long id) {
        return chatService.history(CurrentUser.get(), id);
    }

    @PostMapping("/messages")
    public ChatMessageResponse send(@Valid @RequestBody ChatSendRequest request) {
        return chatService.send(CurrentUser.get(), request);
    }
}
