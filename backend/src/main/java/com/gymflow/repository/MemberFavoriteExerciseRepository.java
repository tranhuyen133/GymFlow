package com.gymflow.repository;

import com.gymflow.domain.MemberFavoriteExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberFavoriteExerciseRepository extends JpaRepository<MemberFavoriteExercise, Long> {

    boolean existsByMemberIdAndExerciseId(Long memberId, Long exerciseId);

    Optional<MemberFavoriteExercise> findByMemberIdAndExerciseId(Long memberId, Long exerciseId);

    List<MemberFavoriteExercise> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    void deleteByMemberIdAndExerciseId(Long memberId, Long exerciseId);

    long countByMemberId(Long memberId);

    @Query("SELECT mfe.exercise.id FROM MemberFavoriteExercise mfe WHERE mfe.member.id = :memberId")
    List<Long> findExerciseIdsByMemberId(@Param("memberId") Long memberId);
}
