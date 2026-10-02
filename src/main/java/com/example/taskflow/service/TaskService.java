package com.example.taskflow.service;

import com.example.taskflow.kafka.TaskEventProducer;
import com.example.taskflow.model.AppUser;
import com.example.taskflow.model.Task;
import com.example.taskflow.repository.TaskRepository;
import com.example.taskflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskEventProducer taskEventProducer;


    // הוסף את השדות האלה למחלקה:
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final org.springframework.data.elasticsearch.core.ElasticsearchOperations elasticsearchOperations;

    // עדכן את ה-Constructor של TaskService שיקבל גם אותם:
    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       TaskEventProducer taskEventProducer,
                       GeminiEmbeddingService geminiEmbeddingService,
                       org.springframework.data.elasticsearch.core.ElasticsearchOperations elasticsearchOperations) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskEventProducer = taskEventProducer;
        this.geminiEmbeddingService = geminiEmbeddingService;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    private AppUser getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("משתמש לא נמצא"));
    }

    // 1. שליפת משימות של המשתמש המחובר
    public List<Task> getAllTasksForUser(String username, Optional<Boolean> completed) {
        AppUser user = getUserByUsername(username);
        return completed
                .map(status -> taskRepository.findByUserAndCompleted(user, status))
                .orElseGet(() -> taskRepository.findByUser(user));
    }

    // 2. שמירת משימה ושליחת אירוע יצירה ל-Kafka
    public Task createTaskForUser(Task task, String username) {
        AppUser user = getUserByUsername(username);
        task.setUser(user);

        // שמירת המשימה במסד הנתונים
        Task saved = taskRepository.save(task);

        // שליחת אירוע יצירה ל-Kafka בזמן אמת
        taskEventProducer.publishTaskCreatedEvent(saved.getId(), saved.getTitle(), saved.getDescription(), username);

        // הפקת וקטור סמנטי (768 ממדים) ושמירה ב-Elasticsearch
        try {
            List<Float> embedding = geminiEmbeddingService.generateEmbedding(
                    saved.getTitle() + " " + (saved.getDescription() != null ? saved.getDescription() : "")
            );
            com.example.taskflow.model.search.TaskDocument doc = new com.example.taskflow.model.search.TaskDocument(
                    saved.getId().toString(),
                    saved.getTitle(),
                    saved.getDescription(),
                    saved.isCompleted() ? "DONE" : "IN_PROGRESS",
                    "MEDIUM",
                    username,
                    embedding
            );
            elasticsearchOperations.save(doc);
        } catch (Exception e) {
            // מונע נפילה אם יש בעיה רגעית ב-Elasticsearch
        }

        return saved;
    }

    // 3. עדכון משימה ושליחת אירוע עדכון ל-Kafka (לסנכרון מיידי ב-WebSocket/Kanban)
    public Optional<Task> updateTaskForUser(Long id, Task updatedTask, String username) {
        AppUser user = getUserByUsername(username);
        return taskRepository.findByIdAndUser(id, user).map(existing -> {
            existing.setTitle(updatedTask.getTitle());
            existing.setDescription(updatedTask.getDescription());
            existing.setCompleted(updatedTask.isCompleted());

            Task saved = taskRepository.save(existing);

            // שליחת אירוע עדכון ל-Kafka
            taskEventProducer.publishTaskUpdatedEvent(
                    saved.getId(),
                    saved.getTitle(),
                    saved.getDescription(),
                    saved.isCompleted(),
                    username
            );

            return saved;
        });
    }

    // 4. מחיקת משימה ושליחת אירוע מחיקה ל-Kafka
    public boolean deleteTaskForUser(Long id, String username) {
        AppUser user = getUserByUsername(username);
        return taskRepository.findByIdAndUser(id, user).map(task -> {
            taskRepository.delete(task);

            // שליחת אירוע מחיקה ל-Kafka
            taskEventProducer.publishTaskDeletedEvent(id, username);
            return true;
        }).orElse(false);
    }

    // 5. צירוף קובץ למשימה
    public Optional<Task> attachFileToTask(Long taskId, String fileName, String username) {
        AppUser user = getUserByUsername(username);
        return taskRepository.findByIdAndUser(taskId, user).map(task -> {
            task.setAttachmentFileName(fileName);
            return taskRepository.save(task);
        });
    }

    // 6. שליפת משימה בודדת עבור קובץ מצורף
    public Optional<Task> getTaskByIdAndUser(Long taskId, String username) {
        AppUser user = getUserByUsername(username);
        return taskRepository.findByIdAndUser(taskId, user);
    }
}