package com.gymflow.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** V53 · Mã hoá chuỗi thành ma trận QR (không viền). Giao diện tự vẽ bằng SVG nên không cần ảnh hay thư viện ở trình duyệt. */
public final class QrMatrix {
    private QrMatrix() {
    }

    public static List<String> encode(String text) {
        try {
            BitMatrix m = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 0, 0, Map.of(
                    EncodeHintType.MARGIN, 0,
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.CHARACTER_SET, "UTF-8"));
            List<String> rows = new ArrayList<>(m.getHeight());
            for (int y = 0; y < m.getHeight(); y++) {
                StringBuilder sb = new StringBuilder(m.getWidth());
                for (int x = 0; x < m.getWidth(); x++) sb.append(m.get(x, y) ? '1' : '0');
                rows.add(sb.toString());
            }
            return rows;
        } catch (WriterException e) {
            throw new IllegalStateException("Không tạo được mã QR", e);
        }
    }
}
