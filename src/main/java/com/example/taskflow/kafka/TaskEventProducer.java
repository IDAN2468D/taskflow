package com.example.taskflow.kafka;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class TaskEventProducer {

    private static final String TOPIC = "task-events";
    private final KafkaTemplate<String, String> kafkaTemplate;

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

    public void publishTaskDeletedEvent(Long taskId, String username) {
        String eventMessage = String.format(
                "{\"eventType\": \"TASK_DELETED\", \"taskId\": %d, \"username\": \"%s\"}",
                taskId, username);

        System.out.println("[KAFKA PRODUCER] שולח אירוע מחיקה ל-Kafka: " + eventMessage);
        kafkaTemplate.send(TOPIC, String.valueOf(taskId), eventMessage);
    }
}