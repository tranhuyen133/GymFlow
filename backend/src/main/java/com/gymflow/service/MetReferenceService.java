package com.gymflow.service;

import com.gymflow.domain.ActivityCategory;
import com.gymflow.domain.ExerciseIntensity;
import com.gymflow.domain.MetReference;
import com.gymflow.repository.MetReferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Tra MET theo loại hoạt động + cường độ. Dữ liệu chính đọc từ bảng
 * {@code met_reference}; nếu thiếu dòng (ví dụ DB mới chưa seed) dùng bộ giá
 * trị mặc định cùng nguồn 2011 Compendium để không trả về null.
 */
@Service
@RequiredArgsConstructor
public class MetReferenceService {

    static final String SOURCE_VERSION = "2011";
    static final String SOURCE_URL = "https://doi.org/10.1249/MSS.0b013e31821ece12";
    static final String CITATION =
            "Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.";

    private final MetReferenceRepository repository;
    private volatile Map<String, MetReference> cache;

    public MetReference get(ActivityCategory category, ExerciseIntensity intensity) {
        ActivityCategory c = category == null ? ActivityCategory.OTHER : category;
        ExerciseIntensity i = intensity == null ? ExerciseIntensity.MODERATE : intensity;
        Map<String, MetReference> map = cache;
        if (map == null) {
            synchronized (this) {
                map = cache;
                if (map == null) {
                    map = load();
                    cache = map;
                }
            }
        }
        MetReference ref = map.get(key(c, i));
        return ref == null ? fallback(c, i) : ref;
    }

    public double met(ActivityCategory category, ExerciseIntensity intensity) {
        return get(category, intensity).getMetValue();
    }

    public void clearCache() {
        cache = null;
    }

    private Map<String, MetReference> load() {
        Map<String, MetReference> map = new HashMap<>();
        for (MetReference r : repository.findAll()) {
            map.put(key(r.getActivityCategory(), r.getIntensity()), r);
        }
        return map;
    }

    private static String key(ActivityCategory c, ExerciseIntensity i) {
        return c.name() + "|" + i.name();
    }

    /** Giá trị dự phòng cùng nguồn, dùng khi bảng chưa có dòng tương ứng. */
    public static MetReference fallback(ActivityCategory category, ExerciseIntensity intensity) {
        MetReference r = new MetReference();
        r.setActivityCategory(category);
        r.setIntensity(intensity);
        r.setMetValue(defaultMet(category, intensity));
        r.setSourceCode("CPA2011");
        r.setSourceVersion(SOURCE_VERSION);
        r.setSourceUrl(SOURCE_URL);
        r.setCitation(CITATION);
        r.setNote("Fallback reference value");
        return r;
    }

    public static double defaultMet(ActivityCategory category, ExerciseIntensity intensity) {
        return switch (category) {
            case RESISTANCE -> switch (intensity) {
                case LIGHT -> 3.5;
                case MODERATE -> 5.0;
                case VIGOROUS -> 6.0;
            };
            case CARDIO -> switch (intensity) {
                case LIGHT -> 4.0;
                case MODERATE -> 5.0;
                case VIGOROUS -> 7.0;
            };
            case RUNNING -> switch (intensity) {
                case LIGHT -> 8.3;
                case MODERATE -> 9.8;
                case VIGOROUS -> 11.0;
            };
            case WALKING -> switch (intensity) {
                case LIGHT -> 3.3;
                case MODERATE -> 3.8;
                case VIGOROUS -> 5.0;
            };
            case CYCLING -> switch (intensity) {
                case LIGHT -> 4.0;
                case MODERATE -> 6.8;
                case VIGOROUS -> 8.0;
            };
            case JUMP_ROPE -> switch (intensity) {
                case LIGHT -> 8.8;
                case MODERATE -> 11.0;
                case VIGOROUS -> 12.3;
            };
            case HIIT -> switch (intensity) {
                case LIGHT -> 8.0;
                case MODERATE -> 10.0;
                case VIGOROUS -> 12.0;
            };
            case OTHER -> switch (intensity) {
                case LIGHT -> 3.5;
                case MODERATE -> 5.0;
                case VIGOROUS -> 7.0;
            };
        };
    }
}
