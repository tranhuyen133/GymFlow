package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.CheckinDtos.*;
import com.gymflow.repository.GymCheckinRepository;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Check-in tại quầy, hai cách:
 * - Lễ tân quét thẻ QR của hội viên (hoặc gõ mã hội viên / số điện thoại) ở ô check-in nhanh trên thanh trên cùng – không cần mở trang riêng.
 * - Hội viên tự quét / nhập mã check-in của hôm nay (mỗi ngày một mã, in dán ở quầy).
 * Điều kiện: hội viên không bảo lưu / ngừng và có gói còn hiệu lực hôm nay. Quét lại trong 3 giờ không ghi thêm lượt.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CheckinService {

    static final Duration DUPLICATE_WINDOW = Duration.ofHours(3);
    static final int MAX_WRONG_CODES = 5;
    static final Duration WRONG_CODE_WINDOW = Duration.ofMinutes(10);

    private final GymCheckinRepository checkinRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final AccessService access;
    private final CheckinCodes codes;
    private final Mappers mappers;
    private final Clock clock;
    private final MemberRepository memberRepository;

    /** Số lần nhập sai mã theo hội viên (chống dò mã 6 số). Chỉ giữ trong bộ nhớ, khởi động lại là xoá. */
    private final Map<Long, Deque<LocalDateTime>> wrongCodes = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public DailyCode dailyCode(String origin) {
        String code = codes.current();
        String url = codes.checkinUrl(origin, code);
        return new DailyCode(code, codes.today(), url, QrMatrix.encode(url));
    }

    /** Thẻ hội viên: QR chỉ chứa mã hội viên (VD HV00012) để máy quét ở quầy gõ thẳng vào ô check-in. */
    @Transactional(readOnly = true)
    public MemberCard card(AuthUser user) {
        Member m = access.requireMemberOf(user);
        return new MemberCard(m.getCode(), m.getUser().getFullName(), QrMatrix.encode(m.getCode()));
    }

    /** Lễ tân quét thẻ / gõ mã hội viên hoặc số điện thoại. Chỉ nhận khi khớp đúng một hội viên. */
    public CheckinResult desk(AuthUser admin, String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) throw ApiException.badRequest("Quét thẻ hoặc nhập mã hội viên / số điện thoại");
        String digits = q.replaceAll("[\\s.()+-]", "");
        // Số điện thoại: so 9 số cuối để 0912…, +84 912…, 84912… đều khớp
        String last9 = digits.matches("\\d{9,12}") ? digits.substring(digits.length() - 9) : null;
        String term = last9 != null ? last9 : (q.length() > 50 ? q.substring(0, 50) : q);
        List<Member> found = memberRepository.search(term, null, null, PageRequest.of(0, 20)).getContent().stream()
                .filter(m -> q.equalsIgnoreCase(m.getCode()) || (last9 != null && phoneDigits(m).endsWith(last9)))
                .toList();
        if (found.isEmpty()) throw ApiException.badRequest("Không tìm thấy hội viên có mã hoặc số điện thoại " + q);
        if (found.size() > 1) {
            throw ApiException.badRequest("Có " + found.size() + " hội viên trùng số điện thoại này – nhập mã hội viên (HV…) thay vì số điện thoại");
        }
        User by = userRepository.findById(admin.id()).orElse(null);
        return record(found.get(0), CheckinMethod.MANUAL, by, LocalDateTime.now(clock));
    }

    private static String phoneDigits(Member m) {
        String p = m.getUser() == null ? null : m.getUser().getPhone();
        return p == null ? "" : p.replaceAll("\\D", "");
    }

    public CheckinResult checkin(AuthUser user, String code) {
        Member m = access.requireMemberOf(user);
        LocalDateTime now = LocalDateTime.now(clock);
        Deque<LocalDateTime> wrong = wrongCodes.computeIfAbsent(m.getId(), k -> new ArrayDeque<>());
        synchronized (wrong) {
            while (!wrong.isEmpty() && wrong.peekFirst().isBefore(now.minus(WRONG_CODE_WINDOW))) wrong.pollFirst();
            if (wrong.size() >= MAX_WRONG_CODES) {
                throw ApiException.tooManyRequests("Nhập sai mã quá nhiều lần, thử lại sau ít phút hoặc nhờ quầy check-in giúp");
            }
            if (!codes.verify(code == null ? null : code.trim())) {
                wrong.addLast(now);
                throw ApiException.badRequest("Mã check-in hôm nay không đúng – xem mã dán ở quầy lễ tân hoặc đưa thẻ hội viên cho lễ tân quét");
            }
            wrong.clear();
        }
        return record(m, CheckinMethod.QR, null, now);
    }

    public CheckinResult manual(AuthUser admin, Long memberId) {
        Member m = access.loadMember(memberId);
        User by = userRepository.findById(admin.id()).orElse(null);
        return record(m, CheckinMethod.MANUAL, by, LocalDateTime.now(clock));
    }

    public void delete(Long id) {
        if (!checkinRepository.existsById(id)) throw ApiException.notFound("lượt check-in");
        checkinRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CheckinToday today() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime dayStart = now.toLocalDate().atStartOfDay();
        List<GymCheckin> list = checkinRepository.findBetweenWithMember(dayStart, dayStart.plusDays(1));
        int[] perHour = new int[24];
        list.forEach(c -> perHour[c.getCheckedInAt().getHour()]++);
        List<HourValue> byHour = new ArrayList<>();
        for (int h = CrowdService.OPEN_HOUR; h <= CrowdService.CLOSE_HOUR; h++) byHour.add(new HourValue(h, perHour[h]));
        long inGym = list.stream().filter(c -> !c.getCheckedInAt().isBefore(now.minusMinutes(CrowdService.STAY_MINUTES))).count();
        return new CheckinToday(list.size(), inGym, list.stream().limit(100).map(c -> response(c, now)).toList(), byHour);
    }

    /** Lượt check-in hôm nay của hội viên (nếu có) – cho trang "Hôm nay". */
    @Transactional(readOnly = true)
    public CheckinResponse latestToday(Long memberId) {
        LocalDateTime now = LocalDateTime.now(clock);
        return checkinRepository.findFirstByMemberIdAndCheckedInAtGreaterThanEqualOrderByCheckedInAtDesc(memberId, now.toLocalDate().atStartOfDay())
                .map(c -> response(c, now)).orElse(null);
    }

    @Transactional(readOnly = true)
    public long visitsThisMonth(Long memberId) {
        LocalDateTime now = LocalDateTime.now(clock);
        return checkinRepository.countByMemberIdAndCheckedInAtBetween(memberId, now.toLocalDate().withDayOfMonth(1).atStartOfDay(), now);
    }

    private CheckinResult record(Member m, CheckinMethod method, User by, LocalDateTime now) {
        if (m.getStatus() == MemberStatus.PAUSED) {
            throw ApiException.badRequest("Hội viên đang bảo lưu – liên hệ quầy để mở lại trước khi check-in");
        }
        if (m.getStatus() == MemberStatus.INACTIVE) {
            throw ApiException.badRequest("Hội viên đã ngừng hoạt động – liên hệ quầy để được hỗ trợ");
        }
        Optional<GymCheckin> recent = checkinRepository
                .findFirstByMemberIdAndCheckedInAtGreaterThanEqualOrderByCheckedInAtDesc(m.getId(), now.minus(DUPLICATE_WINDOW));
        if (recent.isPresent()) return new CheckinResult(response(recent.get(), now), true, visitsThisMonth(m.getId()));
        if (subscriptionRepository.findEffective(m.getId(), now.toLocalDate()).isEmpty()) {
            throw ApiException.badRequest("Chưa có gói tập còn hiệu lực hôm nay – gia hạn gói ở quầy hoặc trong mục Gói & Dịch vụ");
        }
        GymCheckin c = new GymCheckin();
        c.setMember(m);
        c.setCheckedInAt(now);
        c.setMethod(method);
        c.setCreatedBy(by);
        c = checkinRepository.save(c);
        return new CheckinResult(response(c, now), false, visitsThisMonth(m.getId()));
    }

    CheckinResponse response(GymCheckin c, LocalDateTime now) {
        Member m = c.getMember();
        LocalDate today = now.toLocalDate();
        MemberSubscription sub = mappers.pickCurrent(subscriptionRepository.findByMemberIdOrderByStartDateDesc(m.getId()), today);
        String planName = sub == null ? null : sub.getPlanNameSnapshot() != null ? sub.getPlanNameSnapshot() : sub.getPlan().getName();
        Integer daysLeft = sub == null ? null : (int) sub.daysLeft(today);
        // Buổi tập gần giờ check-in nhất trong ngày (bắt đầu từ 1 giờ trước đến 3 giờ sau) để quầy biết hội viên tập với ai.
        LocalDateTime at = c.getCheckedInAt();
        WorkoutSchedule session = scheduleRepository.findByMemberIdAndStartTimeBetweenOrderByStartTimeAsc(m.getId(), at.minusHours(1), at.plusHours(3))
                .stream().filter(s -> s.getStatus() != ScheduleStatus.CANCELLED).findFirst().orElse(null);
        User by = c.getCreatedBy();
        return new CheckinResponse(c.getId(), m.getId(), m.getCode(), m.getUser().getFullName(), at, c.getMethod(),
                by == null ? null : by.getFullName(), planName, daysLeft,
                session == null ? null : session.getTitle(), session == null ? null : session.getStartTime());
    }
}
