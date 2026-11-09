package com.gymflow.web;

import com.gymflow.dto.Dtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.AuthService;
import com.gymflow.service.AvatarService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@Tag(name = "Xác thực")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AvatarService avatarService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/options")
    public AuthOptions options() {
        return authService.options();
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/verify-email")
    public AuthMessageResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        authService.verifyEmail(req);
        return new AuthMessageResponse("Email đã được xác thực. Bạn có thể đăng nhập.");
    }

    @PostMapping("/resend-verification")
    public AuthMessageResponse resendVerification(@Valid @RequestBody ResendVerificationRequest req) {
        authService.resendVerification(req);
        return new AuthMessageResponse("Nếu email cần xác thực, mã OTP sẽ được gửi đến hộp thư.");
    }

    @GetMapping("/me")
    public MeResponse me() {
        return authService.me(CurrentUser.get());
    }

    @PutMapping("/me")
    public MeResponse updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        return authService.updateProfile(CurrentUser.get(), req);
    }

    /** Ảnh đại diện của chính mình. Trả về MeResponse để frontend cập nhật avatarUpdatedAt ngay. */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MeResponse uploadAvatar(@RequestParam("file") MultipartFile file) {
        avatarService.upload(CurrentUser.get(), file);
        return authService.me(CurrentUser.get());
    }

    @DeleteMapping("/me/avatar")
    public MeResponse deleteAvatar() {
        avatarService.delete(CurrentUser.get());
        return authService.me(CurrentUser.get());
    }

    @GetMapping("/me/avatar")
    public ResponseEntity<byte[]> avatar() {
        AvatarService.AvatarFile f = avatarService.get(CurrentUser.get());
        // URL có ?v=<avatarUpdatedAt> nên cache riêng tư được; ảnh mới sẽ có URL mới
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePrivate())
                .body(f.data());
    }

    @PostMapping("/change-password")
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(CurrentUser.get(), req);
        return new MessageResponse("Đã đổi mật khẩu");
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        return authService.forgotPassword(req);
    }

    @PostMapping("/reset-password")
    public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return new MessageResponse("Đặt lại mật khẩu thành công, vui lòng đăng nhập");
    }
}
