package com.dsofikitis.chronos.tasks;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {

    private static final Set<String> VALID_STATUS = Set.of("open", "done");

    private final TaskRepository repo;

    public TaskService(TaskRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<Task> list(UUID userId, String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return repo.findByUserIdOrderByDueByAscCreatedAtAsc(userId);
        }
        if (!VALID_STATUS.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status filter");
        }
        return repo.findByUserIdAndStatusOrderByDueByAscCreatedAtAsc(userId, status);
    }

    @Transactional
    public Task create(UUID userId, TaskDto.CreateRequest req) {
        var now = OffsetDateTime.now();
        return repo.save(Task.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title(req.title())
                .dueBy(req.dueBy())
                .priority(normalizePriority(req.priority()))
                .status("open")
                .notes(req.notes())
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Transactional
    public Task update(UUID userId, UUID taskId, TaskDto.UpdateRequest req) {
        var task = repo.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (req.title() != null) task.setTitle(req.title());
        if (req.dueBy() != null) task.setDueBy(req.dueBy());
        if (req.priority() != null) task.setPriority(normalizePriority(req.priority()));
        if (req.notes() != null) task.setNotes(req.notes());
        if (req.status() != null) {
            if (!VALID_STATUS.contains(req.status())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
            }
            task.setStatus(req.status());
        }
        task.setUpdatedAt(OffsetDateTime.now());
        return task;
    }

    @Transactional
    public void delete(UUID userId, UUID taskId) {
        var task = repo.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        repo.delete(task);
    }

    private static short normalizePriority(Short p) {
        if (p == null) return 1;
        if (p < 0 || p > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "priority must be 0..2");
        }
        return p;
    }
}
