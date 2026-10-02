package com.example.taskflow.controller;

import com.example.taskflow.model.Task;
import com.example.taskflow.service.AsyncNotificationService;
import com.example.taskflow.service.ElasticsearchService;
import com.example.taskflow.service.FileStorageService;
import com.example.taskflow.service.GeminiService;
import com.example.taskflow.service.TaskService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final FileStorageService fileStorageService;
    private final AsyncNotificationService asyncNotificationService;
    private final ElasticsearchService elasticsearchService;
    private final GeminiService geminiService;

    public TaskController(TaskService taskService,
                          FileStorageService fileStorageService,
                          AsyncNotificationService asyncNotificationService,
                          ElasticsearchService elasticsearchService,
                          GeminiService geminiService) {
        this.taskService = taskService;
        this.fileStorageService = fileStorageService;
        this.asyncNotificationService = asyncNotificationService;
        this.elasticsearchService = elasticsearchService;
        this.geminiService = geminiService;
    }

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(Principal principal,
                                                  @RequestParam(required = false) Boolean completed) {
        return ResponseEntity.ok(taskService.getAllTasksForUser(principal.getName(), Optional.ofNullable(completed)));
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task, Principal principal) {
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("כותרת המשימה היא שדה חובה");
        }
        Task created = taskService.createTaskForUser(task, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id,
                                           @RequestBody Task task,
                                           Principal principal) {
        return taskService.updateTaskForUser(id, task, principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Principal principal) {
        if (taskService.deleteTaskForUser(id, principal.getName())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/attachment")
    public ResponseEntity<?> uploadAttachment(@PathVariable Long id,
                                              @RequestParam("file") MultipartFile file,
                                              Principal principal) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body("קובץ ריק");
            String savedFileName = fileStorageService.saveFile(file);
            Optional<Task> updatedTask = taskService.attachFileToTask(id, savedFileName, principal.getName());
            if (updatedTask.isEmpty()) return ResponseEntity.notFound().build();
            asyncNotificationService.processFileUploadInBackground(savedFileName, principal.getName());
            return ResponseEntity.ok(updatedTask.get());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("שגיאה בשמירת הקובץ: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id, Principal principal) {
        try {
            Optional<Task> task = taskService.getTaskByIdAndUser(id, principal.getName());
            if (task.isEmpty() || task.get().getAttachmentFileName() == null) return ResponseEntity.notFound().build();
            Path filePath = fileStorageService.getFile(task.get().getAttachmentFileName());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + task.get().getAttachmentFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/search", produces = "application/json;charset=UTF-8")
    public ResponseEntity<String> searchTasks(@RequestParam("query") String query, Principal principal) {
        String results = elasticsearchService.searchTasks(query, principal.getName());
        return ResponseEntity.ok(results);
    }

    // נקודת הקצה של Google Gemini:
    public record AiPromptRequest(String prompt) {}

    @PostMapping("/ai-suggest")
    public ResponseEntity<?> getGeminiSuggestions(@RequestBody AiPromptRequest request, Principal principal) {
        if (request.prompt() == null || request.prompt().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("יש לספק יעד עבור Gemini");
        }
        List<GeminiService.SuggestedTask> suggestions = geminiService.generateSubtasks(request.prompt());
        return ResponseEntity.ok(suggestions);
    }
}