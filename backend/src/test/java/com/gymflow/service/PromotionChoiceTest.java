package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.PromotionValidateRequest;
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

/** Hội viên tự chọn ưu đãi: không nhập mã thì không tự áp; danh sách ưu đãi không cần mã xếp giảm nhiều nhất trước. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PromotionChoiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 17, 10, 0);
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
    MembershipPlan plan;

    @BeforeEach
    void setUp() {
        service = new PromotionService(promotionRepository, planRepository, serviceItemRepository, subscriptionRepository,
                access, auditService, mappers, Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE));
        member = new Member();
        member.setId(100L);
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(subscriptionRepository.countByMemberId(100L)).thenReturn(1L);
        plan = new MembershipPlan();
        plan.setId(2L);
        plan.setName("Gói 1 tháng");
        plan.setPrice(500_000L);
        plan.setPlanType(PlanType.GYM);
        when(planRepository.findById(2L)).thenReturn(Optional.of(plan));
    }

    private Promotion promo(Long id, String code, PromotionAudience audience, long percent) {
        Promotion p = new Promotion();
        p.setId(id);
        p.setCode(code);
        p.setName("Ưu đãi " + id);
        p.setAudience(audience);
        p.setDiscountType(DiscountType.PERCENT);
        p.setDiscountValue(percent);
        p.setStartsAt(NOW.minusDays(5));
        p.setEndsAt(NOW.plusDays(5));
        p.setActive(true);
        return p;
    }

    @Test
    @DisplayName("Không nhập mã: giữ nguyên giá, không tự áp ưu đãi nào")
    void noCodeMeansNoDiscount() {
        when(promotionRepository.findByCodeIsNullAndActiveTrue()).thenReturn(List.of(promo(1L, null, PromotionAudience.ALL, 20)));
        PromotionValidationResponse r = service.validate(MEMBER_USER, new PromotionValidateRequest("  ", 2L));
        assertThat(r.valid()).isTrue();
        assertThat(r.promotionId()).isNull();
        assertThat(r.discountAmount()).isZero();
        assertThat(r.finalPrice()).isEqualTo(500_000L);
    }

    @Test
    @DisplayName("Danh sách ưu đãi để chọn: chỉ ưu đãi đủ điều kiện, giảm nhiều nhất đứng đầu")
    void offersSortedAndFiltered() {
        Promotion small = promo(1L, null, PromotionAudience.ALL, 5);
        Promotion big = promo(2L, null, PromotionAudience.ALL, 15);
        Promotion upgradeOnly = promo(3L, null, PromotionAudience.UPGRADE, 30);
        when(promotionRepository.findByCodeIsNullAndActiveTrue()).thenReturn(List.of(small, big, upgradeOnly));

        List<PromotionValidationResponse> offers = service.offers(MEMBER_USER, 2L);
        assertThat(offers).extracting(PromotionValidationResponse::promotionId).containsExactly(2L, 1L);
        assertThat(offers.get(0).finalPrice()).isEqualTo(425_000L);

        assertThat(service.offers(MEMBER_USER, plan, 400_000L, true))
                .extracting(PromotionValidationResponse::promotionId).containsExactly(3L, 2L, 1L);
    }

    @Test
    @DisplayName("Chọn ưu đãi trong danh sách: kiểm tra lại điều kiện; ưu đãi có mã thì phải nhập mã")
    void validateChosenOffer() {
        Promotion auto = promo(1L, null, PromotionAudience.ALL, 10);
        Promotion coded = promo(2L, "LENPT300", PromotionAudience.ALL, 10);
        Promotion ended = promo(3L, null, PromotionAudience.ALL, 10);
        ended.setEndsAt(NOW.minusDays(1));
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(auto));
        when(promotionRepository.findById(2L)).thenReturn(Optional.of(coded));
        when(promotionRepository.findById(3L)).thenReturn(Optional.of(ended));

        PromotionValidationResponse ok = service.validateOffer(MEMBER_USER, 1L, plan, 500_000L, false);
        assertThat(ok.valid()).isTrue();
        assertThat(ok.discountAmount()).isEqualTo(50_000L);

        assertThat(service.validateOffer(MEMBER_USER, 2L, plan, 500_000L, false).reason()).contains("cần nhập mã");
        assertThat(service.validateOffer(MEMBER_USER, 3L, plan, 500_000L, false).reason()).contains("đã kết thúc");
        assertThat(service.validateOffer(MEMBER_USER, 9L, plan, 500_000L, false).valid()).isFalse();
    }
}
