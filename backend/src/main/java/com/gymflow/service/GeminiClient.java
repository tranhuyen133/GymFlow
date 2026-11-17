package com.gymflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.gymflow.common.ApiException;
import com.gymflow.config.AiConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;

/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Gọi Gemini API.
 *
 * <p>Client REST tối giản cho endpoint Interactions của Google Gemini.
 * Dùng {@link RestClient} có sẵn của Spring, không thêm dependency mới.
 * API key chỉ đọc từ cấu hình backend ({@code gemini.api-key} / biến môi trường
 * {@code GEMINI_API_KEY}), không bao giờ trả về frontend.</p>
 *
 * <p>Tên model đọc từ {@code gemini.model} trong {@code application.yml} (qua
 * {@link AiConfig}), không hard-code trong client: khi một model bị quá tải chỉ cần
 * đổi cấu hình sang model khác mà không phải sửa code.</p>
 */
@Slf4j
@Component
public class GeminiClient {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com";
    private static final String INTERACTIONS_PATH = "/v1beta/interactions";
    private static final String API_REVISION = "2026-05-20";
    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final int MAX_RETRIES = 2;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(2);
    private static final String BUSY_MESSAGE = "Trợ lý đang bận, vui lòng thử lại";
    private static final String BUSY_AFTER_RETRY_MESSAGE = "Trợ lý đang bận, vui lòng thử lại sau ít phút";

    private final AiConfig aiConfig;
    private final RestClient restClient;

    public GeminiClient(AiConfig aiConfig) {
        this.aiConfig = aiConfig;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT);
        requestFactory.setReadTimeout(TIMEOUT);
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Gửi prompt tới Gemini và trả về đoạn text của step {@code model_output}.
     *
     * <p>Tự thử lại tối đa 2 lần, mỗi lần cách 2 giây khi Gemini quá tải
     * ({@code service_unavailable}, HTTP 503 hoặc 429).</p>
     *
     * @throws ApiException khi thiếu API key, Gemini lỗi, phản hồi rỗng hoặc quá thời gian.
     */
    public String ask(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw ApiException.badRequest("Nội dung câu hỏi không được để trống");
        }

        String apiKey = aiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY chưa được cấu hình, không gọi được Gemini");
            throw busy();
        }

        String model = aiConfig.getGeminiModel();
        Map<String, String> body = Map.of(
                "model", model,
                "input", prompt.trim()
        );

        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            if (attempt > 0) {
                waitBeforeRetry();
            }
            long startedAt = System.currentTimeMillis();
            try {
                JsonNode response = request(apiKey, body);

                if (isServiceUnavailable(response)) {
                    log.warn("Gemini báo quá tải (service_unavailable) với model [{}], lần {}/{}",
                            model, attempt + 1, MAX_RETRIES + 1);
                    continue;
                }

                String text = extractModelOutput(response);
                if (text == null) {
                    log.warn("Gemini không trả về step model_output có nội dung sau {}ms",
                            System.currentTimeMillis() - startedAt);
                    throw busy();
                }
                log.info("Gemini [{}] phản hồi thành công trong {}ms (lần {}/{})",
                        model, System.currentTimeMillis() - startedAt, attempt + 1, MAX_RETRIES + 1);
                return text;
            } catch (ApiException ex) {
                throw ex;
            } catch (RestClientResponseException ex) {
                if (isRetryableStatus(ex.getStatusCode().value())
                        || isServiceUnavailable(ex.getResponseBodyAsString())) {
                    log.warn("Gemini trả HTTP {} với model [{}], lần {}/{}",
                            ex.getStatusCode().value(), model, attempt + 1, MAX_RETRIES + 1);
                    continue;
                }
                log.warn("Gọi Gemini thất bại sau {}ms (HTTP {}): {}",
                        System.currentTimeMillis() - startedAt, ex.getStatusCode().value(), ex.getMessage());
                throw busy();
            } catch (Exception ex) {
                log.warn("Gọi Gemini thất bại sau {}ms: {}",
                        System.currentTimeMillis() - startedAt, ex.getMessage());
                throw busy();
            }
        }

        log.warn("Gemini vẫn quá tải sau {} lần thử với model [{}]", MAX_RETRIES + 1, model);
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, BUSY_AFTER_RETRY_MESSAGE);
    }

    private JsonNode request(String apiKey, Map<String, String> body) {
        return restClient.post()
                .uri(INTERACTIONS_PATH)
                .header("x-goog-api-key", apiKey)
                .header("Api-Revision", API_REVISION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
    }

    /** HTTP 503 (quá tải) hoặc 429 (vượt hạn ngạch) thì đáng thử lại. */
    private static boolean isRetryableStatus(int status) {
        return status == 503 || status == 429;
    }

    /** Tìm step {@code type = model_output} rồi lấy {@code content[0].text}. */
    private static String extractModelOutput(JsonNode response) {
        if (response == null) return null;
        JsonNode steps = response.path("steps");
        if (!steps.isArray()) return null;
        for (JsonNode step : steps) {
            if (!"model_output".equals(step.path("type").asText())) continue;
            JsonNode content = step.path("content");
            if (content.isArray() && !content.isEmpty()) {
                String text = content.get(0).path("text").asText(null);
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            }
        }
        return null;
    }

    /** Nhận diện lỗi quá tải trong JSON trả về (kể cả khi HTTP 200). */
    private static boolean isServiceUnavailable(JsonNode response) {
        if (response == null) return false;

        JsonNode error = response.path("error");
        if (error.isObject() && (isUnavailableNode(error) || isServiceUnavailable(error.toString()))) {
            return true;
        }
        if (isUnavailableNode(response)) return true;

        JsonNode steps = response.path("steps");
        if (steps.isArray()) {
            for (JsonNode step : steps) {
                if (!"error".equalsIgnoreCase(step.path("type").asText())) continue;
                if (isUnavailableNode(step) || isServiceUnavailable(step.toString())) return true;
            }
        }
        return false;
    }

    private static boolean isUnavailableNode(JsonNode node) {
        if (node == null || node.isMissingNode() || !node.isObject()) return false;
        String status = node.path("status").asText("");
        String type = node.path("type").asText("");
        String code = node.path("code").asText("");
        return "service_unavailable".equalsIgnoreCase(status)
                || "service_unavailable".equalsIgnoreCase(type)
                || "unavailable".equalsIgnoreCase(status)
                || "unavailable".equalsIgnoreCase(type)
                || "503".equals(code);
    }

    /** Fallback dạng chuỗi cho body lỗi không đọc được thành JSON. */
    private static boolean isServiceUnavailable(String body) {
        if (body == null || body.isBlank()) return false;
        String lower = body.toLowerCase(Locale.ROOT);
        return lower.contains("service_unavailable")
                || lower.contains("\"status\":\"unavailable\"")
                || lower.contains("\"status\": \"unavailable\"")
                || lower.contains("\"code\":503")
                || lower.contains("\"code\": 503");
    }

    private static void waitBeforeRetry() {
        try {
            Thread.sleep(RETRY_DELAY.toMillis());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, BUSY_AFTER_RETRY_MESSAGE);
        }
    }

    private static ApiException busy() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, BUSY_MESSAGE);
    }
}
