package com.gymflow.repository;

import com.gymflow.domain.Equipment;
import com.gymflow.domain.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, String> {

    List<Equipment> findByHiddenFalseAndReviewStatusOrderBySortOrderAscNameAsc(ReviewStatus reviewStatus);

    List<Equipment> findByHiddenFalseOrderBySortOrderAscNameAsc();

    List<Equipment> findAllByOrderBySortOrderAscNameAsc();
}
