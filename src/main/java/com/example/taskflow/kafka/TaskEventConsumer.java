package com.example.taskflow.kafka;

import com.example.taskflow.service.ElasticsearchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class TaskEventConsumer {

    private final ElasticsearchService elasticsearchService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TaskEventConsumer(ElasticsearchService elasticsearchService) {
        this.elasticsearchService = elasticsearchService;
    }

    @KafkaListener(topics = "task-events", groupId = "taskflow-group")
    public void consumeTaskEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.get("eventType").asText();
            Long taskId = root.get("taskId").asLong();

            if ("TASK_DELETED".equals(eventType)) {
                // מחיקה מ-Elasticsearch בזמן אמת!
                elasticsearchService.deleteTask(taskId);
            } else if ("TASK_CREATED".equals(eventType)) {
                String title = root.get("title").asText();
                String description = root.has("description") ? root.get("description").asText() : "";
                String username = root.get("username").asText();
                // אינדוקס משימה חדשה
                elasticsearchService.indexTask(taskId, title, description, username);
            }
        } catch (Exception e) {
            System.err.println("שגיאה בפענוח אירוע Kafka: " + e.getMessage());
        }
    }
}