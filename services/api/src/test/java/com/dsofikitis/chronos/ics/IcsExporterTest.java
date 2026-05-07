package com.dsofikitis.chronos.ics;

import static org.assertj.core.api.Assertions.assertThat;

import com.dsofikitis.chronos.events.Event;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class IcsExporterTest {

    private final IcsExporter exporter = new IcsExporter();

    @Test
    void rendersValidVCalendarHeaderAndFooter() {
        var ics = exporter.render("Test", List.of());
        assertThat(ics).startsWith("BEGIN:VCALENDAR\r\n");
        assertThat(ics).contains("VERSION:2.0\r\n");
        assertThat(ics).contains("PRODID:-//chronos-agenda//EN\r\n");
        assertThat(ics).endsWith("END:VCALENDAR\r\n");
    }

    @Test
    void escapesCommasAndSemicolonsInTitle() {
        var event = sampleEvent("Lunch with Bob, Alice; and Carol", false);
        var ics = exporter.render("Test", List.of(event));

        assertThat(ics).contains("SUMMARY:Lunch with Bob\\, Alice\\; and Carol");
    }

    @Test
    void escapesNewlinesInDescription() {
        var event = sampleEvent("Standup", false);
        event.setNotes("line one\nline two");
        var ics = exporter.render("Test", List.of(event));

        assertThat(ics).contains("DESCRIPTION:line one\\nline two");
    }

    @Test
    void allDayEventUsesDateValueOnly() {
        var event = sampleEvent("Holiday", true);
        var ics = exporter.render("Test", List.of(event));

        assertThat(ics).contains("DTSTART;VALUE=DATE:");
        assertThat(ics).contains("DTEND;VALUE=DATE:");
        // No time-of-day for all-day events.
        assertThat(ics).doesNotContain("DTSTART:20");
    }

    @Test
    void foldsLongLinesAtSeventyFiveOctets() {
        var event = sampleEvent("a".repeat(120), false);
        var ics = exporter.render("Test", List.of(event));

        // Folded continuation lines start with a single space.
        assertThat(ics).contains("\r\n ");
    }

    private static Event sampleEvent(String title, boolean allDay) {
        var now = OffsetDateTime.parse("2026-05-07T10:00:00Z");
        return Event.builder()
                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .userId(UUID.randomUUID())
                .title(title)
                .startsAt(now.withOffsetSameInstant(ZoneOffset.UTC))
                .endsAt(now.plusHours(1).withOffsetSameInstant(ZoneOffset.UTC))
                .allDay(allDay)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
