package com.gymflow.repository;

import com.gymflow.domain.ContentSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContentSourceRepository extends JpaRepository<ContentSource, Long> {
    List<ContentSource> findAllByOrderByPublisherAscTitleAsc();
    Optional<ContentSource> findByCode(String code);
}
