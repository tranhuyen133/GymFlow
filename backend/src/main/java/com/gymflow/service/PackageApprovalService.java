package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.MemberSubscription;
import com.gymflow.domain.PackageRequest;
import com.gymflow.domain.Trainer;
import com.gymflow.dto.PackageRequestDtos.ApprovePackageRequest;
import com.gymflow.dto.PackageRequestDtos.PackageRequestResponse;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * V49 · Điểm duyệt đơn duy nhất cho quản lý: đơn thường → PackageRequestService, đơn nâng cấp → SubscriptionUpgradeService.
 * Gói có HLV thì trong CÙNG transaction bàn giao luôn cho HLV (giáo án + buổi đã xếp) để HLV thấy lịch ngay khi duyệt.
 */
@Service
@RequiredArgsConstructor
public class PackageApprovalService {

    private final PackageRequestRepository requestRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final TrainerRepository trainerRepository;
    private final PackageRequestService packageRequestService;
    private final SubscriptionUpgradeService upgradeService;
    private final TrainerHandoverService handoverService;

    @Transactional
    public PackageRequestResponse approve(AuthUser admin, Long id, ApprovePackageRequest req) {
        PackageRequest r = requestRepository.findById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        PackageRequestResponse res = r.isUpgrade() ? upgradeService.approve(admin, id, req) : packageRequestService.approve(admin, id, req);
        if (res.subscriptionId() != null && res.trainerId() != null) {
            MemberSubscription sub = subscriptionRepository.findById(res.subscriptionId()).orElse(null);
            Trainer trainer = trainerRepository.findById(res.trainerId()).orElse(null);
            if (sub != null && trainer != null && SubscriptionUpgradeService.isPtSub(sub)) {
                handoverService.attach(sub, trainer);
            }
        }
        return res;
    }
}
