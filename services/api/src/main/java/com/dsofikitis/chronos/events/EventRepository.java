package com.dsofikitis.chronos.events;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, UUID> {

    Optional<Event> findByIdAndUserId(UUID id, UUID userId);

    /**
     * Events that overlap the [from, to) window for the given user. Inclusive
     * on the lower bound, exclusive on the upper, in line with how every
     * calendar UI renders ranges.
     */
    @Query("""
            SELECT e FROM Event e
             WHERE e.userId = :userId
               AND e.startsAt < :to
               AND e.endsAt   > :from
             ORDER BY e.startsAt ASC
            """)
    List<Event> findInWindow(
            @Param("userId") UUID userId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);
}
