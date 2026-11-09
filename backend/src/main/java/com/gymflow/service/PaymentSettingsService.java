package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.PaymentSettings;
import com.gymflow.dto.PackageRequestDtos.PaymentSettingsRequest;
import com.gymflow.dto.PackageRequestDtos.PaymentSettingsResponse;
import com.gymflow.repository.PaymentSettingsRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Thông tin nhận chuyển khoản của phòng tập (V12): ngân hàng, số tài khoản, chủ tài khoản và ảnh mã QR.
 * Chưa nối cổng thanh toán nên không có xác nhận tự động: hội viên chuyển khoản theo mã QR với nội dung là mã đơn,
 * quản lý đối chiếu tài khoản rồi mới duyệt đơn. Ảnh QR kiểm tra định dạng bằng magic bytes giống ảnh đại diện.
 */
@Service
@RequiredArgsConstructor
public class PaymentSettingsService {

    public static final int MAX_QR_BYTES = 512 * 1024;

    private final PaymentSettingsRepository repository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final Clock clock;

    public record QrFile(byte[] data, String contentType) {
    }

    @Transactional(readOnly = true)
    public PaymentSettingsResponse get() {
        return toResponse(load());
    }

    /** Hội viên chỉ chọn được "Chuyển khoản" khi quản lý đã bật và đã có đủ thông tin nhận tiền. */
    @Transactional(readOnly = true)
    public boolean onlineReady() {
        PaymentSettings s = load();
        return s.isOnlineEnabled() && s.hasQr() && s.getAccountNumber() != null;
    }

    @Transactional
    public PaymentSettingsResponse update(AuthUser admin, PaymentSettingsRequest req) {
        PaymentSettings s = load();
        String bank = Mappers.blankToNull(req.bankName());
        String account = Mappers.blankToNull(req.accountNumber() == null ? null : req.accountNumber().replaceAll("\\s+", ""));
        String holder = Mappers.blankToNull(req.accountName());
        if (account != null && !account.matches("\\d{4,30}")) throw ApiException.badRequest("Số tài khoản chỉ gồm chữ số");
        if (req.onlineEnabled()) {
            if (bank == null || account == null || holder == null) {
                throw ApiException.badRequest("Nhập đủ ngân hàng, số tài khoản và tên chủ tài khoản trước khi bật chuyển khoản");
            }
            if (!s.hasQr()) throw ApiException.badRequest("Tải ảnh mã QR ngân hàng lên trước khi bật chuyển khoản");
        }
        s.setOnlineEnabled(req.onlineEnabled());
        s.setBankName(bank);
        s.setAccountNumber(account);
        s.setAccountName(holder == null ? null : holder.toUpperCase());
        touch(s, admin);
        auditService.log("PAYMENT_SETTINGS_UPDATE", "PAYMENT_SETTINGS", s.getId(),
                (s.isOnlineEnabled() ? "Bật" : "Tắt") + " chuyển khoản" + (bank == null ? "" : " · " + bank));
        return toResponse(s);
    }

    @Transactional
    public PaymentSettingsResponse uploadQr(AuthUser admin, MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Vui lòng chọn ảnh mã QR");
        if (file.getSize() > MAX_QR_BYTES) throw ApiException.badRequest("Ảnh mã QR tối đa 512 KB");
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Không đọc được file ảnh");
        }
        String type = AvatarService.sniff(data);
        if (type == null) throw ApiException.badRequest("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP");
        PaymentSettings s = load();
        s.setQrData(data);
        s.setQrContentType(type);
        s.setQrSizeBytes(data.length);
        s.setQrUpdatedAt(now());
        touch(s, admin);
        auditService.log("PAYMENT_QR_UPDATE", "PAYMENT_SETTINGS", s.getId(), (data.length / 1024) + " KB");
        return toResponse(s);
    }

    @Transactional
    public PaymentSettingsResponse deleteQr(AuthUser admin) {
        PaymentSettings s = load();
        if (s.isOnlineEnabled()) throw ApiException.badRequest("Tắt nhận chuyển khoản trước khi xoá mã QR");
        if (s.hasQr()) {
            s.setQrData(null);
            s.setQrContentType(null);
            s.setQrSizeBytes(null);
            s.setQrUpdatedAt(null);
            touch(s, admin);
            auditService.log("PAYMENT_QR_DELETE", "PAYMENT_SETTINGS", s.getId(), null);
        }
        return toResponse(s);
    }

    @Transactional(readOnly = true)
    public QrFile qr() {
        PaymentSettings s = load();
        if (!s.hasQr() || s.getQrData() == null) throw ApiException.notFound("mã QR thanh toán");
        return new QrFile(s.getQrData(), s.getQrContentType());
    }

    private void touch(PaymentSettings s, AuthUser admin) {
        s.setUpdatedAt(now());
        s.setUpdatedBy(userRepository.getReferenceById(admin.id()));
    }

    // Cắt về micro giây để khớp DATETIME(6), giống AvatarService
    private LocalDateTime now() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    }

    private PaymentSettings load() {
        return repository.findById(PaymentSettings.SINGLETON_ID)
                .orElseThrow(() -> ApiException.notFound("cấu hình thanh toán (V12 chưa chạy?)"));
    }

    private static PaymentSettingsResponse toResponse(PaymentSettings s) {
        return new PaymentSettingsResponse(s.isOnlineEnabled(), s.getBankName(), s.getAccountNumber(), s.getAccountName(),
                s.hasQr(), s.getQrUpdatedAt(), s.getUpdatedAt());
    }
}
