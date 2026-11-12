package com.gymflow.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymflow.domain.*;
import com.gymflow.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock private UserRepository userRepository;
    @Mock private TrainerRepository trainerRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private MembershipPlanRepository planRepository;
    @Mock private MemberSubscriptionRepository subscriptionRepository;
    @Mock private ExerciseRepository exerciseRepository;
    @Mock private WorkoutPlanRepository workoutPlanRepository;
    @Mock private WorkoutScheduleRepository scheduleRepository;
    @Mock private WorkoutLogRepository logRepository;
    @Mock private WeightRecordRepository weightRepository;
    @Mock private AuditLogRepository auditRepository;
    @Mock private ArticleRepository articleRepository;
    @Mock private ContentSourceRepository sourceRepository;
    @Mock private PasswordEncoder encoder;
    @Mock private JdbcTemplate jdbc;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-12T10:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));

    private DataSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new DataSeeder(
                userRepository, trainerRepository, memberRepository, planRepository,
                subscriptionRepository, exerciseRepository, workoutPlanRepository,
                scheduleRepository, logRepository, weightRepository, auditRepository,
                articleRepository, sourceRepository, objectMapper, encoder, jdbc, clock
        );
        ReflectionTestUtils.setField(seeder, "enabled", true);
    }

    @Test
    @DisplayName("SCRUM-221: DataSeeder nạp bài viết mẫu từ seed/articles.json khi CSDL trống")
    void testDataSeederLoadsArticlesFromJson() {
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(planRepository.save(any(MembershipPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(trainerRepository.save(any(Trainer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));
        when(subscriptionRepository.save(any(MemberSubscription.class))).thenAnswer(inv -> inv.getArgument(0));
        when(workoutPlanRepository.save(any(WorkoutPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(WorkoutSchedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(encoder.encode(anyString())).thenReturn("hashed-pass");
        when(exerciseRepository.findFirstByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(exerciseRepository.save(any(Exercise.class))).thenAnswer(inv -> {
            Exercise e = inv.getArgument(0);
            e.setId(10L);
            return e;
        });
        when(articleRepository.existsBySlug(anyString())).thenReturn(false);

        seeder.run(new DefaultApplicationArguments());

        // Kiểm tra bài viết đã được lưu qua articleRepository
        ArgumentCaptor<Article> articleCaptor = ArgumentCaptor.forClass(Article.class);
        verify(articleRepository, atLeast(6)).save(articleCaptor.capture());

        var savedArticles = articleCaptor.getAllValues();
        assertThat(savedArticles).extracting(Article::getSlug)
                .contains("dia-an-can-bang", "uong-du-nuoc", "ngu-ngon-hon", "khoi-dong-truoc-tap", "gian-co-sau-tap", "van-dong-bao-nhieu-la-du");

        for (Article a : savedArticles) {
            assertThat(a.getTitle()).isNotBlank();
            assertThat(a.getCategory()).isNotNull();
            assertThat(a.getContentOrigin()).isNotNull();
            assertThat(a.getAuthor()).isNotNull();
            assertThat(a.getSources()).isNotEmpty();
        }
    }

    @Test
    @DisplayName("SCRUM-221: Khi đã có User nhưng chưa có Article, tự động nạp articles.json")
    void testDataSeederSeedsArticlesWhenUsersExistButArticlesEmpty() {
        when(userRepository.count()).thenReturn(10L);
        when(articleRepository.count()).thenReturn(0L);

        User admin = new User();
        admin.setId(1L);
        admin.setEmail(DemoAccounts.ADMIN.email());
        when(userRepository.findByEmailIgnoreCase(DemoAccounts.ADMIN.email())).thenReturn(Optional.of(admin));
        when(articleRepository.existsBySlug(anyString())).thenReturn(false);

        seeder.run(new DefaultApplicationArguments());

        verify(articleRepository, atLeast(6)).save(any(Article.class));
    }
}
