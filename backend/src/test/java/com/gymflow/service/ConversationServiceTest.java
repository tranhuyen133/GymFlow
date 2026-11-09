package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.ConversationRepository;
import com.gymflow.repository.MessageRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

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
    private Member memberEntity;
    private Member memberEntityB;
    private Trainer trainerEntity;
    private User memberUser;
    private User memberUserB;
    private User trainerUser;

    @BeforeEach
    void setUp() {
        rateLimiter = new MessageRateLimiter();
        conversationService = new ConversationService(
                conversationRepository,
                messageRepository,
                trainerRepository,
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

        memberEntity = new Member();
        memberEntity.setId(100L);
        memberEntity.setUser(memberUser);
        memberEntity.setTrainer(null); // Không có HLV, không có gói PT

        memberEntityB = new Member();
        memberEntityB.setId(101L);
        memberEntityB.setUser(memberUserB);
        memberEntityB.setTrainer(null);

        trainerEntity = new Trainer();
        trainerEntity.setId(200L);
        trainerEntity.setUser(trainerUser);
        trainerEntity.setActive(true);

        memberAuth = new AuthUser(10L, "memberA@test.com", Role.MEMBER, "Nguyễn Văn A");
        memberAuthB = new AuthUser(11L, "memberB@test.com", Role.MEMBER, "Trần Văn B");
        trainerAuth = new AuthUser(20L, "trainer@test.com", Role.TRAINER, "HLV Hùng");
    }

    @Test
    @DisplayName("Hội viên không có gói nào vẫn tạo được hội thoại và gửi được tin, trainer_id vẫn NULL")
    void memberWithoutPackageCanCreateConversationAndSendMessage() {
        when(accessService.requireMemberOf(memberAuth)).thenReturn(memberEntity);
        when(trainerRepository.findById(200L)).thenReturn(Optional.of(trainerEntity));
        when(conversationRepository.findByMemberIdAndTrainerId(100L, 200L)).thenReturn(Optional.empty());

        Conversation savedConv = new Conversation(memberEntity, trainerEntity);
        savedConv.setId(1L);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConv);

        ConversationResponse res = conversationService.getOrCreate(memberAuth, 200L);

        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(1L);
        assertThat(res.relation()).isEqualTo("CONSULTING");
        assertThat(memberEntity.getTrainer()).isNull(); // trainer_id TUYỆT ĐỐI không thay đổi

        // Gửi tin nhắn
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(savedConv));
        when(userRepository.findById(memberAuth.id())).thenReturn(Optional.of(memberUser));
        Message savedMsg = new Message(savedConv, memberUser, "Chào HLV, tôi muốn tư vấn");
        savedMsg.setId(10L);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMsg);

        MessageResponseDto msgRes = conversationService.sendMessage(memberAuth, 1L, "Chào HLV, tôi muốn tư vấn");
        assertThat(msgRes).isNotNull();
        assertThat(msgRes.body()).isEqualTo("Chào HLV, tôi muốn tư vấn");
        assertThat(memberEntity.getTrainer()).isNull(); // Vẫn là NULL
    }

    @Test
    @DisplayName("Sau khi chat, HLV gọi canView hoặc requireCoach tiến độ/chỉ số của hội viên đó -> 403, trainer_id vẫn NULL")
    void afterChatTrainerCannotAccessMemberProgress() {
        // Chat xong, memberEntity.getTrainer() vẫn là null
        assertThat(memberEntity.getTrainer()).isNull();

        AccessService realAccess = new AccessService(mock(com.gymflow.repository.MemberRepository.class), trainerRepository);
        boolean canView = realAccess.canView(trainerAuth, memberEntity);
        assertThat(canView).isFalse();

        boolean canCoach = realAccess.canCoach(trainerAuth, memberEntity);
        assertThat(canCoach).isFalse();
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
