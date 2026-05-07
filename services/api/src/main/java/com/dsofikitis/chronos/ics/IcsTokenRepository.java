package com.dsofikitis.chronos.ics;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IcsTokenRepository extends JpaRepository<IcsToken, UUID> {
    Optional<IcsToken> findByToken(String token);
}
