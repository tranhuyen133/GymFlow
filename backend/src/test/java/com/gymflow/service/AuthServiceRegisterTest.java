package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.config.DemoAccounts;
import com.gymflow.domain.Member;
import com.gymflow.domain.EmailVerificationToken;
import com.gymflow.domain.PasswordResetToken;
import com.gymflow.domain.Role;
import com.gymflow.domain.User;
import com.gymflow.domain.UserStatus;
import com.gymflow.dto.Dtos.AuthOptions;
import com.gymflow.dto.Dtos.ForgotPasswordRequest;
import com.gymflow.dto.Dtos.ForgotPasswordResponse;
import com.gymflow.dto.Dtos.RegisterRequest;
import com.gymflow.dto.Dtos.RegisterResponse;
import com.gymflow.dto.Dtos.ResetPasswordRequest;
import com.gymflow.dto.Dtos.VerifyEmailRequest;
import com.gymflow.repository.EmailVerificationTokenRepository;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.PasswordResetTokenRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceRegisterTest {

    @Mock UserRepository userRepository;
    @Mock MemberRepository memberRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock PasswordResetTokenRepository resetTokenRepository;
    @Mock EmailVerificationTokenRepository verificationTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuditService auditService;
    @Mock UserService userService;
    @Mock MemberService memberService;
    @Mock EmailService emailService;

    AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(userRepository, memberRepository, trainerRepository, resetTokenRepository,
                verificationTokenRepository, passwordEncoder, jwtService, auditService, userService, memberService,
                emailService, Clock.systemDefaultZone());
        ReflectionTestUtils.setField(service, "registrationEnabled", true);
        ReflectionTestUtils.setField(service, "demoQuickLogin", true);
        ReflectionTestUtils.setField(service, "otpMaxAttempts", 5);
        ReflectionTestUtils.setField(service, "otpMaxSendsPerHour", 5);
        ReflectionTestUtils.setField(service, "otpResendCooldownSeconds", 60);
        ReflectionTestUtils.setField(service, "resetValidMinutes", 30);
        ReflectionTestUtils.setField(service, "emailOtpValidMinutes", 10);
    }

    private static RegisterRequest req(String pw, String confirm, boolean terms) {
        return new RegisterRequest("Nguyễn Văn A", "New.Member@Example.com", "0912345678", pw, confirm, terms);
    }

    @Test
    void registerAlwaysCreatesMemberRole() {
        User u = new User();
        u.setId(50L);
        u.setEmail("new.member@example.com");
        u.setRole(Role.MEMBER);
        when(userService.createAccount(anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new UserService.Created(u, null));
        when(memberService.createSelfRegistered(u)).thenReturn(new Member());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        RegisterResponse res = service.register(req("Strong123", "Strong123", true));

        verify(userService).createAccount("New.Member@Example.com", "Nguyễn Văn A", "0912345678", "Strong123", Role.MEMBER);
        verify(memberService).createSelfRegistered(u);
        assertThat(u.getEmailVerifiedAt()).isNull();
        verify(emailService).sendVerificationCode(eq(u.getEmail()), anyString(), anyInt());
        assertThat(res.email()).isEqualTo("new.member@example.com");
    }

    @Test
    void registerRejectsMismatchedConfirmation() {
        assertThatThrownBy(() -> service.register(req("Strong123", "Strong124", true)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("không khớp");
        verifyNoInteractions(userService, memberService);
    }

    @Test
    void registerRequiresTerms() {
        assertThatThrownBy(() -> service.register(req("Strong123", "Strong123", false)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Điều khoản");
        verifyNoInteractions(userService, memberService);
    }

    @Test
    void registerBlockedWhenDisabled() {
        ReflectionTestUtils.setField(service, "registrationEnabled", false);
        assertThatThrownBy(() -> service.register(req("Strong123", "Strong123", true)))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(userService, memberService);
    }

    @Test
    void duplicateEmailConflictPropagatesAndNoMemberIsCreated() {
        when(userService.createAccount(anyString(), anyString(), anyString(), anyString(), any()))
                .thenThrow(ApiException.conflict("Email đã được sử dụng"));
        assertThatThrownBy(() -> service.register(req("Strong123", "Strong123", true)))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verifyNoInteractions(memberService);
    }

    @Test
    void optionsListOnlyDemoAccountsThatExistAndAreActive() {
        User admin = user(DemoAccounts.ADMIN.email(), Role.ADMIN, UserStatus.ACTIVE);
        User lockedTrainer = user(DemoAccounts.TRAINER.email(), Role.TRAINER, UserStatus.LOCKED);
        when(userRepository.findByEmailIgnoreCase(DemoAccounts.ADMIN.email())).thenReturn(Optional.of(admin));
        when(userRepository.findByEmailIgnoreCase(DemoAccounts.TRAINER.email())).thenReturn(Optional.of(lockedTrainer));
        when(userRepository.findByEmailIgnoreCase(DemoAccounts.MEMBER.email())).thenReturn(Optional.empty());

        AuthOptions o = service.options();

        assertThat(o.registrationEnabled()).isTrue();
        assertThat(o.demoAccounts()).extracting(a -> a.email()).containsExactly(DemoAccounts.ADMIN.email());
    }

    @Test
    void optionsHideDemoAccountsWhenQuickLoginOff() {
        ReflectionTestUtils.setField(service, "demoQuickLogin", false);
        assertThat(service.options().demoAccounts()).isEmpty();
        verifyNoInteractions(userRepository);
    }

    // ---------- Forgot password & Reset password (SCRUM-135) ----------

    @Test
    void forgotPasswordSendsOtpOnlyForVerifiedAccountAndNeverReturnsIt() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        when(userRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-otp");

        ForgotPasswordResponse response = service.forgotPassword(new ForgotPasswordRequest("member@example.com"));

        assertThat(response.message()).isEqualTo("Nếu email tồn tại trong hệ thống, mã khôi phục đã được gửi.");
        verify(resetTokenRepository).save(argThat(token -> token.getTokenHash().equals("hashed-otp")
                && token.getExpiresAt().isAfter(LocalDateTime.now())));
        verify(emailService).sendPasswordResetCode(eq(user.getEmail()), argThat(code -> code.matches("\\d{6}")), anyInt());
        verify(userRepository).findByEmailIgnoreCase("member@example.com");
    }

    @Test
    void forgotPasswordDoesNotSendForUnverifiedAccount() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        user.setEmailVerifiedAt(null);
        when(userRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(user));

        service.forgotPassword(new ForgotPasswordRequest("member@example.com"));

        verifyNoInteractions(emailService);
        verifyNoInteractions(resetTokenRepository);
    }

    @Test
    void resetPasswordAcceptsHashedOtpAndRejectsReuse() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash("hashed-otp");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(resetTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(10L)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("123456", "hashed-otp")).thenReturn(true);
        when(passwordEncoder.encode("NewPass123")).thenReturn("hashed-password");
        doAnswer(invocation -> {
            token.setUsedAt(invocation.getArgument(1));
            return 1;
        }).when(resetTokenRepository).invalidateActiveTokens(eq(user), any(LocalDateTime.class));

        service.resetPassword(new ResetPasswordRequest(user.getEmail(), "123456", "NewPass123"));

        assertThat(user.getPasswordHash()).isEqualTo("hashed-password");
        assertThat(token.getUsedAt()).isNotNull();
        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(user.getEmail(), "123456", "NewPass123")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("không đúng hoặc đã hết hạn");
    }

    @Test
    void wrongResetOtpIncrementsAttemptsAndLocksChallengeAfterLimit() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash("hashed-otp");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(resetTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(10L)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("111111", "hashed-otp")).thenReturn(false);

        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(user.getEmail(), "111111", "NewPass123")))
                    .isInstanceOf(ApiException.class);
        }

        assertThat(token.getFailedAttempts()).isEqualTo(5);
        assertThat(token.getUsedAt()).isNotNull();
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void resetPasswordRejectsUnverifiedEmail() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        user.setEmailVerifiedAt(null);
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(user.getEmail(), "123456", "NewPass123")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("chưa được xác thực");
        verifyNoInteractions(resetTokenRepository);
    }

    @Test
    void verifyEmailAcceptsValidOtpOnce() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        user.setEmailVerifiedAt(null);
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setCodeHash("hashed-otp");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(verificationTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(10L))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.matches("123456", "hashed-otp")).thenReturn(true);

        service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "123456"));

        assertThat(user.getEmailVerifiedAt()).isNotNull();
        assertThat(token.getUsedAt()).isNotNull();
        verify(auditService).logAs(eq(10L), eq(user.getEmail()), eq("EMAIL_VERIFY"),
                eq("USER"), eq(10L), isNull(), eq(true));
    }

    @Test
    void failedEmailOtpConsumesAttempts() {
        User user = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        user.setId(10L);
        user.setEmailVerifiedAt(null);
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setCodeHash("hashed-otp");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(verificationTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(10L))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.matches("111111", "hashed-otp")).thenReturn(false);

        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.verifyEmail(new VerifyEmailRequest(user.getEmail(), "111111")))
                    .isInstanceOf(ApiException.class);
        }

        assertThat(token.getFailedAttempts()).isEqualTo(5);
        assertThat(token.getUsedAt()).isNotNull();
        assertThat(user.getEmailVerifiedAt()).isNull();
    }

    @Test
    void forgotPasswordWithNonExistentEmailReturnsGenericMessage() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

        ForgotPasswordResponse response = service.forgotPassword(new ForgotPasswordRequest("nobody@example.com"));

        assertThat(response.message()).isEqualTo("Nếu email tồn tại trong hệ thống, mã khôi phục đã được gửi.");
        verifyNoInteractions(resetTokenRepository, emailService);
    }

    @Test
    void resetPasswordWithLockedUserIsRejected() {
        User locked = user("locked@example.com", Role.MEMBER, UserStatus.LOCKED);
        locked.setId(99L);
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(locked);
        token.setTokenHash("hash");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        when(userRepository.findByEmailIgnoreCase(locked.getEmail())).thenReturn(Optional.of(locked));
        when(resetTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(99L)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(locked.getEmail(), "123456", "NewPass123")))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getMessage()).contains("Tài khoản đã bị khoá");
                });
        verify(passwordEncoder, never()).encode(anyString());
    }

    private static User user(String email, Role role, UserStatus status) {
        User u = new User();
        u.setEmail(email);
        u.setRole(role);
        u.setStatus(status);
        u.setEmailVerifiedAt(LocalDateTime.now());
        return u;
    }
}
