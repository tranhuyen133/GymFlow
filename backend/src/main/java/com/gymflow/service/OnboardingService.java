package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MemberRepository memberRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final PackageRequestRepository packageRequestRepository;
    private final ConversationRepository conversationRepository;
    private final UserTourProgressRepository tourProgressRepository;
    private final AccessService access;
    private final Clock clock;

    @Transactional(readOnly = true)
    public OnboardingResponse getOnboarding(AuthUser user) {
        if (!user.isMember()) {
            throw ApiException.forbidden();
        }
        Member member = access.requireMemberOf(user);
        User userEntity = member.getUser();

        LocalDate today = LocalDate.now(clock);

        List<MemberSubscription> subs = subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId());
        Optional<MemberSubscription> activeSubOpt = subs.stream()
                .filter(s -> !s.isCancelled() && !today.isBefore(s.getStartDate()) && !today.isAfter(s.getEndDate()))
                .findFirst();

        boolean readyToTrain = userEntity.getStatus() == UserStatus.ACTIVE
                && member.getStatus() == MemberStatus.ACTIVE
                && activeSubOpt.isPresent();

        EntitlementsDto entitlements = activeSubOpt
                .map(s -> new EntitlementsDto(s.getPlan().getName(), s.getStartDate(), s.getEndDate(), s.daysLeft(today)))
                .orElse(null);

        List<PackageRequest> requests = packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId());

        List<OnboardingStepDto> steps = new ArrayList<>();

        // 1. account (bắt buộc)
        steps.add(new OnboardingStepDto(
                "account",
                "Tạo tài khoản",
                true,
                "DONE",
                userEntity.getCreatedAt(),
                "Tài khoản đã tạo thành công",
                null,
                null
        ));

        // 2. profile (bắt buộc)
        boolean hasName = userEntity.getFullName() != null && !userEntity.getFullName().isBlank();
        boolean hasPhone = userEntity.getPhone() != null && !userEntity.getPhone().isBlank();
        boolean hasDob = member.getDateOfBirth() != null;
        if (hasName && hasPhone && hasDob) {
            steps.add(new OnboardingStepDto(
                    "profile",
                    "Hoàn thiện hồ sơ",
                    true,
                    "DONE",
                    userEntity.getUpdatedAt(),
                    "Hồ sơ cá nhân đã đầy đủ thông tin",
                    null,
                    null
            ));
        } else {
            List<String> missing = new ArrayList<>();
            if (!hasName) missing.add("họ tên");
            if (!hasPhone) missing.add("số điện thoại");
            if (!hasDob) missing.add("ngày sinh");
            steps.add(new OnboardingStepDto(
                    "profile",
                    "Hoàn thiện hồ sơ",
                    true,
                    "TODO",
                    userEntity.getUpdatedAt(),
                    "Thiếu: " + String.join(", ", missing),
                    "Cập nhật hồ sơ",
                    "/profile"
            ));
        }

        // 3. explore (khuyến nghị, required = false)
        boolean hasConversation = !conversationRepository.findByMemberId(member.getId()).isEmpty();
        boolean hasRequest = !requests.isEmpty();
        if (hasConversation || hasRequest) {
            steps.add(new OnboardingStepDto(
                    "explore",
                    "Tìm hiểu HLV và dịch vụ",
                    false,
                    "DONE",
                    null,
                    "Đã tìm hiểu dịch vụ và kết nối với huấn luyện viên",
                    null,
                    null
            ));
        } else {
            steps.add(new OnboardingStepDto(
                    "explore",
                    "Tìm hiểu HLV và dịch vụ",
                    false,
                    "TODO",
                    null,
                    "Tìm hiểu các huấn luyện viên và gói tập phù hợp với mục tiêu của bạn",
                    "Xem đội ngũ HLV",
                    "/coaches"
            ));
        }

        // 4. request (bắt buộc)
        Optional<PackageRequest> validReq = requests.stream()
                .filter(r -> r.getStatus() != PackageRequestStatus.CANCELLED && r.getStatus() != PackageRequestStatus.REJECTED)
                .findFirst();
        if (validReq.isPresent()) {
            steps.add(new OnboardingStepDto(
                    "request",
                    "Chọn gói và gửi đăng ký",
                    true,
                    "DONE",
                    validReq.get().getCreatedAt(),
                    "Đã gửi đơn đăng ký gói " + validReq.get().getPlanName(),
                    null,
                    null
            ));
        } else {
            Optional<PackageRequest> latestReq = requests.stream().findFirst();
            if (latestReq.isPresent() && latestReq.get().getStatus() == PackageRequestStatus.REJECTED) {
                String note = latestReq.get().getDecisionNote();
                steps.add(new OnboardingStepDto(
                        "request",
                        "Chọn gói và gửi đăng ký",
                        true,
                        "TODO",
                        latestReq.get().getDecidedAt(),
                        "Đơn bị từ chối" + (note != null && !note.isBlank() ? ": " + note : ""),
                        "Đăng ký lại",
                        "/me/packages"
                ));
            } else {
                steps.add(new OnboardingStepDto(
                        "request",
                        "Chọn gói và gửi đăng ký",
                        true,
                        "TODO",
                        null,
                        "Chưa gửi đơn đăng ký gói tập",
                        "Chọn gói tập",
                        "/me/packages"
                ));
            }
        }

        // 5. payment (bắt buộc)
        Optional<PackageRequest> approvedReq = requests.stream()
                .filter(r -> r.getStatus() == PackageRequestStatus.APPROVED)
                .findFirst();
        if (approvedReq.isPresent()) {
            steps.add(new OnboardingStepDto(
                    "payment",
                    "Thanh toán",
                    true,
                    "DONE",
                    approvedReq.get().getDecidedAt(),
                    "Đã xác nhận thanh toán thành công",
                    null,
                    null
            ));
        } else {
            Optional<PackageRequest> pendingReq = requests.stream()
                    .filter(r -> r.getStatus() == PackageRequestStatus.PENDING)
                    .findFirst();
            if (pendingReq.isPresent()) {
                PackageRequest pr = pendingReq.get();
                if (pr.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
                    if (pr.getMemberPaidAt() == null) {
                        steps.add(new OnboardingStepDto(
                                "payment",
                                "Thanh toán",
                                true,
                                "IN_PROGRESS",
                                pr.getCreatedAt(),
                                "Bạn chưa chuyển khoản. Nội dung chuyển khoản: " + (pr.getPaymentCode() != null ? pr.getPaymentCode() : ""),
                                "Thông tin thanh toán",
                                "/me/packages"
                        ));
                    } else {
                        steps.add(new OnboardingStepDto(
                                "payment",
                                "Thanh toán",
                                true,
                                "IN_PROGRESS",
                                pr.getMemberPaidAt(),
                                "Bạn đã báo chuyển khoản lúc " + HM.format(pr.getMemberPaidAt()) + ". Đang chờ quản lý xác nhận – bạn không cần gửi lại yêu cầu.",
                                "Xem đơn đăng ký",
                                "/me/packages"
                        ));
                    }
                } else {
                    steps.add(new OnboardingStepDto(
                            "payment",
                            "Thanh toán",
                            true,
                            "IN_PROGRESS",
                            pr.getCreatedAt(),
                            "Vui lòng thanh toán tại quầy, quản lý sẽ xác nhận",
                            "Xem đơn đăng ký",
                            "/me/packages"
                    ));
                }
            } else {
                steps.add(new OnboardingStepDto(
                        "payment",
                        "Thanh toán",
                        true,
                        "TODO",
                        null,
                        "Chưa có đơn chờ thanh toán",
                        "Đăng ký gói",
                        "/me/packages"
                ));
            }
        }

        // 6. activation (bắt buộc)
        if (activeSubOpt.isPresent()) {
            MemberSubscription s = activeSubOpt.get();
            steps.add(new OnboardingStepDto(
                    "activation",
                    "Kích hoạt gói",
                    true,
                    "DONE",
                    s.getCreatedAt(),
                    "Gói " + s.getPlan().getName() + " đang có hiệu lực (còn " + s.daysLeft(today) + " ngày)",
                    null,
                    null
            ));
        } else {
            Optional<MemberSubscription> futureSub = subs.stream()
                    .filter(s -> !s.isCancelled() && s.getStartDate().isAfter(today))
                    .min(Comparator.comparing(MemberSubscription::getStartDate));
            if (futureSub.isPresent()) {
                steps.add(new OnboardingStepDto(
                        "activation",
                        "Kích hoạt gói",
                        true,
                        "BLOCKED",
                        futureSub.get().getCreatedAt(),
                        "Gói của bạn bắt đầu từ " + DMY.format(futureSub.get().getStartDate()),
                        "Xem gói tập",
                        "/me/packages"
                ));
            } else if (!subs.isEmpty()) {
                steps.add(new OnboardingStepDto(
                        "activation",
                        "Kích hoạt gói",
                        true,
                        "TODO",
                        null,
                        "Gói đã hết hạn – hãy gia hạn",
                        "Gia hạn gói",
                        "/me/packages"
                ));
            } else {
                steps.add(new OnboardingStepDto(
                        "activation",
                        "Kích hoạt gói",
                        true,
                        "TODO",
                        null,
                        "Chờ kích hoạt gói tập",
                        "Đăng ký gói",
                        "/me/packages"
                ));
            }
        }

        // 7. ready (bắt buộc)
        if (userEntity.getStatus() == UserStatus.LOCKED) {
            steps.add(new OnboardingStepDto(
                    "ready",
                    "Sẵn sàng tập",
                    true,
                    "BLOCKED",
                    null,
                    "Tài khoản đang bị khoá, liên hệ quản lý",
                    null,
                    null
            ));
        } else if (member.getStatus() == MemberStatus.PAUSED || member.getStatus() == MemberStatus.INACTIVE) {
            steps.add(new OnboardingStepDto(
                    "ready",
                    "Sẵn sàng tập",
                    true,
                    "BLOCKED",
                    null,
                    "Hội viên đang tạm ngưng, liên hệ quản lý",
                    null,
                    null
            ));
        } else if (readyToTrain) {
            steps.add(new OnboardingStepDto(
                    "ready",
                    "Sẵn sàng tập",
                    true,
                    "DONE",
                    null,
                    "Bạn đã đủ điều kiện đi tập! Chúc bạn có những buổi tập hiệu quả",
                    "Xem lịch tập",
                    "/me/schedule"
            ));
        } else {
            steps.add(new OnboardingStepDto(
                    "ready",
                    "Sẵn sàng tập",
                    true,
                    "TODO",
                    null,
                    "Chưa đủ điều kiện đi tập",
                    null,
                    null
            ));
        }

        // Tìm currentStep: key của bước đầu tiên bắt buộc mà chưa DONE
        String currentStep = steps.stream()
                .filter(OnboardingStepDto::required)
                .filter(s -> !"DONE".equals(s.status()))
                .map(OnboardingStepDto::key)
                .findFirst()
                .orElse("ready");

        return new OnboardingResponse(readyToTrain, currentStep, steps, entitlements);
    }

    @Transactional(readOnly = true)
    public List<TourProgressDto> getTours(AuthUser user) {
        return tourProgressRepository.findByUserId(user.id()).stream()
                .map(t -> new TourProgressDto(t.getTourKey(), t.getStep(), t.getStatus(), t.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public TourProgressDto updateTour(AuthUser user, String tourKey, UpdateTourProgressRequest req) {
        UserTourProgress progress = tourProgressRepository.findByUserIdAndTourKey(user.id(), tourKey)
                .orElseGet(() -> new UserTourProgress(user.id(), tourKey, req.step(), req.status()));
        progress.setStep(req.step());
        progress.setStatus(req.status());
        progress.setUpdatedAt(LocalDateTime.now());
        progress = tourProgressRepository.save(progress);
        return new TourProgressDto(progress.getTourKey(), progress.getStep(), progress.getStatus(), progress.getUpdatedAt());
    }
}
