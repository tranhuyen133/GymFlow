package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.PromotionValidationResponse;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/** V49 · Ưu đãi theo đối tượng: sinh nhật, chỉ khi nâng cấp; tự áp dụng chọn ưu đãi giảm nhiều nhất. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PromotionAudienceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 16, 10, 0);
    private static final AuthUser MEMBER_USER = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hội viên");

    @Mock PromotionRepository promotionRepository;
    @Mock MembershipPlanRepository planRepository;
    @Mock ServiceItemRepository serviceItemRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    PromotionService service;
    Member member;
    MembershipPlan pt;

    @BeforeEach
    void setUp() {
        service = new PromotionService(promotionRepository, planRepository, serviceItemRepository, subscriptionRepository,
                access, auditService, mappers, Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE));
        member = new Member();
        member.setId(100L);
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(subscriptionRepository.countByMemberId(100L)).thenReturn(2L);
        pt = new MembershipPlan();
        pt.setId(7L);
        pt.setName("Gym + PT 8 buổi");
        pt.setPrice(2_900_000L);
        pt.setPlanType(PlanType.GYM_PT);
    }

    private Promotion promo(Long id, String code, PromotionAudience audience, DiscountType type, long value) {
        Promotion p = new Promotion();
        p.setId(id);
        p.setCode(code);
        p.setName("Ưu đãi " + id);
        p.setAudience(audience);
        p.setDiscountType(type);
        p.setDiscountValue(value);
        p.setStartsAt(NOW.minusDays(10));
        p.setEndsAt(NOW.plusDays(10));
        p.setActive(true);
        return p;
    }

    @Test
    @DisplayName("Ưu đãi sinh nhật: đúng tháng sinh thì được, khác tháng hoặc chưa có ngày sinh thì báo rõ lý do")
    void birthday() {
        Promotion bd = promo(1L, null, PromotionAudience.BIRTHDAY, DiscountType.PERCENT, 15);
        member.setDateOfBirth(LocalDate.of(1999, 11, 3));
        PromotionValidationResponse ok = service.checkEligibility(MEMBER_USER, bd, pt, NOW, 1_000_000, false);
        assertThat(ok.valid()).isTrue();
        assertThat(ok.discountAmount()).isEqualTo(150_000);

        member.setDateOfBirth(LocalDate.of(1999, 5, 3));
        PromotionValidationResponse wrongMonth = service.checkEligibility(MEMBER_USER, bd, pt, NOW, 1_000_000, false);
        assertThat(wrongMonth.valid()).isFalse();
        assertThat(wrongMonth.reason()).contains("tháng 5");

        member.setDateOfBirth(null);
        assertThat(service.checkEligibility(MEMBER_USER, bd, pt, NOW, 1_000_000, false).reason()).contains("ngày sinh");
    }

    @Test
    @DisplayName("Ưu đãi nâng cấp chỉ dùng được khi nâng cấp, tính trên số tiền còn phải trả sau bù trừ")
    void upgradeOnly() {
        Promotion up = promo(2L, "LENPT300", PromotionAudience.UPGRADE, DiscountType.AMOUNT, 300_000);
        when(promotionRepository.findByCodeIgnoreCase("LENPT300")).thenReturn(Optional.of(up));

        PromotionValidationResponse normal = service.validateFor(MEMBER_USER, "LENPT300", pt, 2_900_000, false);
        assertThat(normal.valid()).isFalse();
        assertThat(normal.reason()).contains("nâng cấp");

        PromotionValidationResponse upgrade = service.validateFor(MEMBER_USER, "LENPT300", pt, 2_650_000, true);
        assertThat(upgrade.valid()).isTrue();
        assertThat(upgrade.originalPrice()).isEqualTo(2_650_000);
        assertThat(upgrade.finalPrice()).isEqualTo(2_350_000);
    }

    @Test
    @DisplayName("Không nhập mã: chọn ưu đãi tự áp dụng giảm nhiều nhất trong số hội viên đủ điều kiện")
    void bestAutoPromotion() {
        member.setDateOfBirth(LocalDate.of(2000, 11, 20));
        Promotion small = promo(3L, null, PromotionAudience.UPGRADE, DiscountType.PERCENT, 10);
        Promotion birthday = promo(4L, null, PromotionAudience.BIRTHDAY, DiscountType.PERCENT, 15);
        Promotion expired = promo(5L, null, PromotionAudience.ALL, DiscountType.PERCENT, 50);
        expired.setEndsAt(NOW.minusDays(1));
        when(promotionRepository.findByCodeIsNullAndActiveTrue()).thenReturn(List.of(small, birthday, expired));

        PromotionValidationResponse best = service.validateFor(MEMBER_USER, null, pt, 2_000_000, true);
        assertThat(best.promotionId()).isEqualTo(4L);
        assertThat(best.discountAmount()).isEqualTo(300_000);

        // Đăng ký thường: ưu đãi nâng cấp bị loại, vẫn còn ưu đãi sinh nhật
        assertThat(service.validateFor(MEMBER_USER, null, pt, 2_000_000, false).promotionId()).isEqualTo(4L);
    }

    @Test
    @DisplayName("birthdayProblem: null khi đúng tháng")
    void birthdayProblemHelper() {
        assertThat(PromotionService.birthdayProblem(LocalDate.of(1990, 11, 30), LocalDate.of(2026, 11, 1))).isNull();
        assertThat(PromotionService.birthdayProblem(LocalDate.of(1990, 12, 1), LocalDate.of(2026, 11, 30))).isNotNull();
    }
}
