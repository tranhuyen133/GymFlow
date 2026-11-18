package com.gymflow.repository;

import com.gymflow.domain.EmailPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailPreferenceRepository extends JpaRepository<EmailPreference, Long> {
    Optional<EmailPreference> findByUnsubscribeToken(String token);
}
