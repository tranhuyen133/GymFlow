package com.gymflow.service.mail;

import java.util.ArrayList;
import java.util.List;

/**
 * V55 · Khung email HTML chung của GymFlow, cùng nhận diện với web (nền tối #141415, xanh #00b24b → #00d95b, bo góc 20px).
 * Viết bằng bảng + style inline vì Gmail bỏ phần lớn CSS hiện đại; có khối @media cho điện thoại và chế độ tối.
 * Mỗi khối thêm vào đồng thời sinh bản chữ trơn (multipart/alternative) để không bị lọc thư rác.
 * Mọi chữ truyền vào đều được escape – không bao giờ chèn HTML từ dữ liệu người dùng.
 */
public final class EmailLayout {

    public static final String GREEN = "#00b24b";
    public static final String GREEN_BRIGHT = "#00d95b";
    public static final String CANVAS = "#141415";
    public static final String INK = "#16181d";
    public static final String MUTED = "#5a6170";
    public static final String FAINT = "#8a909c";
    public static final String TILE = "#f5f6f8";
    public static final String LINE = "#e9ebef";
    private static final String FONT = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    private static final String GRAD = "linear-gradient(100deg," + GREEN + " 0%," + GREEN_BRIGHT + " 100%)";

    public enum Tone { SUCCESS, WARNING, INFO }

    public record Stat(String value, String label) {}

    public record Item(String title, String detail, String meta) {}

    public record Rendered(String subject, String html, String text) {}

    private final boolean en;
    private final StringBuilder body = new StringBuilder();
    private final StringBuilder text = new StringBuilder();
    private String preheader = "";
    private String eyebrow = "";
    private String footerReason = "";
    private final List<String[]> footerLinks = new ArrayList<>();

    private EmailLayout(boolean en) {
        this.en = en;
    }

    public static EmailLayout create(boolean en) {
        return new EmailLayout(en);
    }

    /** Dòng xem trước hiện cạnh tiêu đề trong hộp thư (không hiện trong thân email). */
    public EmailLayout preheader(String s) {
        preheader = s == null ? "" : s;
        return this;
    }

    /** Nhãn nhỏ góc phải đầu thư, ví dụ "Nhắc gia hạn". */
    public EmailLayout eyebrow(String s) {
        eyebrow = s == null ? "" : s;
        return this;
    }

    public EmailLayout title(String s) {
        body.append("<h1 class=\"gf-ink gf-h1\" style=\"margin:0 0 14px;font:800 26px/1.25 ").append(FONT)
                .append(";color:").append(INK).append(";letter-spacing:-0.4px\">").append(esc(s)).append("</h1>");
        text.append(s).append("\n").append("=".repeat(Math.min(60, Math.max(3, s.length())))).append("\n\n");
        return this;
    }

    public EmailLayout paragraph(String s) {
        body.append("<p class=\"gf-ink\" style=\"margin:0 0 16px;font:400 15px/1.65 ").append(FONT)
                .append(";color:").append(INK).append("\">").append(esc(s)).append("</p>");
        text.append(s).append("\n\n");
        return this;
    }

    public EmailLayout muted(String s) {
        body.append("<p class=\"gf-muted\" style=\"margin:0 0 16px;font:400 13px/1.6 ").append(FONT)
                .append(";color:").append(MUTED).append("\">").append(esc(s)).append("</p>");
        text.append(s).append("\n\n");
        return this;
    }

