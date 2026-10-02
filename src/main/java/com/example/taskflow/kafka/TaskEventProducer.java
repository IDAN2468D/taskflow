package com.example.taskflow.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class TaskEventProducer {

    private static final String TOPIC = "task-events";
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TaskEventProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // הוספת השדה description לאירוע ה-Kafka
    public void publishTaskCreatedEvent(Long taskId, String title, String description, String username) {
        String safeDescription = (description != null) ? description.replace("\"", "\\\"") : "";
        String safeTitle = (title != null) ? title.replace("\"", "\\\"") : "";

        String eventMessage = String.format(
                "{\"eventType\": \"TASK_CREATED\", \"taskId\": %d, \"title\": \"%s\", \"description\": \"%s\", \"username\": \"%s\"}",
                taskId, safeTitle, safeDescription, username);

        System.out.println("[KAFKA PRODUCER] שולח אירוע עם כותרת ותיאור: " + eventMessage);
        kafkaTemplate.send(TOPIC, String.valueOf(taskId), eventMessage);
    }

    // שליחת אירוע עדכון משימה ל-Kafka
    public void publishTaskUpdatedEvent(Long id, String title, String description, boolean completed, String username) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "TASK_UPDATED");
            event.put("taskId", id.toString());
            event.put("title", title != null ? title : "");
            event.put("description", description != null ? description : "");
            event.put("status", completed ? "DONE" : "IN_PROGRESS");
            event.put("username", username);

            String eventMessage = objectMapper.writeValueAsString(event);
            System.out.println("[KAFKA PRODUCER] שולח אירוע עדכון ל-Kafka: " + eventMessage);
            kafkaTemplate.send(TOPIC, String.valueOf(id), eventMessage);
        } catch (Exception e) {
            System.err.println("שגיאה בסריאליזציה של אירוע עדכון ל-Kafka: " + e.getMessage());
        }
    }

    public void publishTaskDeletedEvent(Long taskId, String username) {
        String eventMessage = String.format(
                "{\"eventType\": \"TASK_DELETED\", \"taskId\": %d, \"username\": \"%s\"}",
                taskId, username);

        System.out.println("[KAFKA PRODUCER] שולח אירוע מחיקה ל-Kafka: " + eventMessage);
        kafkaTemplate.send(TOPIC, String.valueOf(taskId), eventMessage);
    }
}