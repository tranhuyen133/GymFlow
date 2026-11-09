package com.gymflow.domain;

/** Cách hội viên trả tiền cho đơn đăng ký gói (V12). */
public enum PaymentMethod {
    /** Trả tại quầy lễ tân (tiền mặt / quẹt thẻ). */
    COUNTER,
    /** Chuyển khoản theo mã QR ngân hàng của phòng tập; quản lý đối chiếu sao kê rồi duyệt. */
    BANK_TRANSFER
}
