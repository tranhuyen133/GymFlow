package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Thông tin nhận chuyển khoản của phòng tập (V12). Bảng chỉ có một dòng, id = {@link #SINGLETON_ID}. */
@Entity
@Table(name = "payment_settings")
@Getter
@Setter
@NoArgsConstructor
public class PaymentSettings {
    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(name = "online_enabled", nullable = false)
    private boolean onlineEnabled;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "account_number", length = 30)
    private String accountNumber;

    @Column(name = "account_name", length = 100)
    private String accountName;

    @Column(name = "qr_content_type", length = 20)
    private String qrContentType;

    @Column(name = "qr_size_bytes")
    private Integer qrSizeBytes;

    /** Tối đa 512 KB, chỉ có một dòng nên đọc kèm cũng không đáng kể. */
    @Column(name = "qr_data", columnDefinition = "MEDIUMBLOB")
    private byte[] qrData;

    @Column(name = "qr_updated_at")
    private LocalDateTime qrUpdatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean hasQr() {
        return qrUpdatedAt != null;
    }
}
