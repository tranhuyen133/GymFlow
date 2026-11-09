package com.gymflow.repository;

import com.gymflow.domain.PromotionGrant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionGrantRepository extends JpaRepository<PromotionGrant, Long> {

    List<PromotionGrant> findByPromotionId(Long promotionId);

    void deleteByPromotionId(Long promotionId);
}
