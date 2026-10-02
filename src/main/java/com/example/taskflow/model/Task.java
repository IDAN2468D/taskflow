package com.example.taskflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    private boolean completed = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    private  String attachmentFileName;

    // קשר Many-to-One: להרבה משימות יכול להיות משתמש אחד
    // JsonIgnore מונע הדפסה מעגלית של נתוני המשתמש בתשובת ה-JSON
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private AppUser user;

    public Task() {
    }

    public Task(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getAttachmentFileName() { return attachmentFileName; }
    public void setAttachmentFileName(String attachmentFileName) { this.attachmentFileName = attachmentFileName; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
}