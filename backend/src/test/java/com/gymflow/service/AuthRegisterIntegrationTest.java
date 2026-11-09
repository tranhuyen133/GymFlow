/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền) · Test tích hợp đăng ký hội viên không bị deadlock
 */
package com.gymflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymflow.domain.AuditLog;
import com.gymflow.domain.Member;
import com.gymflow.domain.Role;
import com.gymflow.domain.User;
import com.gymflow.dto.Dtos.RegisterRequest;
import com.gymflow.repository.AuditLogRepository;
import com.gymflow.repository.EmailVerificationTokenRepository;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthRegisterIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("gymflow")
            .withUsername("gymflow")
            .withPassword("gymflow_dev_password");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired AuditLogRepository auditLogRepository;
    @Autowired EmailVerificationTokenRepository verificationTokenRepository;
    @Autowired JdbcTemplate jdbcTemplate;
    @MockBean EmailService emailService;

    private String testEmail;

    @AfterEach
    void tearDown() {
        if (testEmail != null) {
            userRepository.findByEmailIgnoreCase(testEmail).ifPresent(u -> {
                memberRepository.findByUserId(u.getId()).ifPresent(memberRepository::delete);
                jdbcTemplate.update("DELETE FROM audit_logs WHERE actor_id = ?", u.getId());
                userRepository.delete(u);
            });
        }
    }

    @Test
    @DisplayName("POST /api/auth/register trả về 201 trong dưới 5 giây, tạo bản ghi users, members và audit_logs đúng actor_id")
    void register_completesUnder5Seconds_andCreatesUserMemberAndAuditLog() {
        testEmail = "test.member." + System.currentTimeMillis() + "@gymflow.test";
        RegisterRequest req = new RegisterRequest(
                "Nguyễn Văn Test",
                testEmail,
                "09" + String.format("%08d", System.currentTimeMillis() % 100_000_000L),
                "Password123",
                "Password123",
                true
        );

        assertTimeoutPreemptively(Duration.ofSeconds(5), () -> {
            long startTime = System.currentTimeMillis();

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.email").value(testEmail.toLowerCase()));

            long elapsed = System.currentTimeMillis() - startTime;
            assertThat(elapsed).as("Thời gian phản hồi phải dưới 5 giây").isLessThan(5000);
        });

        // 1. Kiểm tra bản ghi users
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(testEmail);
        assertThat(userOpt).as("Bảng users phải có bản ghi mới").isPresent();
        User user = userOpt.get();
        assertThat(user.getRole()).isEqualTo(Role.MEMBER);
        assertThat(user.getFullName()).isEqualTo("Nguyễn Văn Test");
        assertThat(user.getEmailVerifiedAt()).isNull();
        assertThat(verificationTokenRepository.findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId()))
                .isPresent()
                .get()
                .extracting(token -> token.getCodeHash())
                .isNotEqualTo(req.email());

        // 2. Kiểm tra bản ghi members
        Optional<Member> memberOpt = memberRepository.findByUserId(user.getId());
        assertThat(memberOpt).as("Bảng members phải có bản ghi mới gắn với user vừa tạo").isPresent();
        Member member = memberOpt.get();
        assertThat(member.getCode()).isNotBlank();

        // 3. Kiểm tra bản ghi audit_logs
        List<AuditLog> auditLogs = auditLogRepository.findAll().stream()
                .filter(a -> "MEMBER_SELF_REGISTER".equals(a.getAction()) && Objects.equals(a.getActorId(), user.getId()))
                .toList();
        assertThat(auditLogs).as("Bảng audit_logs phải có dòng MEMBER_SELF_REGISTER với actor_id đúng").hasSize(1);

        AuditLog log = auditLogs.get(0);
        assertThat(log.getActorEmail()).isEqualTo(user.getEmail());
        assertThat(log.getTargetType()).isEqualTo("MEMBER");
        assertThat(log.getTargetId()).isEqualTo(String.valueOf(member.getId()));
        assertThat(log.getDetail()).contains(member.getCode());
        assertThat(log.isSuccess()).isTrue();
    }
}
