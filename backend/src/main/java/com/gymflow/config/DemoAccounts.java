package com.gymflow.config;

import com.gymflow.domain.Role;
import com.gymflow.dto.Dtos.DemoAccount;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;

/**
 * Tài khoản demo do DataSeeder tạo, dùng chung cho nút "Đăng nhập nhanh".
 * Chỉ dành cho môi trường phát triển / trình diễn: khi triển khai thật để SEED_DEMO_DATA=false và DEMO_QUICK_LOGIN=false
 * (mặc định trong application.yml và compose.yaml đều là false).
 *
 * Mật khẩu KHÔNG ghi cứng trong code (repo công khai). Lấy từ biến môi trường DEMO_PASSWORD; để trống thì sinh ngẫu nhiên
 * mỗi lần khởi động, nên nút đăng nhập nhanh chỉ khớp với dữ liệu mẫu được sinh trong cùng lần chạy đó.
 */
public final class DemoAccounts {
    private DemoAccounts() {
    }

    /** Mật khẩu chung của mọi tài khoản mẫu (quản lý, HLV, hội viên). */
    public static final String PASSWORD = resolvePassword(System.getenv("DEMO_PASSWORD"));

    public static final DemoAccount ADMIN = new DemoAccount("Quản lý", Role.ADMIN, "admin@gymflow.vn", PASSWORD);
    public static final DemoAccount TRAINER = new DemoAccount("Huấn luyện viên", Role.TRAINER, "trainer@gymflow.vn", PASSWORD);
    public static final DemoAccount MEMBER = new DemoAccount("Hội viên", Role.MEMBER, "member@gymflow.vn", PASSWORD);

    public static final List<DemoAccount> ALL = List.of(ADMIN, TRAINER, MEMBER);

    /** Có giá trị thì dùng nguyên; không có thì sinh mật khẩu đủ chữ hoa, chữ thường, số và ký tự đặc biệt. */
    static String resolvePassword(String fromEnv) {
        if (fromEnv != null && !fromEnv.isBlank()) return fromEnv.trim();
        byte[] b = new byte[6];
        new SecureRandom().nextBytes(b);
        return "Gf-" + HexFormat.of().formatHex(b) + "-Demo!";
    }
}
