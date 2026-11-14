package com.gymflow.service;

import com.gymflow.common.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AttachmentRulesTest {

    private static byte[] bytes(int... v) {
        byte[] b = new byte[Math.max(v.length, 16)];
        for (int i = 0; i < v.length; i++) b[i] = (byte) v[i];
        return b;
    }

    private static byte[] ascii(String s, int pad) {
        byte[] head = s.getBytes(StandardCharsets.ISO_8859_1);
        return Arrays.copyOf(head, Math.max(head.length, pad));
    }

    private static final byte[] JPG = bytes(0xFF, 0xD8, 0xFF, 0xE0);
    private static final byte[] PNG = bytes(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A);
    private static final byte[] PDF = ascii("%PDF-1.7", 16);
    private static final byte[] MP4 = ascii("\0\0\0\u0018ftypisom", 16);
    private static final byte[] MOV = ascii("\0\0\0\u0014ftypqt  ", 16);
    private static final byte[] ZIP = bytes('P', 'K', 3, 4);
    private static final byte[] EXE = ascii("MZ\u0090\0", 16);

    @Test
    @DisplayName("Nhận diện đúng ảnh, video, tệp theo nội dung + đuôi")
    void detectsSupportedTypes() {
        assertThat(AttachmentRules.detect(JPG, "anh.JPG").kind()).isEqualTo("IMAGE");
        assertThat(AttachmentRules.detect(PNG, "bang-tien-do.png").contentType()).isEqualTo("image/png");
        assertThat(AttachmentRules.detect(ascii("RIFF\0\0\0\0WEBPVP8 ", 16), "a.webp").kind()).isEqualTo("IMAGE");
        assertThat(AttachmentRules.detect(ascii("GIF89a", 16), "a.gif").kind()).isEqualTo("IMAGE");
        assertThat(AttachmentRules.detect(MP4, "squat.mp4").kind()).isEqualTo("VIDEO");
        assertThat(AttachmentRules.detect(MOV, "IMG_0001.MOV").contentType()).isEqualTo("video/quicktime");
        assertThat(AttachmentRules.detect(bytes(0x1A, 0x45, 0xDF, 0xA3), "clip.webm").kind()).isEqualTo("VIDEO");
        assertThat(AttachmentRules.detect(PDF, "giao-an.pdf").kind()).isEqualTo("FILE");
        assertThat(AttachmentRules.detect(ZIP, "thuc-don.docx").kind()).isEqualTo("FILE");
        assertThat(AttachmentRules.detect(bytes(0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1), "cu.xls").kind()).isEqualTo("FILE");
        assertThat(AttachmentRules.detect("Ngày,Cân nặng\n1/11,70".getBytes(StandardCharsets.UTF_8), "can-nang.csv").kind()).isEqualTo("FILE");
    }

    @Test
    @DisplayName("Chặn tệp đổi đuôi: .exe đổi thành .jpg, PDF đổi thành .png, MOV đặt đuôi .mp4")
    void rejectsMismatchedContent() {
        assertThatThrownBy(() -> AttachmentRules.detect(EXE, "anh.jpg")).isInstanceOf(ApiException.class).hasMessageContaining("không khớp");
        assertThatThrownBy(() -> AttachmentRules.detect(PDF, "anh.png")).hasMessageContaining("không khớp");
        assertThatThrownBy(() -> AttachmentRules.detect(MOV, "video.mp4")).hasMessageContaining("không khớp");
        assertThatThrownBy(() -> AttachmentRules.detect(PNG, "ghi-chu.txt")).hasMessageContaining("không khớp");
        assertThatThrownBy(() -> AttachmentRules.detect(new byte[]{(byte) 0xC3, 0x28}, "loi.txt")).hasMessageContaining("không khớp");
    }

    @Test
    @DisplayName("Chặn định dạng không hỗ trợ, tệp rỗng và tệp không có đuôi")
    void rejectsUnsupported() {
        assertThatThrownBy(() -> AttachmentRules.detect(EXE, "setup.exe")).hasMessageContaining("không được hỗ trợ");
        assertThatThrownBy(() -> AttachmentRules.detect(ascii("<html>", 16), "trang.html")).hasMessageContaining("không được hỗ trợ");
        assertThatThrownBy(() -> AttachmentRules.detect(ascii("<svg>", 16), "logo.svg")).hasMessageContaining("không được hỗ trợ");
        assertThatThrownBy(() -> AttachmentRules.detect(JPG, "khongduoi")).hasMessageContaining("không được hỗ trợ");
        assertThatThrownBy(() -> AttachmentRules.detect(new byte[0], "a.jpg")).hasMessageContaining("rỗng");
        assertThatThrownBy(() -> AttachmentRules.detect(null, "a.jpg")).hasMessageContaining("rỗng");
    }

    @Test
    @DisplayName("Giới hạn dung lượng theo loại: ảnh 10 MB, video 25 MB, tệp 10 MB (đúng biên)")
    void enforcesSizePerKind() {
        byte[] img = Arrays.copyOf(JPG, (int) AttachmentRules.MAX_IMAGE);
        assertThat(AttachmentRules.detect(img, "a.jpg").kind()).isEqualTo("IMAGE");
        byte[] imgOver = Arrays.copyOf(JPG, (int) AttachmentRules.MAX_IMAGE + 1);
        assertThatThrownBy(() -> AttachmentRules.detect(imgOver, "a.jpg")).hasMessage("Ảnh tối đa 10 MB");
        byte[] vid = Arrays.copyOf(MP4, (int) (20 * AttachmentRules.MB));
        assertThat(AttachmentRules.detect(vid, "a.mp4").kind()).isEqualTo("VIDEO");
        byte[] vidOver = Arrays.copyOf(MP4, (int) AttachmentRules.MAX_VIDEO + 1);
        assertThatThrownBy(() -> AttachmentRules.detect(vidOver, "a.mp4")).hasMessage("Video tối đa 25 MB");
        byte[] pdfOver = Arrays.copyOf(PDF, (int) AttachmentRules.MAX_FILE + 1);
        assertThatThrownBy(() -> AttachmentRules.detect(pdfOver, "a.pdf")).hasMessage("Tệp tối đa 10 MB");
    }

    @Test
    @DisplayName("Tên tệp: bỏ đường dẫn, ký tự điều khiển / vô hình / ký tự cấm, cắt dài nhưng giữ đuôi")
    void sanitizesFileNames() {
        assertThat(AttachmentRules.sanitizeFileName("C:\\Users\\a\\Ảnh   tập.jpg", null)).isEqualTo("Ảnh tập.jpg");
        assertThat(AttachmentRules.sanitizeFileName("../../etc/passwd.txt", null)).isEqualTo("passwd.txt");
        assertThat(AttachmentRules.sanitizeFileName("bad\u0000na\u200Bme<>|?.pdf", null)).isEqualTo("badname.pdf");
        assertThat(AttachmentRules.sanitizeFileName("  ...giao-an.pdf.  ", null)).isEqualTo("giao-an.pdf");
        assertThat(AttachmentRules.sanitizeFileName("", "jpg")).isEqualTo("tep-dinh-kem.jpg");
        assertThat(AttachmentRules.sanitizeFileName(null, null)).isEqualTo("tep-dinh-kem");
        String longName = "a".repeat(300) + ".docx";
        String s = AttachmentRules.sanitizeFileName(longName, null);
        assertThat(s).endsWith(".docx");
        assertThat(s.length()).isEqualTo(AttachmentRules.MAX_NAME);
        assertThat(AttachmentRules.sanitizeFileName("Tie\u0301n.png", null)).isEqualTo("Ti\u00e9n.png");
    }

    @Test
    @DisplayName("Chỉ ảnh / video xem trực tiếp, tệp khác luôn tải xuống")
    void inlineOnlyForMedia() {
        assertThat(AttachmentRules.inline("IMAGE")).isTrue();
        assertThat(AttachmentRules.inline("VIDEO")).isTrue();
        assertThat(AttachmentRules.inline("FILE")).isFalse();
        assertThat(AttachmentRules.inline(null)).isFalse();
    }
}
