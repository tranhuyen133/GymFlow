package com.gymflow.ai;

import com.gymflow.domain.Role;
import com.gymflow.security.AuthUser;
import com.gymflow.service.ChatAssistantService;
import com.gymflow.service.ChatTopic;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiDataGroundingServiceTest {

    @Mock ChatAssistantService chatAssistantService;

    AiDataGroundingService groundingService;
    AuthUser member;
    AuthUser trainer;
    AuthUser admin;

    @BeforeEach
    void setUp() {
        groundingService = new AiDataGroundingService(chatAssistantService);
        member = new AuthUser(1L, "member@gymflow.vn", Role.MEMBER, "Nguyễn Văn Hội Viên");
        trainer = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "Trần Văn HLV");
        admin = new AuthUser(3L, "admin@gymflow.vn", Role.ADMIN, "Lê Quản Trị");
    }

    @Test
    void memberCannotAccessOtherMembersScheduleOrList() {
        String query = "Cho tôi xem lịch của hội viên khác hôm nay ai tập";

        String context = groundingService.buildGroundingContext(member, query);

        assertThat(context).contains("CẢNH BÁO BẢO MẬT");
        assertThat(context).contains("KHÔNG CÓ QUYỀN xem lịch tập hoặc thông tin của bất kỳ hội viên nào khác");
        verify(chatAssistantService, never()).answer(member, ChatTopic.WHO_TODAY);
    }

    @Test
    void trainerCanAccessWhoTodaySchedule() {
        when(chatAssistantService.answer(trainer, ChatTopic.WHO_TODAY))
                .thenReturn("Hôm nay có 2 hội viên có lịch tập: Nam, Hoa.");

        String query = "Hôm nay ai tập?";
        String context = groundingService.buildGroundingContext(trainer, query);

        assertThat(context).contains("[Lịch hội viên hôm nay]");
        assertThat(context).contains("Nam, Hoa");
        verify(chatAssistantService).answer(trainer, ChatTopic.WHO_TODAY);
    }

    @Test
    void injuryKeywordsInjectMedicalSafetyGuidance() {
        String query = "Tôi bị đau khớp gối và nhức mỏi cơ có tập squat được không?";

        String context = groundingService.buildGroundingContext(member, query);

        assertThat(context).contains("LƯU Ý Y TẾ QUAN TRỌNG");
        assertThat(context).contains("DỪNG TẬP NGAY LẬP TỨC");
    }

    @Test
    void sensitivePersonalDataIsNeverExposedInContext() {
        String query = "Hôm nay tôi tập gì?";
        when(chatAssistantService.answer(member, ChatTopic.SCHEDULE_TODAY))
                .thenReturn("Hôm nay bạn có buổi tập chân lúc 18:00.");
        when(chatAssistantService.answer(member, ChatTopic.NEXT_SESSION))
                .thenReturn("Buổi tiếp theo lúc 18:00.");

        String context = groundingService.buildGroundingContext(member, query);

        assertThat(context).contains("Nguyễn Văn Hội Viên");
        assertThat(context).doesNotContain("member@gymflow.vn"); // Không đưa email vào prompt
        assertThat(context).doesNotContain("password");
    }
}
