package com.gymflow.service;

import com.gymflow.common.ApiException;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Quy tắc tệp đính kèm tin nhắn. Thuần Java (không Spring) để kiểm thử mọi trường hợp.
 *
 * <ul>
 *   <li>Không tin Content-Type / đuôi tệp do trình duyệt gửi: loại tệp xác định từ các byte đầu (magic bytes),
 *       và đuôi tệp phải khớp với loại nhận diện được (chặn đổi tên .exe → .jpg, .html → .png…).</li>
 *   <li>Giới hạn: ảnh 10 MB (JPG, PNG, WebP, GIF), video 25 MB (MP4, MOV, WebM),
 *       tệp 10 MB (PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP).</li>
 * </ul>
 */
public final class AttachmentRules {

    public static final long MB = 1024L * 1024L;
    public static final long MAX_IMAGE = 10 * MB;
    public static final long MAX_VIDEO = 25 * MB;
    public static final long MAX_FILE = 10 * MB;
    public static final long DAILY_QUOTA = 200 * MB;
    public static final int MAX_NAME = 120;

    public record Detected(String kind, String contentType, String extension) {
    }

    private record Rule(String kind, String contentType, long max) {
    }

    private static final Map<String, Rule> BY_EXT = Map.ofEntries(
            Map.entry("jpg", new Rule("IMAGE", "image/jpeg", MAX_IMAGE)),
            Map.entry("jpeg", new Rule("IMAGE", "image/jpeg", MAX_IMAGE)),
            Map.entry("png", new Rule("IMAGE", "image/png", MAX_IMAGE)),
            Map.entry("webp", new Rule("IMAGE", "image/webp", MAX_IMAGE)),
            Map.entry("gif", new Rule("IMAGE", "image/gif", MAX_IMAGE)),
            Map.entry("mp4", new Rule("VIDEO", "video/mp4", MAX_VIDEO)),
            Map.entry("m4v", new Rule("VIDEO", "video/mp4", MAX_VIDEO)),
            Map.entry("mov", new Rule("VIDEO", "video/quicktime", MAX_VIDEO)),
            Map.entry("webm", new Rule("VIDEO", "video/webm", MAX_VIDEO)),
            Map.entry("pdf", new Rule("FILE", "application/pdf", MAX_FILE)),
            Map.entry("doc", new Rule("FILE", "application/msword", MAX_FILE)),
            Map.entry("xls", new Rule("FILE", "application/vnd.ms-excel", MAX_FILE)),
            Map.entry("ppt", new Rule("FILE", "application/vnd.ms-powerpoint", MAX_FILE)),
            Map.entry("docx", new Rule("FILE", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", MAX_FILE)),
            Map.entry("xlsx", new Rule("FILE", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", MAX_FILE)),
            Map.entry("pptx", new Rule("FILE", "application/vnd.openxmlformats-officedocument.presentationml.presentation", MAX_FILE)),
            Map.entry("zip", new Rule("FILE", "application/zip", MAX_FILE)),
            Map.entry("txt", new Rule("FILE", "text/plain; charset=utf-8", MAX_FILE)),
            Map.entry("csv", new Rule("FILE", "text/csv; charset=utf-8", MAX_FILE)));

    private static final Set<String> OLE = Set.of("doc", "xls", "ppt");
    private static final Set<String> ZIP = Set.of("docx", "xlsx", "pptx", "zip");
    private static final Set<String> TEXT = Set.of("txt", "csv");

    private AttachmentRules() {
    }

    /** Đuôi tệp (chữ thường, không dấu chấm) hoặc "" nếu không có. */
    public static String extensionOf(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        return dot < 0 || dot == name.length() - 1 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /**
     * Chuẩn hoá tên tệp hiển thị: bỏ đường dẫn, ký tự điều khiển / vô hình, ký tự cấm trên hệ điều hành,
     * gộp khoảng trắng, NFC, tối đa {@value #MAX_NAME} ký tự nhưng giữ nguyên đuôi.
     */
    public static String sanitizeFileName(String raw, String fallbackExt) {
        String s = raw == null ? "" : raw;
        s = s.substring(Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\')) + 1);
        s = Normalizer.normalize(s, Normalizer.Form.NFC)
                .replaceAll("[\\p{Cntrl}\\p{Cf}]", "")
                .replaceAll("[<>:\"|?*]", "")
                .replaceAll("\\s+", " ")
                .trim();
        s = s.replaceAll("^[. ]+", "").replaceAll("[. ]+$", "");
        String ext = extensionOf(s);
        if (s.isEmpty() || s.equals("." + ext) || ext.isEmpty()) {
            String base = s.isEmpty() ? "tep-dinh-kem" : s;
            s = fallbackExt == null || fallbackExt.isEmpty() ? base : base + "." + fallbackExt;
            ext = extensionOf(s);
        }
        if (s.codePointCount(0, s.length()) > MAX_NAME) {
            String suffix = ext.isEmpty() ? "" : "." + ext;
            int keep = MAX_NAME - suffix.length();
            String base = s.substring(0, s.length() - suffix.length());
            base = base.substring(0, base.offsetByCodePoints(0, Math.min(keep, base.codePointCount(0, base.length())))).trim();
            s = base + suffix;
        }
        return s;
    }

    /**
     * Xác định loại tệp từ nội dung + đuôi. Ném 400 với thông báo rõ ràng nếu không hợp lệ.
     * Giới hạn dung lượng kiểm tra theo loại (ảnh / video / tệp).
     */
    public static Detected detect(byte[] b, String fileName) {
        if (b == null || b.length == 0) throw ApiException.badRequest("Tệp rỗng, vui lòng chọn tệp khác");
        String ext = extensionOf(fileName);
        Rule rule = BY_EXT.get(ext);
        if (rule == null) {
            throw ApiException.badRequest("Định dạng tệp không được hỗ trợ. Hỗ trợ: ảnh JPG/PNG/WebP/GIF, video MP4/MOV/WebM, "
                    + "tệp PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP");
        }
        if (b.length > rule.max()) {
            String what = switch (rule.kind()) {
                case "IMAGE" -> "Ảnh";
                case "VIDEO" -> "Video";
                default -> "Tệp";
            };
            throw ApiException.badRequest(what + " tối đa " + (rule.max() / MB) + " MB");
        }
        if (!contentMatches(b, ext)) {
            throw ApiException.badRequest("Nội dung tệp không khớp với đuôi tệp – tệp có thể bị hỏng hoặc bị đổi tên");
        }
        return new Detected(rule.kind(), rule.contentType(), ext);
    }

    static boolean contentMatches(byte[] b, String ext) {
        return switch (ext) {
            case "jpg", "jpeg" -> starts(b, 0xFF, 0xD8, 0xFF);
            case "png" -> starts(b, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A);
            case "webp" -> b.length >= 12 && starts(b, 'R', 'I', 'F', 'F') && at(b, 8, 'W', 'E', 'B', 'P');
            case "gif" -> starts(b, 'G', 'I', 'F', '8', '7', 'a') || starts(b, 'G', 'I', 'F', '8', '9', 'a');
            case "mp4", "m4v" -> isFtyp(b) && !at(b, 8, 'q', 't', ' ', ' ');
            case "mov" -> isFtyp(b) && at(b, 8, 'q', 't', ' ', ' ') || isQuickTimeAtom(b);
            case "webm" -> starts(b, 0x1A, 0x45, 0xDF, 0xA3);
            case "pdf" -> starts(b, '%', 'P', 'D', 'F', '-');
            default -> OLE.contains(ext) ? starts(b, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)
                    : ZIP.contains(ext) ? starts(b, 'P', 'K', 0x03, 0x04)
                    : TEXT.contains(ext) && isUtf8Text(b);
        };
    }

    private static boolean isFtyp(byte[] b) {
        return b.length >= 12 && at(b, 4, 'f', 't', 'y', 'p');
    }

    /** MOV cũ không có "ftyp": hộp đầu là moov / mdat / wide / free. */
    private static boolean isQuickTimeAtom(byte[] b) {
        return b.length >= 8 && (at(b, 4, 'm', 'o', 'o', 'v') || at(b, 4, 'm', 'd', 'a', 't')
                || at(b, 4, 'w', 'i', 'd', 'e') || at(b, 4, 'f', 'r', 'e', 'e'));
    }

    /** Văn bản: UTF-8 hợp lệ (có thể có BOM), không chứa byte NUL. */
    static boolean isUtf8Text(byte[] b) {
        for (byte x : b) if (x == 0) return false;
        try {
            StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(b));
            return true;
        } catch (CharacterCodingException e) {
            return false;
        }
    }

    private static boolean starts(byte[] b, int... sig) {
        return at(b, 0, sig);
    }

    private static boolean at(byte[] b, int offset, int... sig) {
        if (b.length < offset + sig.length) return false;
        for (int i = 0; i < sig.length; i++) {
            if ((b[offset + i] & 0xFF) != (sig[i] & 0xFF)) return false;
        }
        return true;
    }

    /** Ảnh / video xem trực tiếp; các tệp khác luôn tải xuống (tránh trình duyệt mở nội dung lạ). */
    public static boolean inline(String kind) {
        return "IMAGE".equals(kind) || "VIDEO".equals(kind);
    }
}
