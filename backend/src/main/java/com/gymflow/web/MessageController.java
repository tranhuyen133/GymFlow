package com.gymflow.web;

import com.gymflow.dto.Dtos.MessageResponseDto;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.MessageAttachmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

/** Thao tác trên từng tin nhắn: tải tệp, thu hồi, xoá phía mình. */
@Tag(name = "Tin nhắn")
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageAttachmentService attachmentService;

    @GetMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER', 'ADMIN')")
    public ResponseEntity<byte[]> attachment(@PathVariable Long id) {
        MessageAttachmentService.AttachmentFile f = attachmentService.download(CurrentUser.get(), id);
        ContentDisposition disposition = (f.inline() ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(f.fileName(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .contentLength(f.data().length)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; img-src 'self'; media-src 'self'; sandbox")
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .body(f.data());
    }

    @PostMapping("/{id}/recall")
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER')")
    public MessageResponseDto recall(@PathVariable Long id) {
        return attachmentService.recall(CurrentUser.get(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER')")
    public void hide(@PathVariable Long id) {
        attachmentService.hide(CurrentUser.get(), id);
    }
}
