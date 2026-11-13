package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.ForumCategory;
import com.gymflow.domain.ForumReply;
import com.gymflow.domain.ForumReport;
import com.gymflow.domain.ForumTopic;
import com.gymflow.domain.Role;
import com.gymflow.domain.User;
import com.gymflow.dto.ForumDtos.*;
import com.gymflow.repository.ForumReplyRepository;
import com.gymflow.repository.ForumReportRepository;
import com.gymflow.repository.ForumTopicRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử quy tắc Diễn đàn không cần CSDL (repository giả bằng Mockito).
 * Mỗi nhóm @Nested ứng với một chức năng; tên test mô tả tình huống bằng tiếng Việt.
 */
class ForumServiceRulesTest {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-13T03:00:00Z"), VN);
    private static final LocalDateTime NOW = LocalDateTime.now(CLOCK);

    private final ForumTopicRepository topics = mock(ForumTopicRepository.class);
    private final ForumReplyRepository replies = mock(ForumReplyRepository.class);
    private final ForumReportRepository reports = mock(ForumReportRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final ForumService forum = new ForumService(topics, replies, reports, users, audit, CLOCK);

    private final User admin = user(1L, "Quản lý GymFlow", Role.ADMIN);
    private final User trainer = user(2L, "Lê Hoàng Phúc", Role.TRAINER);
    private final User member = user(3L, "Nguyễn Minh Anh", Role.MEMBER);
    private final User member2 = user(4L, "Trần Quốc Bảo", Role.MEMBER);
    private final AuthUser asAdmin = auth(admin), asTrainer = auth(trainer), asMember = auth(member), asMember2 = auth(member2);

    private ForumTopic adminTopic;

    @BeforeEach
    void setUp() {
        for (User u : List.of(admin, trainer, member, member2)) when(users.getReferenceById(u.getId())).thenReturn(u);
        when(topics.save(any())).thenAnswer(i -> i.getArgument(0));
        when(replies.save(any())).thenAnswer(i -> i.getArgument(0));
        when(reports.save(any())).thenAnswer(i -> i.getArgument(0));
        when(replies.findByTopic_IdOrderByCreatedAtAscIdAsc(anyLong())).thenReturn(List.of());
        adminTopic = topic(10L, admin);
    }

    // ---------- Trả lời: lỗi người dùng báo ----------

    @Nested
    @DisplayName("Trả lời chủ đề")
    class Reply {

        @Test
        void hoiVienDaDangNhapTraLoiDuocBaiCuaQuanLy() {
            ReplyResponse r = forum.reply(asMember, 10L, new ReplyRequest("Cảm ơn admin, em đã đọc nội quy"));
            assertThat(r.body()).isEqualTo("Cảm ơn admin, em đã đọc nội quy");
            assertThat(r.mine()).isTrue();
            assertThat(r.author().name()).isEqualTo("Nguyễn Minh Anh");
            assertThat(adminTopic.getLastActivityAt()).isEqualTo(NOW);
            verify(replies).save(any());
        }

        @Test
        void hlvTraLoiDuocBaiCuaQuanLy() {
            assertThat(forum.reply(asTrainer, 10L, new ReplyRequest("Mình bổ sung thêm ý")).mine()).isTrue();
        }

        @Test
        void chuDeKhoaThiHoiVienBiChanVoiThongBaoRo() {
            adminTopic.setLocked(true);
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest("Xin chào")), HttpStatus.BAD_REQUEST,
                    "chỉ huấn luyện viên hoặc quản lý");
            verify(replies, never()).save(any());
        }

        @Test
        void chuDeKhoaThiHlvVaQuanLyVanTraLoiDuoc() {
            adminTopic.setLocked(true);
            forum.reply(asTrainer, 10L, new ReplyRequest("HLV trả lời"));
            when(replies.existsByAuthor_IdAndCreatedAtAfter(eq(1L), any())).thenReturn(false);
            forum.reply(asAdmin, 10L, new ReplyRequest("Quản lý trả lời"));
            verify(replies, times(2)).save(any());
        }

