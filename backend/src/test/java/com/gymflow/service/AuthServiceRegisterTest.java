package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.Secrets;
import com.gymflow.config.DemoAccounts;
import com.gymflow.domain.Member;
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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceRegisterTest {

    @Mock UserRepository userRepository;
    @Mock MemberRepository memberRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock PasswordResetTokenRepository resetTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuditService auditService;
    @Mock UserService userService;
    @Mock MemberService memberService;

    AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(userRepository, memberRepository, trainerRepository, resetTokenRepository,
                passwordEncoder, jwtService, auditService, userService, memberService, Clock.systemDefaultZone());
        ReflectionTestUtils.setField(service, "registrationEnabled", true);
        ReflectionTestUtils.setField(service, "demoQuickLogin", true);
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

        RegisterResponse res = service.register(req("Strong123", "Strong123", true));

        verify(userService).createAccount("New.Member@Example.com", "Nguyễn Văn A", "0912345678", "Strong123", Role.MEMBER);
        verify(memberService).createSelfRegistered(u);
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
    void forgotPasswordCalledTwiceInvalidatesFirstToken() {
        User u = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        u.setId(10L);
        when(userRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(u));

        // Lần 1: gọi forgotPassword
        service.forgotPassword(new ForgotPasswordRequest("member@example.com"));
        verify(resetTokenRepository, times(1)).invalidateActiveTokens(eq(u), any(LocalDateTime.class));
        verify(resetTokenRepository, times(1)).save(any(PasswordResetToken.class));

        // Lần 2: gọi lại forgotPassword -> huỷ token cũ
        service.forgotPassword(new ForgotPasswordRequest("member@example.com"));
        verify(resetTokenRepository, times(2)).invalidateActiveTokens(eq(u), any(LocalDateTime.class));
        verify(resetTokenRepository, times(2)).save(any(PasswordResetToken.class));

        // Thử dùng mã lần 1 đã bị đánh dấu used_at -> bị báo lỗi "đã được sử dụng"
        PasswordResetToken token1 = new PasswordResetToken();
        token1.setUser(u);
        token1.setUsedAt(LocalDateTime.now());
        token1.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        when(resetTokenRepository.findByTokenHash(Secrets.sha256("TOKEN111"))).thenReturn(Optional.of(token1));

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("TOKEN111", "NewPass123")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã được sử dụng");
    }

    @Test
    void resetPasswordSuccessAndReuseFails() {
        User u = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        u.setId(10L);
        PasswordResetToken t = new PasswordResetToken();
        t.setUser(u);
        t.setExpiresAt(LocalDateTime.now().plusMinutes(30));

        when(resetTokenRepository.findByTokenHash(Secrets.sha256("VALIDTOK"))).thenReturn(Optional.of(t));
        when(passwordEncoder.encode("NewPass123")).thenReturn("hashedNewPass");

        // Khi invalidateActiveTokens được gọi, mô phỏng đánh dấu used_at cho token trong CSDL
        doAnswer(inv -> {
            t.setUsedAt(inv.getArgument(1));
            return 1;
        }).when(resetTokenRepository).invalidateActiveTokens(eq(u), any(LocalDateTime.class));

        // Đặt lại mật khẩu lần đầu: thành công
        service.resetPassword(new ResetPasswordRequest("VALIDTOK", "NewPass123"));
        assertThat(u.getPasswordHash()).isEqualTo("hashedNewPass");
        verify(resetTokenRepository).invalidateActiveTokens(eq(u), any(LocalDateTime.class));
        verify(auditService).logAs(eq(u.getId()), eq(u.getEmail()), eq("PASSWORD_RESET"), eq("USER"), eq(u.getId()), isNull(), eq(true));

        // Dùng lại đúng mã đó: báo lỗi "đã được sử dụng"
        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("VALIDTOK", "NewPass123")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã được sử dụng");
    }

    @Test
    void resetPasswordWithExpiredTokenThrowsException() {
        User u = user("member@example.com", Role.MEMBER, UserStatus.ACTIVE);
        PasswordResetToken t = new PasswordResetToken();
        t.setUser(u);
        t.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // hết hạn

        when(resetTokenRepository.findByTokenHash(Secrets.sha256("EXPIRED1"))).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("EXPIRED1", "NewPass123")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("hết hạn");
        verify(passwordEncoder, never()).encode(any());
        verify(resetTokenRepository, never()).invalidateActiveTokens(any(), any());
    }

    @Test
    void forgotPasswordWithNonExistentEmailReturnsGenericMessageAndNullToken() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

        ForgotPasswordResponse res = service.forgotPassword(new ForgotPasswordRequest("nobody@example.com"));

        assertThat(res.message()).isEqualTo("Nếu email tồn tại trong hệ thống, mã khôi phục đã được gửi.");
        assertThat(res.resetToken()).isNull();
        verifyNoInteractions(resetTokenRepository);
    }

    @Test
    void resetPasswordWithLockedUserRejectedWithForbidden() {
        User locked = user("locked@example.com", Role.MEMBER, UserStatus.LOCKED);
        locked.setId(99L);
        PasswordResetToken t = new PasswordResetToken();
        t.setUser(locked);
        t.setExpiresAt(LocalDateTime.now().plusMinutes(30));

        when(resetTokenRepository.findByTokenHash(Secrets.sha256("LOCKED11"))).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("LOCKED11", "NewPass123")))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(e.getMessage()).contains("Tài khoản đã bị khoá");
                });

        verify(passwordEncoder, never()).encode(any());
        verify(resetTokenRepository, never()).invalidateActiveTokens(any(), any());
        verify(auditService).logAs(eq(99L), eq("locked@example.com"), eq("PASSWORD_RESET_FAILED"), eq("USER"), eq(99L), anyString(), eq(false));
    }

    private static User user(String email, Role role, UserStatus status) {
        User u = new User();
        u.setEmail(email);
        u.setRole(role);
        u.setStatus(status);
        return u;
    }
}
