package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.config.DemoAccounts;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.EmailVerificationTokenRepository;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.PasswordResetTokenRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import com.gymflow.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    // Người cập nhật hiện tại: Đặng Dũng
    private static final String BAD_LOGIN = "Email hoặc mật khẩu không đúng";

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final TrainerRepository trainerRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final UserService userService;
    private final MemberService memberService;
    private final EmailService emailService;
    private final Clock clock;

    @Value("${app.reset.valid-minutes:30}")
    private int resetValidMinutes;

    @Value("${app.email-otp.valid-minutes:10}")
    private int emailOtpValidMinutes;

    @Value("${app.email-otp.max-attempts:5}")
    private int otpMaxAttempts;

    @Value("${app.email-otp.resend-cooldown-seconds:60}")
    private int otpResendCooldownSeconds;

    @Value("${app.email-otp.max-sends-per-hour:5}")
    private int otpMaxSendsPerHour;

    @Value("${app.registration.enabled:true}")
    private boolean registrationEnabled;

    @Value("${app.demo.quick-login:false}")
    private boolean demoQuickLogin;

    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    /** Cấu hình công khai cho trang đăng nhập / đăng ký. */
    @Transactional(readOnly = true)
    public AuthOptions options() {
        List<DemoAccount> demo = !demoQuickLogin ? List.of() : DemoAccounts.ALL.stream()
                .filter(a -> userRepository.findByEmailIgnoreCase(a.email())
                        .filter(u -> u.getStatus() == UserStatus.ACTIVE && u.getRole() == a.role())
                        .isPresent())
                .toList();
        return new AuthOptions(registrationEnabled, demo);
    }

    /**
     * Hội viên tự đăng ký. Vai trò luôn là MEMBER, trạng thái ACTIVE; chưa có gói tập (mua tại quầy).
     * Không tự đăng nhập: người dùng quay lại trang đăng nhập với email vừa tạo.
     */
    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        if (!registrationEnabled) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Đăng ký trực tuyến đang tạm đóng, vui lòng liên hệ quầy lễ tân");
        }
        if (!req.acceptTerms()) {
            throw ApiException.badRequest("Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật");
        }
        if (!req.password().equals(req.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu nhập lại không khớp");
        }
        String phone = Mappers.blankToNull(req.phone());
        if (phone != null && userRepository.existsByPhoneIn(phoneVariants(phone))) {
            throw ApiException.conflict("Số điện thoại đã được dùng cho một tài khoản khác");
        }
        UserService.Created c = userService.createAccount(req.email(), req.fullName(), req.phone(), req.password(), Role.MEMBER);
        c.user().setEmailVerifiedAt(null);
        memberService.createSelfRegistered(c.user());
        issueVerificationCode(c.user());
        return new RegisterResponse("Đăng ký thành công. Vui lòng nhập mã OTP đã gửi đến email để xác thực tài khoản.", c.user().getEmail());
    }

    @Transactional
    public LoginResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        Optional<User> found = userRepository.findByEmailIgnoreCase(email);
        if (found.isEmpty() || !passwordEncoder.matches(req.password(), found.get().getPasswordHash())) {
            auditService.logAs(found.map(User::getId).orElse(null), email, "LOGIN_FAILED", "USER",
                    found.map(User::getId).orElse(null), "Sai email hoặc mật khẩu", false);
            throw ApiException.unauthorized(BAD_LOGIN);
        }
        User user = found.get();
        if (user.getStatus() == UserStatus.LOCKED) {
            auditService.logAs(user.getId(), email, "LOGIN_FAILED", "USER", user.getId(), "Tài khoản đang bị khoá", false);
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá, vui lòng liên hệ quản lý");
        }
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email chưa được xác thực. Vui lòng nhập mã OTP đã gửi đến email.");
        }
        user.setLastLoginAt(LocalDateTime.now(clock));
        auditService.logAs(user.getId(), user.getEmail(), "LOGIN", "USER", user.getId(), null, true);
        return new LoginResponse(jwtService.generate(user), jwtService.getExpirationMinutes(), me(user));
    }

    @Transactional(readOnly = true)
    public MeResponse me(AuthUser principal) {
        return me(userRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("tài khoản")));
    }

    private MeResponse me(User u) {
        Long memberId = u.getRole() == Role.MEMBER ? memberRepository.findByUserId(u.getId()).map(Member::getId).orElse(null) : null;
        Long trainerId = u.getRole() == Role.TRAINER ? trainerRepository.findByUserId(u.getId()).map(Trainer::getId).orElse(null) : null;
        return new MeResponse(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(), memberId, trainerId,
                u.getLastLoginAt(), u.getAvatarUpdatedAt());
    }

    @Transactional
    public MeResponse updateProfile(AuthUser principal, UpdateProfileRequest req) {
        User u = userRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("tài khoản"));
        String phone = Mappers.blankToNull(req.phone());
        if (phone != null && userRepository.existsByPhoneInAndIdNot(phoneVariants(phone), u.getId())) {
            throw ApiException.conflict("Số điện thoại đã được dùng cho một tài khoản khác");
        }
        u.setFullName(req.fullName().trim());
        u.setPhone(phone);
        auditService.log("PROFILE_UPDATE", "USER", u.getId(), null);
        return me(u);
    }

    @Transactional
    public void changePassword(AuthUser principal, ChangePasswordRequest req) {
        User u = userRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("tài khoản"));
        if (!passwordEncoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw ApiException.badRequest("Mật khẩu hiện tại không đúng");
        }
        if (passwordEncoder.matches(req.newPassword(), u.getPasswordHash())) {
            throw ApiException.badRequest("Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        u.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        auditService.log("PASSWORD_CHANGE", "USER", u.getId(), null);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void verifyEmail(VerifyEmailRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn"));
        if (user.getEmailVerifiedAt() != null) return;
        EmailVerificationToken token = verificationTokenRepository
                .findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn"));
        LocalDateTime now = LocalDateTime.now(clock);
        verifyOtp(token.getExpiresAt(), token.getFailedAttempts(), token::setFailedAttempts, token::setUsedAt,
                token.getCodeHash(), req.code(), now);
        token.setUsedAt(now);
        verificationTokenRepository.save(token);
        verificationTokenRepository.invalidateActiveTokens(user, now);
        user.setEmailVerifiedAt(now);
        auditService.logAs(user.getId(), user.getEmail(), "EMAIL_VERIFY", "USER", user.getId(), null, true);
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest req) {
        userRepository.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> u.getEmailVerifiedAt() == null && u.getStatus() == UserStatus.ACTIVE)
                .ifPresent(this::issueVerificationCode);
    }

    /** Luôn trả cùng một thông báo để không lộ email nào đã đăng ký. */
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        String generic = "Nếu email tồn tại trong hệ thống, mã khôi phục đã được gửi.";
        Optional<User> found = userRepository.findByEmailIgnoreCase(req.email().trim());
        if (found.isEmpty() || found.get().getStatus() == UserStatus.LOCKED
                || found.get().getEmailVerifiedAt() == null) {
            return new ForgotPasswordResponse(generic, resetValidMinutes);
        }
        User u = found.get();
        LocalDateTime now = LocalDateTime.now(clock);
        if (!canSendResetOtp(u, now)) return new ForgotPasswordResponse(generic, resetValidMinutes);
        resetTokenRepository.invalidateActiveTokens(u, now);
        String code = newOtp();
        PasswordResetToken t = new PasswordResetToken();
        t.setUser(u);
        t.setTokenHash(passwordEncoder.encode(code));
        t.setExpiresAt(now.plusMinutes(resetValidMinutes));
        resetTokenRepository.save(t);
        auditService.logAs(u.getId(), u.getEmail(), "PASSWORD_RESET_REQUEST", "USER", u.getId(), null, true);
        emailService.sendPasswordResetCode(u.getEmail(), code, resetValidMinutes);
        return new ForgotPasswordResponse(generic, resetValidMinutes);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void resetPassword(ResetPasswordRequest req) {
        User u = userRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn"));
        if (u.getEmailVerifiedAt() == null) {
            throw ApiException.badRequest("Email chưa được xác thực, không thể đặt lại mật khẩu");
        }
        PasswordResetToken t = resetTokenRepository
                .findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(u.getId())
                .orElseThrow(() -> ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn"));
        LocalDateTime now = LocalDateTime.now(clock);
        if (u.getStatus() == UserStatus.LOCKED) {
            auditService.logAs(u.getId(), u.getEmail(), "PASSWORD_RESET_FAILED", "USER", u.getId(), "Tài khoản đang bị khoá", false);
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá, vui lòng liên hệ quản lý");
        }
        if (t.getUsedAt() != null) {
            throw ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn");
        }
        if (t.getExpiresAt().isBefore(now)) {
            t.setUsedAt(now);
            throw ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn");
        }
        if (t.getFailedAttempts() >= maxOtpAttempts()) {
            throw ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn");
        }
        if (!passwordEncoder.matches(req.code(), t.getTokenHash())) {
            t.setFailedAttempts(t.getFailedAttempts() + 1);
            if (t.getFailedAttempts() >= maxOtpAttempts()) t.setUsedAt(now);
            resetTokenRepository.save(t);
            throw ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn");
        }
        u.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        resetTokenRepository.invalidateActiveTokens(u, now);
        auditService.logAs(u.getId(), u.getEmail(), "PASSWORD_RESET", "USER", u.getId(), null, true);
    }

    private void issueVerificationCode(User user) {
        LocalDateTime now = LocalDateTime.now(clock);
        if (!canSendVerificationOtp(user, now)) return;
        verificationTokenRepository.invalidateActiveTokens(user, now);
        String code = newOtp();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setCodeHash(passwordEncoder.encode(code));
        token.setExpiresAt(now.plusMinutes(emailOtpValidMinutes));
        verificationTokenRepository.save(token);
        emailService.sendVerificationCode(user.getEmail(), code, emailOtpValidMinutes);
    }

    private boolean canSendVerificationOtp(User user, LocalDateTime now) {
        LocalDateTime oneHourAgo = now.minusHours(1);
        if (verificationTokenRepository.countByUser_IdAndCreatedAtAfter(user.getId(), oneHourAgo) >= otpMaxSendsPerHour) {
            return false;
        }
        return verificationTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
                .filter(token -> token.getCreatedAt().plusSeconds(otpResendCooldownSeconds).isAfter(now))
                .isEmpty();
    }

    private boolean canSendResetOtp(User user, LocalDateTime now) {
        LocalDateTime oneHourAgo = now.minusHours(1);
        if (resetTokenRepository.countByUser_IdAndCreatedAtAfter(user.getId(), oneHourAgo) >= otpMaxSendsPerHour) {
            return false;
        }
        return resetTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
                .filter(token -> token.getCreatedAt().plusSeconds(otpResendCooldownSeconds).isAfter(now))
                .isEmpty();
    }

    private void verifyOtp(LocalDateTime expiresAt, int failedAttempts,
                           java.util.function.IntConsumer incrementAttempts,
                           java.util.function.Consumer<LocalDateTime> markUsed,
                           String hash, String code, LocalDateTime now) {
        if (expiresAt.isBefore(now) || failedAttempts >= maxOtpAttempts()) {
            markUsed.accept(now);
            throw ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn");
        }
        if (!passwordEncoder.matches(code, hash)) {
            incrementAttempts.accept(failedAttempts + 1);
            if (failedAttempts + 1 >= maxOtpAttempts()) markUsed.accept(now);
            throw ApiException.badRequest("Mã OTP không đúng hoặc đã hết hạn");
        }
    }

    private static String newOtp() {
        return String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    private int maxOtpAttempts() {
        return Math.max(1, Math.min(5, otpMaxAttempts));
    }
    /** 0912345678 và +84912345678 là cùng một số. */
    static List<String> phoneVariants(String phone) {
        String p = phone.trim();
        if (p.startsWith("+84")) return List.of(p, "0" + p.substring(3));
        if (p.startsWith("0")) return List.of(p, "+84" + p.substring(1));
        return List.of(p);
    }

}
