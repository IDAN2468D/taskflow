package com.example.taskflow.model.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class TaskEvent implements Serializable {

    public enum EventType {
        TASK_CREATED,
        TASK_UPDATED,
        TASK_DELETED
    }

    private EventType eventType;
    private String taskId;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String dueDate;
    private LocalDateTime timestamp = LocalDateTime.now();

    public TaskEvent() {}

    public TaskEvent(EventType eventType, String taskId, String title, String status, String priority) {
        this.eventType = eventType;
        this.taskId = taskId;
        this.title = title;
        this.status = status;
        this.priority = priority;
    }

    // Getters & Setters
    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}