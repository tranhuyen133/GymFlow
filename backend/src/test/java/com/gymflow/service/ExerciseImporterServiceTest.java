package com.gymflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymflow.domain.ContentOrigin;
import com.gymflow.domain.ContentSource;
import com.gymflow.domain.Exercise;
import com.gymflow.domain.MuscleGroup;
import com.gymflow.domain.ReviewStatus;
import com.gymflow.dto.Dtos.ExerciseImportReport;
import com.gymflow.repository.ContentSourceRepository;
import com.gymflow.repository.ExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseImporterServiceTest {

    @Mock
    private ExerciseRepository exerciseRepository;

    @Mock
    private ContentSourceRepository sourceRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ExerciseImporterService service;

    private ContentSource datasetSource;

    @BeforeEach
    void setUp() {
        service = new ExerciseImporterService(exerciseRepository, sourceRepository, objectMapper);

        datasetSource = new ContentSource();
        datasetSource.setCode("EXERCISES_DATASET");
        datasetSource.setTitle("Exercise Dataset - Open fitness exercise metadata");
    }

    @Test
    @DisplayName("Dry-run chế độ mô phỏng: phân tích dữ liệu, không ghi DB")
    void testDryRunDoesNotSaveToDatabase() {
        when(sourceRepository.findByCode("EXERCISES_DATASET")).thenReturn(Optional.of(datasetSource));
        when(exerciseRepository.findByExternalId(anyString())).thenReturn(Optional.empty());
        when(exerciseRepository.findFirstByNameEnIgnoreCase(anyString())).thenReturn(Optional.empty());

        ExerciseImportReport report = service.importDataset(true, 5);

        assertThat(report.dryRun()).isTrue();
        assertThat(report.totalRead()).isEqualTo(1324);
        assertThat(report.validCount()).isEqualTo(5);
        assertThat(report.createdCount()).isEqualTo(5);
        assertThat(report.updatedCount()).isZero();
        assertThat(report.errorCount()).isZero();
        assertThat(report.sampleCreated()).hasSize(5);

        // Đảm bảo không gọi save vào DB ở chế độ dry-run
        verify(exerciseRepository, never()).save(any(Exercise.class));
    }

    @Test
    @DisplayName("Chế độ thực thi: tạo bài tập mới ở trạng thái PENDING, gắn nguồn tham khảo")
    void testRealImportCreatesExercisesWithPendingStatus() {
        when(sourceRepository.findByCode("EXERCISES_DATASET")).thenReturn(Optional.of(datasetSource));
        when(exerciseRepository.findByExternalId(anyString())).thenReturn(Optional.empty());
        when(exerciseRepository.findFirstByNameEnIgnoreCase(anyString())).thenReturn(Optional.empty());

        ExerciseImportReport report = service.importDataset(false, 3);

        assertThat(report.dryRun()).isFalse();
        assertThat(report.createdCount()).isEqualTo(3);

        ArgumentCaptor<Exercise> captor = ArgumentCaptor.forClass(Exercise.class);
        verify(exerciseRepository, times(3)).save(captor.capture());

        for (Exercise saved : captor.getAllValues()) {
            assertThat(saved.getExternalId()).isNotBlank();
            assertThat(saved.getName()).isNotBlank();
            assertThat(saved.getNameEn()).isNotBlank();
            assertThat(saved.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
            assertThat(saved.getContentOrigin()).isEqualTo(ContentOrigin.ADAPTED);
            assertThat(saved.getSources()).contains(datasetSource);
            assertThat(saved.getMuscleGroup()).isNotNull();
            assertThat(saved.getEquipmentKeys()).isNotBlank();
            assertThat(saved.getTargetMuscles()).isNotBlank();
            assertThat(saved.getSteps()).isNotBlank();
        }
    }

    @Test
    @DisplayName("Tính Idempotent: chạy lại trên bản ghi đã có thì cập nhật, không tạo trùng")
    void testIdempotencyOnExistingRecords() {
        when(sourceRepository.findByCode("EXERCISES_DATASET")).thenReturn(Optional.of(datasetSource));

        Exercise existing = new Exercise();
        existing.setName("Hít đất");
        existing.setNameEn("3/4 Sit-up");
        existing.setMuscleGroup(MuscleGroup.CORE);
        existing.setExternalId("0001");
        existing.setSteps(null);

        when(exerciseRepository.findByExternalId("0001")).thenReturn(Optional.of(existing));
        when(exerciseRepository.findByExternalId(argThat(id -> !"0001".equals(id)))).thenReturn(Optional.empty());
        when(exerciseRepository.findFirstByNameEnIgnoreCase(anyString())).thenReturn(Optional.empty());

        ExerciseImportReport report = service.importDataset(false, 2);

        assertThat(report.validCount()).isEqualTo(2);
        assertThat(report.updatedCount()).isEqualTo(1);
        assertThat(report.createdCount()).isEqualTo(1);

        // Bổ sung steps vào existing exercise
        assertThat(existing.getSteps()).isNotNull();
        assertThat(existing.getSources()).contains(datasetSource);

        verify(exerciseRepository, times(2)).save(any(Exercise.class));
    }

    @Test
    @DisplayName("Xử lý trùng tên tiếng Việt: thêm hậu tố externalId để không vi phạm UNIQUE constraint")
    void testNameCollisionHandling() {
        when(sourceRepository.findByCode("EXERCISES_DATASET")).thenReturn(Optional.of(datasetSource));
        when(exerciseRepository.findByExternalId(anyString())).thenReturn(Optional.empty());
        when(exerciseRepository.findFirstByNameEnIgnoreCase(anyString())).thenReturn(Optional.empty());
        // Giả lập tên tiếng Việt đã tồn tại trong DB
        when(exerciseRepository.existsByNameIgnoreCase(anyString())).thenReturn(true);

        ExerciseImportReport report = service.importDataset(false, 1);

        assertThat(report.createdCount()).isEqualTo(1);
        ArgumentCaptor<Exercise> captor = ArgumentCaptor.forClass(Exercise.class);
        verify(exerciseRepository).save(captor.capture());

        Exercise saved = captor.getValue();
        assertThat(saved.getName()).contains("#");
    }
}
