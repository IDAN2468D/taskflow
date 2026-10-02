package com.example.taskflow.model.search;

import java.io.Serializable;
import java.util.List;

public class TaskDocument implements Serializable {

    private String id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String username;
    private List<Float> embedding;

    public TaskDocument() {}

    public TaskDocument(String id, String title, String description,
                        String status, String priority, String username,
                        List<Float> embedding) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.username = username;
        this.embedding = embedding;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public List<Float> getEmbedding() { return embedding; }
    public void setEmbedding(List<Float> embedding) { this.embedding = embedding; }
}