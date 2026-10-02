package com.example.taskflow.controller;

import com.example.taskflow.service.TaskRagService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tasks/rag")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class RagController {

    private final TaskRagService taskRagService;

    public RagController(TaskRagService taskRagService) {
        this.taskRagService = taskRagService;
    }

    /**
     * נקודת קצה לשאילתות RAG בשפה חופשית.
     * דוגמה לקריאה: GET /api/tasks/rag?query=איזה משימות דחופות יש לנו בנושא דוקר וקפקא?
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> askRag(
            @RequestParam("query") String query,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = (userDetails != null) ? userDetails.getUsername() : "anonymous";
        Map<String, Object> result = taskRagService.askTaskRag(query, username);
        return ResponseEntity.ok(result);
    }
}