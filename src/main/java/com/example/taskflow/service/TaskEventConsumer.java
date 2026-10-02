package com.example.taskflow.service;

import com.example.taskflow.model.event.TaskEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service("taskRealtimeConsumer")
public class TaskEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(TaskEventConsumer.class);
    private final SimpMessagingTemplate messagingTemplate;

    public TaskEventConsumer(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = "${app.kafka.topics.task-events:task-events}", groupId = "taskflow-realtime-group")
    public void consumeTaskEvent(TaskEvent event) {
        log.info("📢 Kafka Event נקלט [{}]: עבור משימה {}", event.getEventType(), event.getTaskId());

        // שידור מיידי ב-WebSocket לכל הדפדפנים המחוברים
        messagingTemplate.convertAndSend("/topic/tasks", event);
        log.debug("האירוע שודר בהצלחה ל-WebSocket בערוץ /topic/tasks");
    }
}