        @Test
        void chuDeBiAnThiNguoiKhacNhan404() {
            adminTopic.setHidden(true);
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest("Xin chào")), HttpStatus.NOT_FOUND, "chủ đề");
        }

        @Test
        void chuDeBiAnThiNhanVienCungKhongTraLoiDuoc() {
            adminTopic.setHidden(true);
            assertBad(() -> forum.reply(asAdmin, 10L, new ReplyRequest("Xin chào")), HttpStatus.BAD_REQUEST, "đang bị ẩn");
        }

        @Test
        void chuDeKhongTonTaiTra404() {
            assertBad(() -> forum.reply(asMember, 999L, new ReplyRequest("Xin chào")), HttpStatus.NOT_FOUND, "chủ đề");
        }

        @Test
        void guiQuaNhanhTra429() {
            when(replies.existsByAuthor_IdAndCreatedAtAfter(eq(3L), eq(NOW.minusSeconds(15)))).thenReturn(true);
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest("Xin chào")), HttpStatus.TOO_MANY_REQUESTS, "hơi nhanh");
        }

        @Test
        void guiTrungNoiDungTrong10PhutTra409() {
            when(replies.existsByTopic_IdAndAuthor_IdAndBodyAndCreatedAtAfter(10L, 3L, "Xin chào", NOW.minusMinutes(10))).thenReturn(true);
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest("  Xin chào  ")), HttpStatus.CONFLICT, "đúng nội dung này");
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "\n\n\t", "\u200B\u200B\u200B"})
        void noiDungRongHoacVoHinhBiChan(String body) {
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest(body)), HttpStatus.BAD_REQUEST, "Vui lòng nhập nội dung trả lời");
        }

        @Test
        void motKyTuSauKhiTrimBiChan() {
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest("  a  ")), HttpStatus.BAD_REQUEST, "từ 2 đến 5.000");
        }

        @Test
        void quaNamNghinKyTuBiChanVaBienNamNghinDuoc() {
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest("a".repeat(5001))), HttpStatus.BAD_REQUEST, "từ 2 đến 5.000");
            assertThat(forum.reply(asMember, 10L, new ReplyRequest("a".repeat(5000))).body()).hasSize(5000);
        }

        @Test
        void chiToanDauChamBiChan() {
            assertBad(() -> forum.reply(asMember, 10L, new ReplyRequest(".......")), HttpStatus.BAD_REQUEST, "cần có chữ hoặc số");
        }

        @Test
        void noiDungDuocLamSachTruocKhiLuu() {
            ReplyResponse r = forum.reply(asMember, 10L, new ReplyRequest("  Dòng 1   \r\n\r\n\r\n\r\nDòng\u200B 2  "));
            assertThat(r.body()).isEqualTo("Dòng 1\n\nDòng 2");
        }

        @Test
        void demLaiSoTraLoiSauKhiGui() {
            when(replies.countByTopic_IdAndHiddenFalse(10L)).thenReturn(4L);
            forum.reply(asMember, 10L, new ReplyRequest("Xin chào"));
            assertThat(adminTopic.getReplyCount()).isEqualTo(4);
        }
    }

    // ---------- Sửa / xoá trả lời ----------

    @Nested
    @DisplayName("Sửa và xoá trả lời")
    class EditReply {

        @Test
        void nguoiKhacKhongSuaDuoc() {
            reply(50L, adminTopic, member);
            assertBad(() -> forum.updateReply(asMember2, 50L, new ReplyRequest("Sửa trộm")), HttpStatus.FORBIDDEN, "Chỉ người viết");
        }

        @Test
        void quanLyCungKhongSuaNoiDungCuaNguoiKhac() {
            reply(50L, adminTopic, member);
            assertBad(() -> forum.updateReply(asAdmin, 50L, new ReplyRequest("Sửa giùm")), HttpStatus.FORBIDDEN, "Chỉ người viết");
        }

        @Test
        void chuDeKhoaThiHoiVienKhongSuaDuocTraLoiCu() {
            reply(50L, adminTopic, member);
            adminTopic.setLocked(true);
            assertBad(() -> forum.updateReply(asMember, 50L, new ReplyRequest("Nội dung mới")), HttpStatus.BAD_REQUEST, "đã khoá");
        }

        @Test
        void traLoiBiAnThiKhongSuaDuoc() {
            reply(50L, adminTopic, member).setHidden(true);
            assertBad(() -> forum.updateReply(asMember, 50L, new ReplyRequest("Nội dung mới")), HttpStatus.BAD_REQUEST, "đang bị ẩn");
        }

        @Test
        void nguoiVietSuaDuocVaGhiThoiDiemSua() {
            ForumReply r = reply(50L, adminTopic, member);
            assertThat(forum.updateReply(asMember, 50L, new ReplyRequest("  Nội dung mới  ")).body()).isEqualTo("Nội dung mới");
            assertThat(r.getUpdatedAt()).isEqualTo(NOW);
        }

        @Test
        void hoiVienKhacKhongXoaDuocNhungQuanLyXoaDuocVaGhiNhatKy() {
            reply(50L, adminTopic, member);
            assertBad(() -> forum.deleteReply(asMember2, 50L), HttpStatus.FORBIDDEN, "Chỉ người viết hoặc quản lý");
            assertBad(() -> forum.deleteReply(asTrainer, 50L), HttpStatus.FORBIDDEN, "Chỉ người viết hoặc quản lý");
            forum.deleteReply(asAdmin, 50L);
            verify(replies).delete(any());
            verify(audit).log(eq("FORUM_DELETE"), eq("FORUM_REPLY"), eq(50L), any());
        }

        @Test
        void nguoiVietTuXoaKhongGhiNhatKyKiemDuyet() {
            reply(50L, adminTopic, member);
            forum.deleteReply(asMember, 50L);
            verify(replies).delete(any());
            verify(audit, never()).log(eq("FORUM_DELETE"), any(), any(), any());
        }
    }

    // ---------- Chủ đề ----------

    @Nested
    @DisplayName("Đăng, sửa, xoá chủ đề")
    class Topic {

        @Test
        void dangChuDeHopLeLamSachTieuDe() {
            TopicDetail d = forum.create(asMember, new TopicRequest("  Tập   chân\n2 buổi/tuần? ", ForumCategory.TRAINING, "Mình tập chân 2 buổi một tuần có đủ không?"));
            assertThat(d.title()).isEqualTo("Tập chân 2 buổi/tuần?");
            assertThat(d.mine()).isTrue();
            assertThat(d.viewerSignedIn()).isTrue();
        }

        @Test
        void tieuDeNganSauKhiTrimBiChanDuDtoDemDu5KyTu() {
            assertBad(() -> forum.create(asMember, new TopicRequest("   abc   ", ForumCategory.GENERAL, "Nội dung đủ mười ký tự")),
                    HttpStatus.BAD_REQUEST, "Tiêu đề từ 5 đến 200");
        }

        @Test
        void noiDungChuDe9KyTuBiChan() {
            assertBad(() -> forum.create(asMember, new TopicRequest("Tiêu đề ổn", ForumCategory.GENERAL, "123456789")),
                    HttpStatus.BAD_REQUEST, "Nội dung từ 10 đến 10.000");
        }

        @Test
        void dangLienTiepTrong1PhutTra429() {
            when(topics.existsByAuthor_IdAndCreatedAtAfter(3L, NOW.minusSeconds(60))).thenReturn(true);
            assertBad(() -> forum.create(asMember, new TopicRequest("Tiêu đề ổn", ForumCategory.GENERAL, "Nội dung đủ mười ký tự")),
                    HttpStatus.TOO_MANY_REQUESTS, "chờ 1 phút");
        }

        @Test
        void trungTieuDeTrong24GioTra409() {
            when(topics.existsByAuthor_IdAndTitleAndCreatedAtAfter(3L, "Tiêu đề ổn", NOW.minusHours(24))).thenReturn(true);
            assertBad(() -> forum.create(asMember, new TopicRequest("Tiêu đề ổn", ForumCategory.GENERAL, "Nội dung đủ mười ký tự")),
                    HttpStatus.CONFLICT, "cùng tiêu đề");
        }

        @Test
        void nguoiKhacKhongSuaDuocChuDe() {
            assertBad(() -> forum.update(asMember, 10L, new TopicRequest("Tiêu đề mới", ForumCategory.GENERAL, "Nội dung đủ mười ký tự")),
                    HttpStatus.FORBIDDEN, "Chỉ người viết");
        }

        @Test
        void tacGiaKhongXoaDuocKhiDaCoNguoiKhacTraLoi() {
            ForumTopic t = topic(11L, member);
            when(replies.existsByTopic_IdAndAuthor_IdNot(11L, 3L)).thenReturn(true);
            assertBad(() -> forum.delete(asMember, 11L), HttpStatus.BAD_REQUEST, "đã có người trả lời");
            verify(topics, never()).delete(t);
        }

        @Test
        void tacGiaXoaDuocKhiChuaAiTraLoiVaQuanLyLuonXoaDuoc() {
            ForumTopic t = topic(11L, member);
            forum.delete(asMember, 11L);
            verify(topics).delete(t);
            when(replies.existsByTopic_IdAndAuthor_IdNot(11L, 1L)).thenReturn(true);
            forum.delete(asAdmin, 11L);
            verify(topics, times(2)).delete(t);
        }

        @Test
        void hlvKhongXoaDuocChuDeCuaHoiVien() {
            topic(11L, member);
            assertBad(() -> forum.delete(asTrainer, 11L), HttpStatus.FORBIDDEN, "Chỉ người viết hoặc quản lý");
        }
    }

    // ---------- Xem ----------

    @Nested
    @DisplayName("Xem chủ đề")
    class View {

        @Test
        void khachThayTenRutGonVaKhongDuocCoiLaDaDangNhap() {
            TopicDetail d = forum.topic(null, 10L);
            assertThat(d.author().name()).isEqualTo("GymFlow Q.");
            assertThat(d.viewerSignedIn()).isFalse();
            assertThat(d.canModerate()).isFalse();
            assertThat(d.mine()).isFalse();
        }

        @Test
        void hoiVienThayTenDayDuVaDaDangNhap() {
            TopicDetail d = forum.topic(asMember, 10L);
            assertThat(d.author().name()).isEqualTo("Quản lý GymFlow");
            assertThat(d.viewerSignedIn()).isTrue();
            assertThat(d.canModerate()).isFalse();
        }

        @Test
        void traLoiBiAnChiNguoiVietVaNhanVienThay() {
            ForumReply hidden = reply(50L, adminTopic, member2);
            hidden.setHidden(true);
            ForumReply shown = reply(51L, adminTopic, member);
            when(replies.findByTopic_IdOrderByCreatedAtAscIdAsc(10L)).thenReturn(List.of(hidden, shown));
            assertThat(forum.topic(asMember, 10L).replies()).extracting(ReplyResponse::id).containsExactly(51L);
            assertThat(forum.topic(asMember2, 10L).replies()).extracting(ReplyResponse::id).containsExactly(50L, 51L);
            assertThat(forum.topic(asTrainer, 10L).replies()).hasSize(2);
            assertThat(forum.topic(null, 10L).replies()).hasSize(1);
        }

        @Test
        void chuDeBiAnChiTacGiaVaNhanVienMoDuoc() {
            ForumTopic t = topic(11L, member);
            t.setHidden(true);
            assertBad(() -> forum.topic(null, 11L), HttpStatus.NOT_FOUND, "chủ đề");
            assertBad(() -> forum.topic(asMember2, 11L), HttpStatus.NOT_FOUND, "chủ đề");
            assertThat(forum.topic(asMember, 11L).hidden()).isTrue();
            assertThat(forum.topic(asTrainer, 11L).hidden()).isTrue();
        }

        @Test
        void tuKhoaTimKiemDuocThoatKyTuDacBietVaCat100KyTu() {
            assertThat(ForumService.searchTerm("50%_off\\")).isEqualTo("50\\%\\_off\\\\");
            assertThat(ForumService.searchTerm("  tập   chân ")).isEqualTo("tập chân");
            assertThat(ForumService.searchTerm(null)).isEmpty();
            assertThat(ForumService.searchTerm("a".repeat(300))).hasSize(100);
        }
    }

    // ---------- Kiểm duyệt ----------

    @Nested
    @DisplayName("Kiểm duyệt")
    class Moderation {

        @Test
        void hlvKhongAnHayKhoaBaiCuaQuanLy() {
            assertBad(() -> forum.moderateTopic(asTrainer, 10L, new ModerationRequest(ModerationAction.LOCK, null)),
                    HttpStatus.FORBIDDEN, "chỉ quản lý");
            assertThat(adminTopic.isLocked()).isFalse();
        }

        @Test
        void hlvKhoaVaGhimDuocBaiHoiVien() {
            ForumTopic t = topic(11L, member);
            forum.moderateTopic(asTrainer, 11L, new ModerationRequest(ModerationAction.LOCK, null));
            forum.moderateTopic(asTrainer, 11L, new ModerationRequest(ModerationAction.PIN, null));
            assertThat(t.isLocked()).isTrue();
            assertThat(t.isPinned()).isTrue();
        }

        @Test
        void hoiVienKhongKiemDuyetDuoc() {
            topic(11L, member2);
            assertBad(() -> forum.moderateTopic(asMember, 11L, new ModerationRequest(ModerationAction.HIDE, "Spam quảng cáo")),
                    HttpStatus.FORBIDDEN, "không có quyền");
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "spam"})
        void anBaiBatBuocLyDoTu5KyTu(String reason) {
            topic(11L, member);
            assertThatThrownBy(() -> forum.moderateTopic(asAdmin, 11L, new ModerationRequest(ModerationAction.HIDE, reason)))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        }

        @Test
        void anRoiHienLaiXoaHetThongTinAn() {
            ForumTopic t = topic(11L, member);
            forum.moderateTopic(asAdmin, 11L, new ModerationRequest(ModerationAction.HIDE, "  Quảng   cáo  "));
            assertThat(t.isHidden()).isTrue();
            assertThat(t.getHiddenReason()).isEqualTo("Quảng cáo");
            forum.moderateTopic(asAdmin, 11L, new ModerationRequest(ModerationAction.SHOW, null));
            assertThat(t.isHidden()).isFalse();
            assertThat(t.getHiddenReason()).isNull();
            assertThat(t.getHiddenBy()).isNull();
        }

        @Test
        void traLoiChiAnHoacHienLaiDuoc() {
            reply(50L, adminTopic, member);
            assertBad(() -> forum.moderateReply(asAdmin, 50L, new ModerationRequest(ModerationAction.PIN, null)),
                    HttpStatus.BAD_REQUEST, "chỉ ẩn hoặc hiện");
        }

        @Test
        void anTraLoiThiDemLaiSoTraLoi() {
            reply(50L, adminTopic, member);
            when(replies.countByTopic_IdAndHiddenFalse(10L)).thenReturn(0L);
            adminTopic.setReplyCount(1);
            forum.moderateReply(asTrainer, 50L, new ModerationRequest(ModerationAction.HIDE, "Ngôn từ khiếm nhã"));
            assertThat(adminTopic.getReplyCount()).isZero();
        }
    }

    // ---------- Báo cáo ----------

    @Nested
    @DisplayName("Báo cáo vi phạm")
    class Report {

        @Test
        void khongBaoCaoBaiCuaChinhMinh() {
            topic(11L, member);
            assertBad(() -> forum.reportTopic(asMember, 11L, new ReportRequest("Bài sai thông tin")), HttpStatus.BAD_REQUEST, "chính mình");
        }

        @Test
        void baoCaoTrungKhongTaoThemBanGhi() {
            when(reports.existsByReporter_IdAndTopic_IdAndReplyIsNullAndStatus(3L, 10L, ForumReport.OPEN)).thenReturn(true);
            forum.reportTopic(asMember, 10L, new ReportRequest("Bài sai thông tin"));
            verify(reports, never()).save(any());
        }

        @Test
        void baoCaoHopLeDuocLuuVoiLyDoDaLamSach() {
            forum.reportTopic(asMember, 10L, new ReportRequest("   Thông tin   sai lệch  "));
            verify(reports).save(argThat(r -> "Thông tin sai lệch".equals(r.getReason()) && r.getReply() == null));
        }

        @Test
        void lyDoQuaNganBiChan() {
            assertBad(() -> forum.reportTopic(asMember, 10L, new ReportRequest(" spam ")), HttpStatus.BAD_REQUEST, "Lý do từ 5 đến 255");
        }

        @Test
        void khongBaoCaoDuocTraLoiDangAnMaMinhKhongThay() {
            reply(50L, adminTopic, member2).setHidden(true);
            assertBad(() -> forum.reportReply(asMember, 50L, new ReportRequest("Nội dung xấu")), HttpStatus.NOT_FOUND, "trả lời");
        }
    }

    // ---------- Làm sạch chữ ----------

    @Test
    void lamSachChuChuanHoaDauTiengViet() {
        assertThat(ForumService.clean("Tie\u0301n")).isEqualTo("Ti\u00e9n");
        assertThat(ForumService.clean(null)).isEmpty();
        assertThat(ForumService.clean("a\u0007b\u202Ec")).isEqualTo("abc");
        assertThat(ForumService.clean("x\t y")).isEqualTo("x\t y");
    }

    @Test
    void emojiDemTheoKyTuThat() {
        assertThatThrownBy(() -> ForumService.title("💪💪💪💪💪")).hasMessageContaining("cần có chữ hoặc số");
        assertThat(ForumService.title("Squat 💪💪")).isEqualTo("Squat 💪💪");
    }

    // ---------- Tiện ích dựng dữ liệu ----------

    private static void assertBad(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, HttpStatus status, String messagePart) {
        assertThatThrownBy(call)
                .isInstanceOf(ApiException.class)
                .hasMessageContaining(messagePart)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(status));
    }

    private static User user(Long id, String name, Role role) {
        User u = new User();
        u.setId(id);
        u.setFullName(name);
        u.setRole(role);
        return u;
    }

    private static AuthUser auth(User u) {
        return new AuthUser(u.getId(), "u" + u.getId() + "@gymflow.vn", u.getRole(), u.getFullName());
    }

    private ForumTopic topic(Long id, User author) {
        ForumTopic t = new ForumTopic();
        t.setId(id);
        t.setAuthor(author);
        t.setTitle("Chủ đề " + id);
        t.setCategory(ForumCategory.GENERAL);
        t.setBody("Nội dung chủ đề số " + id);
        t.setCreatedAt(NOW.minusDays(1));
        t.setLastActivityAt(NOW.minusDays(1));
        when(topics.findById(id)).thenReturn(Optional.of(t));
        return t;
    }

    private ForumReply reply(Long id, ForumTopic t, User author) {
        ForumReply r = new ForumReply();
        r.setId(id);
        r.setTopic(t);
        r.setAuthor(author);
        r.setBody("Trả lời " + id);
        r.setCreatedAt(NOW.minusHours(1));
        when(replies.findById(id)).thenReturn(Optional.of(r));
        return r;
    }
}
