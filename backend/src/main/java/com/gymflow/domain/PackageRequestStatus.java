package com.gymflow.domain;

/** Trạng thái đơn hội viên tự đăng ký gói. Chỉ PENDING mới được duyệt, từ chối hoặc huỷ. */
public enum PackageRequestStatus {
    PENDING, APPROVED, REJECTED, CANCELLED
}
