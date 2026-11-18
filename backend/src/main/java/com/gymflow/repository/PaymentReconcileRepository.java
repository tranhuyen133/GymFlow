package com.gymflow.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * V56 · Cột đối soát của package_requests (auto_activated_at, reconciled_at/by, revoked_at).
 * Đọc / ghi bằng JDBC để không phải sửa entity PackageRequest đang dùng ở nhiều luồng duyệt đơn.
 * "Đang chờ đối soát" = đã tự kích hoạt, chưa xác nhận, chưa thu hồi.
 */
@Repository
@RequiredArgsConstructor
public class PaymentReconcileRepository {

    private static final String OPEN = "auto_activated_at IS NOT NULL AND reconciled_at IS NULL AND revoked_at IS NULL";

    private final JdbcTemplate jdbc;

    public record Row(Long id, LocalDateTime autoActivatedAt, LocalDateTime reconciledAt, LocalDateTime revokedAt) {
        public boolean open() {
            return autoActivatedAt != null && reconciledAt == null && revokedAt == null;
        }
    }

    public void markAuto(Long id, LocalDateTime at) {
        jdbc.update("UPDATE package_requests SET auto_activated_at = ? WHERE id = ?", Timestamp.valueOf(at), id);
    }

    public long countOpen() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM package_requests WHERE " + OPEN, Long.class);
        return n == null ? 0 : n;
    }

    public long countOpenForMember(Long memberId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM package_requests WHERE member_id = ? AND " + OPEN, Long.class, memberId);
        return n == null ? 0 : n;
    }

    public List<Row> open() {
        return jdbc.query("SELECT id, auto_activated_at, reconciled_at, revoked_at FROM package_requests WHERE " + OPEN
                + " ORDER BY auto_activated_at ASC", (rs, i) -> row(rs.getLong(1), rs.getTimestamp(2), rs.getTimestamp(3), rs.getTimestamp(4)));
    }

    /** 30 đơn tự kích hoạt đã xử lý gần nhất (đã xác nhận hoặc đã thu hồi). */
    public List<Row> recentClosed() {
        return jdbc.query("SELECT id, auto_activated_at, reconciled_at, revoked_at FROM package_requests"
                        + " WHERE auto_activated_at IS NOT NULL AND (reconciled_at IS NOT NULL OR revoked_at IS NOT NULL)"
                        + " ORDER BY COALESCE(reconciled_at, revoked_at) DESC LIMIT 30",
                (rs, i) -> row(rs.getLong(1), rs.getTimestamp(2), rs.getTimestamp(3), rs.getTimestamp(4)));
    }

    public Optional<Row> find(Long id) {
        return jdbc.query("SELECT id, auto_activated_at, reconciled_at, revoked_at FROM package_requests WHERE id = ?",
                (rs, i) -> row(rs.getLong(1), rs.getTimestamp(2), rs.getTimestamp(3), rs.getTimestamp(4)), id).stream().findFirst();
    }

    /** Trả về số dòng cập nhật: 0 = đơn đã được người khác xử lý trước. */
    public int markReconciled(Long id, Long adminId, LocalDateTime at) {
        return jdbc.update("UPDATE package_requests SET reconciled_at = ?, reconciled_by = ? WHERE id = ? AND " + OPEN,
                Timestamp.valueOf(at), adminId, id);
    }

    public int markRevoked(Long id, Long adminId, LocalDateTime at) {
        return jdbc.update("UPDATE package_requests SET revoked_at = ?, reconciled_by = ? WHERE id = ? AND " + OPEN,
                Timestamp.valueOf(at), adminId, id);
    }

    private static Row row(long id, Timestamp auto, Timestamp ok, Timestamp revoked) {
        return new Row(id, auto == null ? null : auto.toLocalDateTime(), ok == null ? null : ok.toLocalDateTime(),
                revoked == null ? null : revoked.toLocalDateTime());
    }
}
