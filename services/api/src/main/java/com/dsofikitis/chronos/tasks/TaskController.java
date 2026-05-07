package com.dsofikitis.chronos.tasks;

import com.dsofikitis.chronos.auth.CurrentUserIdResolver.CurrentUserId;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService tasks;

    public TaskController(TaskService tasks) {
        this.tasks = tasks;
    }

    @GetMapping
    public List<TaskDto.Response> list(
            @CurrentUserId UUID userId,
            @RequestParam(required = false, defaultValue = "open") String status) {
        return tasks.list(userId, status).stream().map(TaskDto.Response::from).toList();
    }

    @PostMapping
    public TaskDto.Response create(
            @CurrentUserId UUID userId,
            @Valid @RequestBody TaskDto.CreateRequest req) {
        return TaskDto.Response.from(tasks.create(userId, req));
    }

    @PatchMapping("/{id}")
    public TaskDto.Response update(
            @CurrentUserId UUID userId,
            @PathVariable UUID id,
            @RequestBody TaskDto.UpdateRequest req) {
        return TaskDto.Response.from(tasks.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        tasks.delete(userId, id);
    }
}
