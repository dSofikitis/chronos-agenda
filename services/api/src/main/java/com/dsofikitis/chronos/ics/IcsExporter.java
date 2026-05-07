package com.dsofikitis.chronos.ics;

import com.dsofikitis.chronos.events.Event;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Hand-rolls an RFC 5545 (iCalendar) feed. Only the subset Apple Calendar /
 * Google Calendar / Thunderbird need to subscribe to a read-only feed: VCALENDAR
 * + VEVENT entries with UID, DTSTAMP, SUMMARY, DTSTART, DTEND, optional LOCATION
 * and DESCRIPTION. Recurrence (RRULE) is omitted on purpose — the MVP stores
 * event instances individually.
 */
@Component
public class IcsExporter {

    private static final DateTimeFormatter ICS_DATETIME =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final DateTimeFormatter ICS_DATE =
            DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String CRLF = "\r\n";

    public String render(String calendarName, List<Event> events) {
        var out = new StringBuilder(events.size() * 256);
        out.append("BEGIN:VCALENDAR").append(CRLF);
        out.append("VERSION:2.0").append(CRLF);
        out.append("PRODID:-//chronos-agenda//EN").append(CRLF);
        out.append("CALSCALE:GREGORIAN").append(CRLF);
        out.append("METHOD:PUBLISH").append(CRLF);
        out.append(fold("X-WR-CALNAME:" + escape(calendarName))).append(CRLF);

        var dtstamp = OffsetDateTime.now(ZoneOffset.UTC).format(ICS_DATETIME);
        for (var event : events) {
            out.append("BEGIN:VEVENT").append(CRLF);
            out.append("UID:").append(event.getId()).append("@chronos-agenda").append(CRLF);
            out.append("DTSTAMP:").append(dtstamp).append(CRLF);
            out.append(fold("SUMMARY:" + escape(event.getTitle()))).append(CRLF);

            if (event.isAllDay()) {
                out.append("DTSTART;VALUE=DATE:")
                        .append(event.getStartsAt().withOffsetSameInstant(ZoneOffset.UTC).format(ICS_DATE))
                        .append(CRLF);
                out.append("DTEND;VALUE=DATE:")
                        .append(event.getEndsAt().withOffsetSameInstant(ZoneOffset.UTC).format(ICS_DATE))
                        .append(CRLF);
            } else {
                out.append("DTSTART:")
                        .append(event.getStartsAt().withOffsetSameInstant(ZoneOffset.UTC).format(ICS_DATETIME))
                        .append(CRLF);
                out.append("DTEND:")
                        .append(event.getEndsAt().withOffsetSameInstant(ZoneOffset.UTC).format(ICS_DATETIME))
                        .append(CRLF);
            }

            if (event.getLocation() != null && !event.getLocation().isBlank()) {
                out.append(fold("LOCATION:" + escape(event.getLocation()))).append(CRLF);
            }
            if (event.getNotes() != null && !event.getNotes().isBlank()) {
                out.append(fold("DESCRIPTION:" + escape(event.getNotes()))).append(CRLF);
            }
            out.append("END:VEVENT").append(CRLF);
        }

        out.append("END:VCALENDAR").append(CRLF);
        return out.toString();
    }

    /**
     * Backslash, semicolon, comma, newline are reserved per RFC 5545 §3.3.11
     * — escape them so titles with commas don't truncate the field.
     */
    private static String escape(String s) {
        return s.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n")
                .replace("\r", "\\n");
    }

    /**
     * Lines longer than 75 octets must be folded with CRLF + a single
     * leading whitespace per RFC 5545 §3.1. We use bytes (UTF-8) rather
     * than char count because the spec is octet-based.
     */
    private static String fold(String line) {
        var bytes = line.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (bytes.length <= 75) return line;
        var out = new StringBuilder(line.length() + 16);
        int written = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            int byteLen = c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
            if (written > 0 && written + byteLen > 74) {
                out.append(CRLF).append(' ');
                written = 1; // leading space counts
            }
            out.append(c);
            written += byteLen;
        }
        return out.toString();
    }
}
