package com.gymflow.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymflow.domain.ArticleCategory;
import com.gymflow.domain.ContentOrigin;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử tính toàn vẹn và hợp lệ của dữ liệu khởi tạo (Seed Data):
 * - articles.json (SCRUM-221): Bài viết mẫu có nguồn, phân loại SELF_AUTHORED / ADAPTED.
 * - exercises.json (SCRUM-173): Bài tập mẫu có kỹ thuật, cách thở, lưu ý an toàn, nguồn y tế.
 */
class SeedDataJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

    @Test
    @DisplayName("SCRUM-221: articles.json hợp lệ, đủ 10 bài viết mẫu có nguồn, bao phủ 5 chủ đề và 2 loại xuất xứ")
    void testArticlesJsonCompletenessAndIntegrity() throws Exception {
        try (InputStream is = getClass().getResourceAsStream("/seed/articles.json")) {
            assertThat(is).as("Không tìm thấy file seed/articles.json trên classpath").isNotNull();

            List<DataSeeder.SeedArticleItem> articles = objectMapper.readValue(is, new TypeReference<>() {});
            assertThat(articles).as("articles.json phải có ít nhất 10 bài viết mẫu").hasSizeGreaterThanOrEqualTo(10);

            Set<String> slugs = new HashSet<>();
            Set<ArticleCategory> categoriesFound = new HashSet<>();
            Set<ContentOrigin> originsFound = new HashSet<>();

            for (DataSeeder.SeedArticleItem a : articles) {
                // Kiểm tra Slug
                assertThat(a.slug()).as("Slug không được rỗng").isNotBlank();
                assertThat(SLUG_PATTERN.matcher(a.slug()).matches())
                        .as("Slug '%s' phải đúng định dạng chữ thường gạch ngang", a.slug()).isTrue();
                assertThat(slugs.add(a.slug())).as("Slug '%s' không được trùng lặp", a.slug()).isTrue();

                // Kiểm tra Tiêu đề, Tóm tắt, Thân bài
                assertThat(a.title()).as("Tiêu đề của '%s' không được rỗng", a.slug()).isNotBlank();
                assertThat(a.title().length()).as("Tiêu đề '%s' không vượt quá 200 ký tự", a.slug()).isLessThanOrEqualTo(200);

                assertThat(a.summary()).as("Tóm tắt của '%s' không được rỗng", a.slug()).isNotBlank();
                assertThat(a.summary().length()).as("Tóm tắt '%s' không vượt quá 500 ký tự", a.slug()).isLessThanOrEqualTo(500);

                assertThat(a.body()).as("Nội dung của '%s' không được rỗng", a.slug()).isNotBlank();
                assertThat(a.body()).as("Nội dung '%s' phải có tiêu đề mục theo cú pháp markdown '## '", a.slug()).contains("## ");

                // Kiểm tra Phân loại chủ đề
                assertThat(a.category()).as("Chủ đề của '%s' không được null", a.slug()).isNotNull();
                categoriesFound.add(a.category());

                // Kiểm tra Xuất xứ nội dung
                assertThat(a.contentOrigin()).as("Xuất xứ của '%s' không được null", a.slug()).isNotNull();
                originsFound.add(a.contentOrigin());

                // Kiểm tra Nguồn trích dẫn (Bắt buộc phải có nguồn theo yêu cầu SCRUM-221)
                assertThat(a.sources()).as("Bài viết '%s' phải có ít nhất một nguồn trích dẫn", a.slug()).isNotEmpty();
                for (DataSeeder.SeedSourceItem s : a.sources()) {
                    assertThat(s.code()).as("Mã nguồn của bài '%s' không được rỗng", a.slug()).isNotBlank();
                    assertThat(s.title()).as("Tên tài liệu nguồn của bài '%s' không được rỗng", a.slug()).isNotBlank();
                    assertThat(s.url()).as("URL nguồn của bài '%s' không được rỗng", a.slug()).startsWith("http");
                }

                // Ghi chú rà soát
                assertThat(a.reviewNote()).as("Bài viết '%s' phải có ghi chú rà soát / nguồn đối chiếu", a.slug()).isNotBlank();
            }

            // Đảm bảo đủ cả 5 chủ đề: NUTRITION, HYDRATION, SLEEP, ACTIVITY, RECOVERY
            assertThat(categoriesFound).as("articles.json phải bao phủ đầy đủ cả 5 chủ đề kiến thức")
                    .containsExactlyInAnyOrder(ArticleCategory.values());

            // Đảm bảo có cả bài tự biên soạn (SELF_AUTHORED) và phóng tác (ADAPTED)
            assertThat(originsFound).as("articles.json phải có cả 2 loại: SELF_AUTHORED và ADAPTED")
                    .contains(ContentOrigin.SELF_AUTHORED, ContentOrigin.ADAPTED);
        }
    }

    @Test
    @DisplayName("SCRUM-173: exercises.json hợp lệ, đầy đủ cách thở, lỗi thường gặp, lưu ý an toàn và nguồn y tế")
    void testExercisesJsonIntegrity() throws Exception {
        try (InputStream is = getClass().getResourceAsStream("/seed/exercises.json")) {
            assertThat(is).as("Không tìm thấy file seed/exercises.json trên classpath").isNotNull();

            List<DataSeeder.SeedExerciseItem> exercises = objectMapper.readValue(is, new TypeReference<>() {});
            assertThat(exercises).as("exercises.json phải có ít nhất 10 bài tập mẫu").hasSizeGreaterThanOrEqualTo(10);

            for (DataSeeder.SeedExerciseItem e : exercises) {
                assertThat(e.name()).as("Tên bài tập không được rỗng").isNotBlank();
                assertThat(e.muscleGroup()).as("Nhóm cơ của bài '%s' không được null", e.name()).isNotNull();
                assertThat(e.instructions()).as("Hướng dẫn bài '%s' không được rỗng", e.name()).isNotBlank();
                assertThat(e.breathing()).as("Cách hít thở bài '%s' không được rỗng", e.name()).isNotBlank();
                assertThat(e.commonMistakes()).as("Lỗi thường gặp bài '%s' không được rỗng", e.name()).isNotBlank();
                assertThat(e.safetyNotes()).as("Lưu ý an toàn bài '%s' không được rỗng", e.name()).isNotBlank();
                assertThat(e.sources()).as("Bài tập '%s' phải có nguồn tham khảo", e.name()).isNotEmpty();
            }
        }
    }
}
