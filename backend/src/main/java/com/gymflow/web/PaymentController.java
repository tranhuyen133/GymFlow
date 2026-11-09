package com.gymflow.web;

import com.gymflow.dto.PackageRequestDtos.PaymentSettingsRequest;
import com.gymflow.dto.PackageRequestDtos.PaymentSettingsResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.PaymentSettingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Thông tin chuyển khoản: mọi tài khoản đã đăng nhập đọc được (hội viên cần để chuyển tiền), chỉ quản lý sửa. */
@Tag(name = "Thanh toán")
@RestController
@RequestMapping("/api/payment-settings")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentSettingsService service;

    @GetMapping
    public PaymentSettingsResponse get() {
        return service.get();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentSettingsResponse update(@Valid @RequestBody PaymentSettingsRequest req) {
        return service.update(CurrentUser.get(), req);
    }

    @PostMapping(value = "/qr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentSettingsResponse uploadQr(@RequestParam("file") MultipartFile file) {
        return service.uploadQr(CurrentUser.get(), file);
    }

    @DeleteMapping("/qr")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentSettingsResponse deleteQr() {
        return service.deleteQr(CurrentUser.get());
    }

    @GetMapping("/qr")
    public ResponseEntity<byte[]> qr() {
        PaymentSettingsService.QrFile f = service.qr();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(f.data());
    }
}