    /** Mã lớn dễ đọc, dễ sao chép (mã xác thực, mã ưu đãi). */
    public EmailLayout code(String code, String caption) {
        body.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:4px 0 18px\"><tr>")
                .append("<td class=\"gf-tile\" align=\"center\" style=\"background:").append(TILE).append(";border-radius:16px;padding:20px 12px\">")
                .append("<div class=\"gf-ink\" style=\"font:800 34px/1.1 'SFMono-Regular',Consolas,'Courier New',monospace;letter-spacing:8px;color:")
                .append(INK).append("\">").append(esc(code)).append("</div>");
        if (caption != null && !caption.isBlank()) {
            body.append("<div class=\"gf-muted\" style=\"margin-top:8px;font:500 12px/1.4 ").append(FONT).append(";color:")
                    .append(MUTED).append("\">").append(esc(caption)).append("</div>");
        }
        body.append("</td></tr></table>");
        text.append("    ").append(code).append("\n");
        if (caption != null && !caption.isBlank()) text.append("    ").append(caption).append("\n");
        text.append("\n");
        return this;
    }

    /** Hàng ô số liệu (tối đa 3 ô một hàng), giống thẻ Stat trên web. */
    public EmailLayout stats(List<Stat> stats) {
        if (stats == null || stats.isEmpty()) return this;
        body.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:4px 0 18px\">");
        for (int i = 0; i < stats.size(); i += 3) {
            List<Stat> row = stats.subList(i, Math.min(stats.size(), i + 3));
            body.append("<tr>");
            for (int j = 0; j < row.size(); j++) {
                Stat st = row.get(j);
                body.append("<td class=\"gf-stat\" width=\"").append(100 / row.size()).append("%\" valign=\"top\" style=\"padding:")
                        .append(j == 0 ? "0 5px 10px 0" : j == row.size() - 1 ? "0 0 10px 5px" : "0 5px 10px 5px").append("\">")
                        .append("<div class=\"gf-tile\" style=\"background:").append(TILE).append(";border-radius:14px;padding:14px 14px 12px\">")
                        .append("<div style=\"font:800 24px/1.1 ").append(FONT).append(";color:").append(GREEN).append("\">").append(esc(st.value())).append("</div>")
                        .append("<div class=\"gf-muted\" style=\"margin-top:6px;font:600 12px/1.35 ").append(FONT).append(";color:").append(MUTED)
                        .append(";text-transform:uppercase;letter-spacing:0.4px\">").append(esc(st.label())).append("</div>")
                        .append("</div></td>");
                text.append("- ").append(st.label()).append(": ").append(st.value()).append("\n");
            }
            body.append("</tr>");
        }
        body.append("</table>");
        text.append("\n");
        return this;
    }

    /** Danh sách có tiêu đề nhỏ (lịch tập, hội viên vắng…). */
    public EmailLayout list(String heading, List<Item> items) {
        if (items == null || items.isEmpty()) return this;
        if (heading != null && !heading.isBlank()) {
            body.append("<div class=\"gf-muted\" style=\"margin:6px 0 8px;font:700 12px/1.4 ").append(FONT).append(";color:").append(MUTED)
                    .append(";text-transform:uppercase;letter-spacing:0.6px\">").append(esc(heading)).append("</div>");
            text.append(heading.toUpperCase()).append("\n");
        }
        body.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:0 0 18px\">");
        for (int i = 0; i < items.size(); i++) {
            Item it = items.get(i);
            String border = i == items.size() - 1 ? "none" : "1px solid " + LINE;
            body.append("<tr><td class=\"gf-line\" style=\"padding:11px 0;border-bottom:").append(border).append("\">")
                    .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>")
                    .append("<td width=\"10\" valign=\"top\" style=\"padding-top:7px\"><div style=\"width:8px;height:8px;border-radius:4px;background:")
                    .append(GREEN).append("\"></div></td>")
                    .append("<td valign=\"top\" style=\"padding-left:10px\">")
                    .append("<div class=\"gf-ink\" style=\"font:700 15px/1.4 ").append(FONT).append(";color:").append(INK).append("\">").append(esc(it.title())).append("</div>");
            if (it.detail() != null && !it.detail().isBlank()) {
                body.append("<div class=\"gf-muted\" style=\"margin-top:2px;font:400 13px/1.5 ").append(FONT).append(";color:").append(MUTED).append("\">")
                        .append(esc(it.detail())).append("</div>");
            }
            body.append("</td>");
            if (it.meta() != null && !it.meta().isBlank()) {
                body.append("<td align=\"right\" valign=\"top\" style=\"white-space:nowrap;padding-left:12px;font:700 13px/1.4 ").append(FONT)
                        .append(";color:").append(GREEN).append("\">").append(esc(it.meta())).append("</td>");
            }
            body.append("</tr></table></td></tr>");
            text.append("  • ").append(it.title());
            if (it.meta() != null && !it.meta().isBlank()) text.append(" (").append(it.meta()).append(")");
            if (it.detail() != null && !it.detail().isBlank()) text.append(" – ").append(it.detail());
            text.append("\n");
        }
        body.append("</table>");
        text.append("\n");
        return this;
    }

    /** Hộp nhấn mạnh có màu (giống Alert trên web). */
    public EmailLayout callout(Tone tone, String title, String s) {
        String bg = switch (tone) { case SUCCESS -> "#e7f8ee"; case WARNING -> "#fff4e0"; case INFO -> "#e8f1ff"; };
        String ink = switch (tone) { case SUCCESS -> "#0b6b30"; case WARNING -> "#7a4b00"; case INFO -> "#0b4fa8"; };
        String bar = switch (tone) { case SUCCESS -> GREEN; case WARNING -> "#ffb020"; case INFO -> "#3d97ff"; };
        body.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:4px 0 18px\"><tr>")
                .append("<td style=\"background:").append(bg).append(";border-left:4px solid ").append(bar)
                .append(";border-radius:12px;padding:14px 16px;font:400 14px/1.55 ").append(FONT).append(";color:").append(ink).append("\">");
        if (title != null && !title.isBlank()) body.append("<b style=\"display:block;margin-bottom:4px\">").append(esc(title)).append("</b>");
        body.append(esc(s)).append("</td></tr></table>");
        text.append(title == null || title.isBlank() ? "" : title + ": ").append(s).append("\n\n");
        return this;
    }

    /** Nút chính – kiểu "bulletproof" (bảng + nền màu) để Outlook/Gmail đều hiện đúng. */
    public EmailLayout button(String label, String url) {
        body.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:8px 0 22px\"><tr>")
                .append("<td align=\"center\" bgcolor=\"").append(GREEN).append("\" style=\"border-radius:12px;background:").append(GREEN)
                .append(";background-image:").append(GRAD).append("\">")
                .append("<a href=\"").append(escAttr(url)).append("\" target=\"_blank\" style=\"display:inline-block;padding:14px 28px;font:700 15px/1 ")
                .append(FONT).append(";color:#ffffff;text-decoration:none;border-radius:12px\">").append(esc(label)).append(" &rarr;</a>")
                .append("</td></tr></table>");
        text.append(label).append(": ").append(url).append("\n\n");
        return this;
    }

    public EmailLayout link(String label, String url) {
        body.append("<p style=\"margin:0 0 16px;font:600 14px/1.5 ").append(FONT).append("\"><a href=\"").append(escAttr(url))
                .append("\" target=\"_blank\" style=\"color:").append(GREEN).append(";text-decoration:none\">").append(esc(label)).append(" &rarr;</a></p>");
        text.append(label).append(": ").append(url).append("\n\n");
        return this;
    }

    public EmailLayout divider() {
        body.append("<div class=\"gf-line\" style=\"height:1px;line-height:1px;font-size:0;background:").append(LINE).append(";margin:6px 0 20px\">&nbsp;</div>");
        text.append("------------------------------\n\n");
        return this;
    }

    /** Lý do nhận email ở chân thư (bắt buộc với email tự động). */
    public EmailLayout reason(String s) {
        footerReason = s == null ? "" : s;
        return this;
    }

    public EmailLayout footerLink(String label, String url) {
        if (url != null && !url.isBlank()) footerLinks.add(new String[]{label, url});
        return this;
    }

    public Rendered render(String subject) {
        String lang = en ? "en" : "vi";
        StringBuilder h = new StringBuilder(8192);
        h.append("<!DOCTYPE html><html lang=\"").append(lang).append("\" xmlns=\"http://www.w3.org/1999/xhtml\"><head>")
                .append("<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">")
                .append("<meta name=\"color-scheme\" content=\"light dark\"><meta name=\"supported-color-schemes\" content=\"light dark\">")
                .append("<title>").append(esc(subject)).append("</title><style>")
                .append("body{margin:0;padding:0;-webkit-text-size-adjust:100%}a{color:").append(GREEN).append("}")
                .append("@media (max-width:620px){.gf-card{padding:26px 20px 22px !important}.gf-h1{font-size:22px !important}")
                .append(".gf-stat{display:block !important;width:100% !important;padding:0 0 10px 0 !important}.gf-head{padding:18px 20px !important}}")
                .append("@media (prefers-color-scheme:dark){.gf-body{background:").append(CANVAS).append(" !important}")
                .append(".gf-card{background:#202125 !important}.gf-ink{color:#f0f2f5 !important}.gf-muted{color:#9aa1b1 !important}")
                .append(".gf-tile{background:#2e3035 !important}.gf-line{border-color:#2d2f33 !important;background:#2d2f33 !important}}")
                .append("</style></head>")
                .append("<body class=\"gf-body\" style=\"margin:0;padding:0;background:").append(TILE).append("\">")
                .append("<div style=\"display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all\">")
                .append(esc(preheader)).append("&#847;&zwnj;&nbsp;".repeat(30)).append("</div>")
                .append("<table role=\"presentation\" class=\"gf-body\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:")
                .append(TILE).append("\"><tr><td align=\"center\" style=\"padding:28px 12px\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width:600px\">")
                // Đầu thư: nền tối + logo chữ, giống thanh bên của web
                .append("<tr><td class=\"gf-head\" style=\"background:").append(CANVAS).append(";border-radius:20px 20px 0 0;padding:22px 30px\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>")
                .append("<td style=\"font:800 22px/1 ").append(FONT).append(";color:#ffffff\">")
                .append("<span style=\"display:inline-block;width:28px;height:28px;border-radius:9px;background:").append(GREEN)
                .append(";background-image:").append(GRAD).append(";vertical-align:middle;text-align:center;font:900 16px/28px ").append(FONT)
                .append(";color:#ffffff;margin-right:10px\">G</span>")
                .append("<span style=\"vertical-align:middle;font-style:italic;letter-spacing:-0.5px\">Gym<span style=\"color:").append(GREEN_BRIGHT).append("\">Flow</span></span></td>")
                .append("<td align=\"right\" style=\"font:600 12px/1.3 ").append(FONT).append(";color:#9aa1b1;text-transform:uppercase;letter-spacing:0.8px\">")
                .append(esc(eyebrow)).append("</td></tr></table></td></tr>")
                .append("<tr><td style=\"height:4px;line-height:4px;font-size:0;background:").append(GREEN).append(";background-image:").append(GRAD).append("\">&nbsp;</td></tr>")
                // Thân thư
                .append("<tr><td class=\"gf-card\" style=\"background:#ffffff;border-radius:0 0 20px 20px;padding:34px 34px 26px\">")
                .append(body)
                .append("</td></tr>")
                // Chân thư
                .append("<tr><td align=\"center\" class=\"gf-muted\" style=\"padding:20px 16px 4px;font:400 12px/1.7 ").append(FONT).append(";color:").append(FAINT).append("\">");
        if (!footerReason.isBlank()) h.append(esc(footerReason)).append("<br>");
        for (int i = 0; i < footerLinks.size(); i++) {
            String[] l = footerLinks.get(i);
            if (i > 0) h.append(" &nbsp;·&nbsp; ");
            h.append("<a href=\"").append(escAttr(l[1])).append("\" target=\"_blank\" style=\"color:").append(FAINT).append(";text-decoration:underline\">")
                    .append(esc(l[0])).append("</a>");
        }
        h.append("<br>GymFlow &middot; ").append(en ? "Train with a plan. Measure your progress." : "Tập có kế hoạch. Tiến bộ đo được.")
                .append("</td></tr></table></td></tr></table></body></html>");

        StringBuilder t = new StringBuilder(text);
        t.append("--\nGymFlow\n");
        if (!footerReason.isBlank()) t.append(footerReason).append("\n");
        for (String[] l : footerLinks) t.append(l[0]).append(": ").append(l[1]).append("\n");
        return new Rendered(subject, h.toString(), t.toString());
    }

    public static String esc(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '<' -> b.append("&lt;");
                case '>' -> b.append("&gt;");
                case '&' -> b.append("&amp;");
                case '"' -> b.append("&quot;");
                case '\'' -> b.append("&#39;");
                default -> b.append(c);
            }
        }
        return b.toString();
    }

    /** Chỉ cho liên kết http(s) hoặc mailto vào href, còn lại thay bằng "#". */
    static String escAttr(String url) {
        if (url == null) return "#";
        String u = url.trim();
        String lower = u.toLowerCase();
        if (!(lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("mailto:"))) return "#";
        return esc(u);
    }
}
