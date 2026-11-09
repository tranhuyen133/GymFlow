package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.Role;
import com.gymflow.domain.User;
import com.gymflow.domain.UserAvatar;
import com.gymflow.repository.UserAvatarRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvatarServiceTest {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0};
    private static final byte[] WEBP = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};

    @Mock UserAvatarRepository avatarRepository;
    @Mock UserRepository userRepository;
    @Mock AuditService auditService;

    private AvatarService service;
    private User user;
    private final AuthUser principal = new AuthUser(7L, "member@gymflow.vn", Role.MEMBER, "Hội viên");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-11-01T03:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        service = new AvatarService(avatarRepository, userRepository, auditService, clock);
        user = new User();
        user.setId(7L);
    }

    @Test
    void sniffRecognisesSupportedFormatsOnly() {
        assertEquals("image/jpeg", AvatarService.sniff(JPEG));
        assertEquals("image/png", AvatarService.sniff(PNG));
        assertEquals("image/webp", AvatarService.sniff(WEBP));
        assertNull(AvatarService.sniff("<svg onload=alert(1)>".getBytes()));
        assertNull(AvatarService.sniff("GIF89a".getBytes()));
        assertNull(AvatarService.sniff(new byte[0]));
    }

    @Test
    void uploadIgnoresDeclaredTypeAndStoresSniffedType() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(avatarRepository.findById(7L)).thenReturn(Optional.empty());
        // Trình duyệt khai là PNG nhưng nội dung là JPEG → lưu theo nội dung thật
        service.upload(principal, new MockMultipartFile("file", "a.png", "image/png", JPEG));

        ArgumentCaptor<UserAvatar> saved = ArgumentCaptor.forClass(UserAvatar.class);
        verify(avatarRepository).save(saved.capture());
        assertEquals("image/jpeg", saved.getValue().getContentType());
        assertEquals(7L, saved.getValue().getUserId());
        assertEquals(JPEG.length, saved.getValue().getSizeBytes());
        assertNotNull(user.getAvatarUpdatedAt());
        assertEquals(user.getAvatarUpdatedAt(), saved.getValue().getUpdatedAt());
    }

    @Test
    void uploadRejectsNonImageAndOversizedFiles() {
        ApiException notImage = assertThrows(ApiException.class,
                () -> service.upload(principal, new MockMultipartFile("file", "x.jpg", "image/jpeg", "<html>".getBytes())));
        assertTrue(notImage.getMessage().contains("JPG"));

        byte[] big = new byte[AvatarService.MAX_BYTES + 1];
        System.arraycopy(JPEG, 0, big, 0, JPEG.length);
        assertThrows(ApiException.class, () -> service.upload(principal, new MockMultipartFile("file", "big.jpg", "image/jpeg", big)));
        assertThrows(ApiException.class, () -> service.upload(principal, new MockMultipartFile("file", "e.jpg", "image/jpeg", new byte[0])));
        verify(avatarRepository, never()).save(any());
    }

    @Test
    void deleteClearsTimestamp() {
        user.setAvatarUpdatedAt(java.time.LocalDateTime.now());
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(avatarRepository.existsById(7L)).thenReturn(true);
        service.delete(principal);
        verify(avatarRepository).deleteById(7L);
        assertNull(user.getAvatarUpdatedAt());
    }
}
