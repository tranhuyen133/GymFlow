package com.gymflow.domain;

/**
 * V49 · Yêu cầu điều chỉnh gói hội viên gửi cho quản lý duyệt.
 * CHANGE_START: dời ngày bắt đầu gói chưa tới ngày · PAUSE: bảo lưu, cộng thêm ngày vào cuối gói · CHANGE_TRAINER: đổi HLV.
 */
public enum ChangeRequestType {
    CHANGE_START, PAUSE, CHANGE_TRAINER
}
