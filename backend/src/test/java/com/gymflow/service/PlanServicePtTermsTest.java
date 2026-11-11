package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.MembershipPlan;
import com.gymflow.domain.PlanType;
import com.gymflow.dto.Dtos.PlanRequest;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.MembershipPlanRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.ServiceItemRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** V24 · kiểm tra mã gói, thời lượng buổi PT, số giờ báo huỷ. Chủ file: Kiên. */
class PlanServicePtTermsTest {

    private final MembershipPlanRepository plans = mock(MembershipPlanRepository.class);
    private final PlanService service = new PlanService(plans, mock(MemberSubscriptionRepository.class),
            mock(PackageRequestRepository.class), mock(ServiceItemRepository.class), mock(AuditService.class), mock(Mappers.class));

    private static PlanRequest ptPlan(String code, Integer minutes, Integer notice) {
        return new PlanRequest("Gói PT 12 buổi", null, 3_000_000L, 90, null, true, PlanType.GYM_PT, 12, 90, null,
                code, null, minutes, notice);
    }

    @Test
    void rejectsPtSessionShorterThan15Minutes() {
        assertThatThrownBy(() -> service.create(ptPlan(null, 10, null))).isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsCancelNoticeOverOneWeek() {
        assertThatThrownBy(() -> service.create(ptPlan(null, 60, 200))).isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsCodeAlreadyUsed() {
        when(plans.existsByCodeIgnoreCase("PT12")).thenReturn(true);
        assertThatThrownBy(() -> service.create(ptPlan("pt12", 60, 24))).isInstanceOf(ApiException.class);
    }

    @Test
    void savesPtTermsAndUppercasesCode() {
        when(plans.save(any())).thenAnswer(i -> i.getArgument(0));
        service.create(ptPlan(" pt12-3t ", 60, 24));
        ArgumentCaptor<MembershipPlan> saved = ArgumentCaptor.forClass(MembershipPlan.class);
        verify(plans).save(saved.capture());
        assertThat(saved.getValue().getCode()).isEqualTo("PT12-3T");
        assertThat(saved.getValue().getPtSessionMinutes()).isEqualTo(60);
        assertThat(saved.getValue().getPtCancelNoticeHours()).isEqualTo(24);
    }

    @Test
    void gymPlanNeverKeepsPtTerms() {
        when(plans.save(any())).thenAnswer(i -> i.getArgument(0));
        service.create(new PlanRequest("Gói Gym 1 tháng", null, 500_000L, 30, null, false, PlanType.GYM, null, null, null,
                null, "Tập trong giờ mở cửa", 60, 24));
        ArgumentCaptor<MembershipPlan> saved = ArgumentCaptor.forClass(MembershipPlan.class);
        verify(plans).save(saved.capture());
        assertThat(saved.getValue().getPtSessionMinutes()).isNull();
        assertThat(saved.getValue().getPtCancelNoticeHours()).isNull();
        assertThat(saved.getValue().getUsageTerms()).isEqualTo("Tập trong giờ mở cửa");
    }
}
