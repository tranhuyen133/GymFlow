package com.gymflow.domain;

/** V55 · Các loại email tự động; mỗi loại gắn với một cờ bật/tắt trong email_preferences. */
public enum EmailKind {
    /** Gói còn 7 ngày: nhắc gia hạn kèm ưu đãi gia hạn đang chạy. */
    RENEWAL,
    /** Đầu tháng sinh nhật: báo ưu đãi sinh nhật. */
    BIRTHDAY,
    /** 19:00 hôm trước: lịch tập ngày mai. */
    SESSION_REMINDER,
    /** Sáng thứ Hai: tóm tắt tuần của hội viên. */
    WEEKLY_DIGEST,
    /** 07:00 mỗi ngày: báo cáo sáng của HLV. */
    TRAINER_REPORT,
    /** Vắng 10 ngày: "Lâu rồi không gặp". */
    RETENTION,
    /** Vừa đạt huy hiệu mới. */
    ACHIEVEMENT,
    /** Mã xác thực / đặt lại mật khẩu – luôn gửi, không tắt được. */
    SECURITY;

    public boolean optional() {
        return this != SECURITY;
    }
}
