package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private TrainerRepository trainerRepository;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private WorkoutPlanRepository workoutPlanRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AccessService accessService;
    @Mock
    private AuditService auditService;

    private MessageRateLimiter rateLimiter;
    private ConversationService conversationService;

    private AuthUser memberAuth;
    private AuthUser memberAuthB;
    private AuthUser trainerAuth;
    private AuthUser adminAuth;
    private Member memberEntity;
    private Member memberEntityB;
    private Trainer trainerEntity;
    private User memberUser;
    private User memberUserB;
    private User trainerUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        rateLimiter = new MessageRateLimiter();
        conversationService = new ConversationService(
                conversationRepository,
                messageRepository,
                trainerRepository,
                memberRepository,
                workoutPlanRepository,
                userRepository,
                accessService,
                auditService,
                rateLimiter
        );

        memberUser = new User();
        memberUser.setId(10L);
        memberUser.setFullName("Nguyễn Văn A");
        memberUser.setRole(Role.MEMBER);

        memberUserB = new User();
        memberUserB.setId(11L);
        memberUserB.setFullName("Trần Văn B");
        memberUserB.setRole(Role.MEMBER);

        trainerUser = new User();
        trainerUser.setId(20L);
        trainerUser.setFullName("HLV Hùng");
        trainerUser.setRole(Role.TRAINER);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setFullName("Admin Quản Trị");
        adminUser.setRole(Role.ADMIN);

        trainerEntity = new Trainer();
        trainerEntity.setId(200L);
        trainerEntity.setUser(trainerUser);
        trainerEntity.setActive(true);

        memberEntity = new Member();
        memberEntity.setId(100L);
        memberEntity.setUser(memberUser);
        memberEntity.setTrainer(trainerEntity); // Gán cho HLV Hùng

        memberEntityB = new Member();
        memberEntityB.setId(101L);
        memberEntityB.setUser(memberUserB);
        memberEntityB.setTrainer(null); // Không có HLV

        memberAuth = new AuthUser(10L, "memberA@test.com", Role.MEMBER, "Nguyễn Văn A");
        memberAuthB = new AuthUser(11L, "memberB@test.com", Role.MEMBER, "Trần Văn B");
        trainerAuth = new AuthUser(20L, "trainer@test.com", Role.TRAINER, "HLV Hùng");
        adminAuth = new AuthUser(1L, "admin@test.com", Role.ADMIN, "Admin Quản Trị");
    }

    @Test
    @DisplayName("Hội viên chỉ được nhắn tin với HLV đang phụ trách (403 nếu HLV không phụ trách)")
    void memberCannotMessageUnassignedTrainer() {
        when(accessService.requireMemberOf(memberAuthB)).thenReturn(memberEntityB);
        when(trainerRepository.findById(200L)).thenReturn(Optional.of(trainerEntity));
        when(workoutPlanRepository.existsByMemberIdAndTrainerIdAndStatus(101L, 200L, PlanStatus.ACTIVE))
                .thenReturn(false);

        assertThatThrownBy(() -> conversationService.getOrCreate(memberAuthB, 200L))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiEx = (ApiException) e;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiEx.getMessage()).contains("chỉ có thể nhắn tin với Huấn luyện viên đang phụ trách");
                });
    }

    @Test
    @DisplayName("Hội viên có HLV phụ trách (gán trực tiếp) tạo hội thoại và gửi tin thành công")
    void memberWithAssignedTrainerCanCreateConversationAndSendMessage() {
        when(accessService.requireMemberOf(memberAuth)).thenReturn(memberEntity);
        when(trainerRepository.findById(200L)).thenReturn(Optional.of(trainerEntity));
        when(conversationRepository.findByMemberIdAndTrainerId(100L, 200L)).thenReturn(Optional.empty());

        Conversation savedConv = new Conversation(memberEntity, trainerEntity);
        savedConv.setId(1L);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConv);

        ConversationResponse res = conversationService.getOrCreate(memberAuth, 200L);

        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(1L);
        assertThat(res.relation()).isEqualTo("ASSIGNED");

        // Gửi tin nhắn
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(savedConv));
        when(userRepository.findById(memberAuth.id())).thenReturn(Optional.of(memberUser));
        Message savedMsg = new Message(savedConv, memberUser, Role.MEMBER, "Chào HLV, tôi muốn tư vấn bài tập", null);
        savedMsg.setId(10L);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMsg);

        MessageResponseDto msgRes = conversationService.sendMessage(memberAuth, 1L, "Chào HLV, tôi muốn tư vấn bài tập");
        assertThat(msgRes).isNotNull();
        assertThat(msgRes.body()).isEqualTo("Chào HLV, tôi muốn tư vấn bài tập");
    }

    @Test
    @DisplayName("Hội viên có giáo án ACTIVE với HLV tạo hội thoại thành công")
    void memberWithActiveWorkoutPlanCanCreateConversation() {
        memberEntityB.setTrainer(null);
        when(accessService.requireMemberOf(memberAuthB)).thenReturn(memberEntityB);
        when(trainerRepository.findById(200L)).thenReturn(Optional.of(trainerEntity));
        when(workoutPlanRepository.existsByMemberIdAndTrainerIdAndStatus(101L, 200L, PlanStatus.ACTIVE))
                .thenReturn(true);

        Conversation savedConv = new Conversation(memberEntityB, trainerEntity);
        savedConv.setId(2L);
        when(conversationRepository.findByMemberIdAndTrainerId(101L, 200L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConv);

        ConversationResponse res = conversationService.getOrCreate(memberAuthB, 200L);
        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(2L);
    }

    @Test
    @DisplayName("HLV tạo cuộc hội thoại với hội viên mình phụ trách thành công")
    void trainerCanCreateConversationWithAssignedMember() {
        when(accessService.requireTrainerOf(trainerAuth)).thenReturn(trainerEntity);
        when(memberRepository.findById(100L)).thenReturn(Optional.of(memberEntity));
        when(conversationRepository.findByMemberIdAndTrainerId(100L, 200L)).thenReturn(Optional.empty());

        Conversation savedConv = new Conversation(memberEntity, trainerEntity);
        savedConv.setId(3L);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConv);

        CreateConversationRequest req = new CreateConversationRequest(null, 100L);
        ConversationResponse res = conversationService.getOrCreate(trainerAuth, req);
        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(3L);
    }

    @Test
    @DisplayName("HLV không phụ trách hội viên gọi tạo hội thoại -> 403")
    void trainerCannotMessageUnassignedMember() {
        when(accessService.requireTrainerOf(trainerAuth)).thenReturn(trainerEntity);
        when(memberRepository.findById(101L)).thenReturn(Optional.of(memberEntityB));
        when(workoutPlanRepository.existsByMemberIdAndTrainerIdAndStatus(101L, 200L, PlanStatus.ACTIVE))
                .thenReturn(false);

        CreateConversationRequest req = new CreateConversationRequest(null, 101L);
        assertThatThrownBy(() -> conversationService.getOrCreate(trainerAuth, req))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("Admin xem tin nhắn hội thoại thành công và ghi nhận nhật ký hệ thống")
    void adminCanViewMessagesAndCreatesAuditLog() {
        Conversation conv = new Conversation(memberEntity, trainerEntity);
        conv.setId(1L);
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));

        Message m1 = new Message(conv, memberUser, Role.MEMBER, "Tin nhắn từ member", null);
        m1.setId(101L);
        m1.setCreatedAt(LocalDateTime.now());
        when(messageRepository.findVisibleBefore(eq(1L), any(), any(), any())).thenReturn(List.of(m1));

        List<MessageResponseDto> messages = conversationService.getMessages(adminAuth, 1L, null, 50);

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).body()).isEqualTo("Tin nhắn từ member");
        verify(auditService, times(1)).log(eq("CONVERSATION_VIEW"), eq("CONVERSATION"), eq(1L), contains("Quản lý xem hội thoại"));
    }

    @Test
    @DisplayName("Admin cố gắng gửi tin nhắn -> 403 Forbidden")
    void adminCannotSendMessage() {
        assertThatThrownBy(() -> conversationService.sendMessage(adminAuth, 1L, "Admin gửi tin"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiEx = (ApiException) e;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiEx.getMessage()).contains("chỉ có quyền xem");
                });
    }

    @Test
    @DisplayName("Admin cố gắng tạo cuộc hội thoại -> 403 Forbidden")
    void adminCannotCreateConversation() {
        CreateConversationRequest req = new CreateConversationRequest(200L, 100L);
        assertThatThrownBy(() -> conversationService.getOrCreate(adminAuth, req))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiEx = (ApiException) e;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiEx.getMessage()).contains("chỉ có quyền xem");
                });
    }

    @Test
    @DisplayName("Hội viên A gọi GET /conversations/{id của B} -> 403")
    void memberCannotAccessOtherMemberConversation() {
        Conversation convB = new Conversation(memberEntityB, trainerEntity);
        convB.setId(2L);
        when(conversationRepository.findById(2L)).thenReturn(Optional.of(convB));

        assertThatThrownBy(() -> conversationService.getMessages(memberAuth, 2L, null, 50))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        assertThatThrownBy(() -> conversationService.sendMessage(memberAuth, 2L, "Hack attempt"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("Gọi POST /conversations hai lần cùng một HLV -> trả về cùng một id (không tạo trùng)")
    void postConversationsTwiceReturnsSameId() {
        when(accessService.requireMemberOf(memberAuth)).thenReturn(memberEntity);
        when(trainerRepository.findById(200L)).thenReturn(Optional.of(trainerEntity));

        Conversation existing = new Conversation(memberEntity, trainerEntity);
        existing.setId(99L);
        when(conversationRepository.findByMemberIdAndTrainerId(100L, 200L)).thenReturn(Optional.of(existing));

        ConversationResponse res1 = conversationService.getOrCreate(memberAuth, 200L);
        ConversationResponse res2 = conversationService.getOrCreate(memberAuth, 200L);

        assertThat(res1.id()).isEqualTo(99L);
        assertThat(res2.id()).isEqualTo(99L);
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gửi tin thứ 21 trong 1 phút -> 429")
    void sending21stMessageInOneMinuteThrows429() {
        Conversation conv = new Conversation(memberEntity, trainerEntity);
        conv.setId(1L);
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(userRepository.findById(memberAuth.id())).thenReturn(Optional.of(memberUser));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(100L);
            return m;
        });

        // Gửi 20 tin đầu tiên -> thành công
        for (int i = 1; i <= 20; i++) {
            conversationService.sendMessage(memberAuth, 1L, "Tin nhắn số " + i);
        }

        // Gửi tin thứ 21 trong cùng phút -> 429
        assertThatThrownBy(() -> conversationService.sendMessage(memberAuth, 1L, "Tin nhắn thứ 21"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiEx = (ApiException) e;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(apiEx.getMessage()).contains("quá nhanh");
                });
    }

    @Test
    @DisplayName("HLV inactive không tạo được hội thoại và trả lỗi 400")
    void inactiveTrainerCannotCreateConversation() {
        trainerEntity.setActive(false);
        when(accessService.requireMemberOf(memberAuth)).thenReturn(memberEntity);
        when(trainerRepository.findById(200L)).thenReturn(Optional.of(trainerEntity));

        assertThatThrownBy(() -> conversationService.getOrCreate(memberAuth, 200L))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiEx = (ApiException) e;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getMessage()).contains("không hoạt động");
                });
    }
}
