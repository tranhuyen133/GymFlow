package com.gymflow.config;

import org.junit.jupiter.api.Test;

import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Chặn lỗi trùng version Flyway khi nhiều nhánh cùng thêm migration.
 * Flyway sẽ dừng ứng dụng nếu hai file cùng version; test này phát hiện sớm ngay trong CI.
 */
class FlywayMigrationGuardTest {

    private static final Pattern MIGRATION = Pattern.compile("^V(\\d+(?:\\.\\d+)*)__(.+)\\.sql$");

    @Test
    void versionsAreUniqueAndFileNameIsWellFormed() throws Exception {
        URL resource = getClass().getResource("/db/migration");
        assertThat(resource).as("Không tìm thấy thư mục db/migration trong classpath").isNotNull();
        Path dir = Paths.get(resource.toURI());

        List<String> problems = new ArrayList<>();
        Map<String, String> byVersion = new HashMap<>();
        try (var files = Files.list(dir)) {
            for (Path path : files.filter(p -> p.toString().endsWith(".sql")).toList()) {
                String name = path.getFileName().toString();
                Matcher matcher = MIGRATION.matcher(name);
                if (!matcher.matches()) {
                    problems.add("Sai định dạng tên migration: " + name);
                    continue;
                }
                String version = matcher.group(1);
                String previous = byVersion.putIfAbsent(version, name);
                if (previous != null) {
                    problems.add("Trùng version V" + version + ": " + previous + " và " + name);
                }
            }
        }

        assertThat(problems)
                .as("Migration Flyway phải có version duy nhất, đúng định dạng V<số>__mô_tả.sql")
                .isEmpty();
    }
}
