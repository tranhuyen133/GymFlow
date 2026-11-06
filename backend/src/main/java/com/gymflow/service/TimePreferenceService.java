package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.Member;
import com.gymflow.domain.MemberTimePreference;
import com.gymflow.domain.Trainer;
import com.gymflow.dto.Dtos.ShiftRequest;
import com.gymflow.dto.TimePreferenceDtos.MemberTimeSlotResponse;
import com.gymflow.dto.TimePreferenceDtos.TimeSlotResponse;
import com.gymflow.repository.MemberTimePreferenceRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Giờ tập mong muốn: hội viên tự khai theo tuần; HLV phụ trách và quản lý xem để xếp ca làm,
 * xếp lịch tập theo giờ của hội viên.
 */
@Service
@RequiredArgsConstructor
public class TimePreferenceService {

    private final MemberTimePreferenceRepository repository;
    private final TrainerRepository trainerRepository;
    private final AccessService access;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<TimeSlotResponse> mine(AuthUser user) {
        return ofMember(access.requireMemberOf(user).getId());
    }

    @Transactional(readOnly = true)
    public List<TimeSlotResponse> of(AuthUser user, Long memberId) {
        access.requireView(user, memberId);
        return ofMember(memberId);
    }

    @Transactional
    public List<TimeSlotResponse> replaceMine(AuthUser user, List<ShiftRequest> slots) {
        Member m = access.requireMemberOf(user);
        List<ShiftRequest> sorted = WeeklySlots.validate(slots, "Giờ tập");
        repository.deleteByMemberId(m.getId());
        repository.flush();
        for (ShiftRequest s : sorted) {
            MemberTimePreference p = new MemberTimePreference();
            p.setMember(m);
            p.setDayOfWeek(s.dayOfWeek());
            p.setStartTime(s.startTime());
            p.setEndTime(s.endTime());
            repository.save(p);
        }
        auditService.log("MEMBER_TIME_PREFS", "MEMBER", m.getId(), sorted.size() + " khung giờ/tuần");
        return ofMember(m.getId());
    }

    /** Giờ tập của các hội viên đang hoạt động do HLV này phụ trách. HLV chỉ xem của mình, quản lý xem của mọi HLV. */
    @Transactional(readOnly = true)
    public List<MemberTimeSlotResponse> ofTrainerMembers(AuthUser user, Long trainerId) {
        Trainer t = trainerRepository.findById(trainerId).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        access.requireTrainerSelfOrAdmin(user, t);
        return repository.findActiveByTrainerId(trainerId).stream()
                .map(p -> new MemberTimeSlotResponse(p.getMember().getId(), p.getMember().getUser().getFullName(),
                        p.getMember().getCode(), p.getDayOfWeek(), p.getStartTime(), p.getEndTime()))
                .toList();
    }

    private List<TimeSlotResponse> ofMember(Long memberId) {
        return repository.findByMemberIdOrderByDayOfWeekAscStartTimeAsc(memberId).stream()
                .map(p -> new TimeSlotResponse(p.getDayOfWeek(), p.getStartTime(), p.getEndTime()))
                .toList();
    }
}
