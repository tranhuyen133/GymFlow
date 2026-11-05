package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.User;
import com.gymflow.domain.UserAvatar;
import com.gymflow.repository.UserAvatarRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Ảnh đại diện: mỗi người chỉ sửa được ảnh của chính mình.
 * Không tin Content-Type do trình duyệt gửi – định dạng được xác định từ các byte đầu file (magic bytes).
 */
@Service
@RequiredArgsConstructor
public class AvatarService {

    public static final int MAX_BYTES = 512 * 1024;

    private final UserAvatarRepository avatarRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final Clock clock;

    public record AvatarFile(byte[] data, String contentType) {
    }

    @Transactional
    public void upload(AuthUser principal, MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Vui lòng chọn ảnh");
        if (file.getSize() > MAX_BYTES) throw ApiException.badRequest("Ảnh tối đa 512 KB sau khi nén");
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Không đọc được file ảnh");
        }
        String type = sniff(data);
        if (type == null) throw ApiException.badRequest("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP");

        User u = userRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("tài khoản"));
        // Cắt về micro giây để khớp DATETIME(6) – giá trị trả về frontend trùng với giá trị đọc lại từ CSDL
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        UserAvatar a = avatarRepository.findById(u.getId()).orElseGet(UserAvatar::new);
        a.setUserId(u.getId());
        a.setContentType(type);
        a.setSizeBytes(data.length);
        a.setData(data);
        a.setUpdatedAt(now);
        avatarRepository.save(a);
        u.setAvatarUpdatedAt(now);
        auditService.log("AVATAR_UPDATE", "USER", u.getId(), null);
    }

    @Transactional
    public void delete(AuthUser principal) {
        User u = userRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("tài khoản"));
        if (avatarRepository.existsById(u.getId())) avatarRepository.deleteById(u.getId());
        if (u.getAvatarUpdatedAt() != null) {
            u.setAvatarUpdatedAt(null);
            auditService.log("AVATAR_DELETE", "USER", u.getId(), null);
        }
    }

    @Transactional(readOnly = true)
    public AvatarFile get(AuthUser principal) {
        UserAvatar a = avatarRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("ảnh đại diện"));
        return new AvatarFile(a.getData(), a.getContentType());
    }

    /** JPEG: FF D8 FF · PNG: 89 50 4E 47 0D 0A 1A 0A · WebP: "RIFF" ???? "WEBP". */
    static String sniff(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return "image/png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
}
