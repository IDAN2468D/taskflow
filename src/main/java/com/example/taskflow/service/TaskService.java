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

    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       TaskEventProducer taskEventProducer) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskEventProducer = taskEventProducer;
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

    // 2. שמירת משימה ושליחת אירוע ל-Kafka
    public Task createTaskForUser(Task task, String username) {
        AppUser user = getUserByUsername(username);
        task.setUser(user);

        // כאן מוגדר המשתנה saved שמחזיק את המשימה השמורה עם ה-ID שנוצר
        Task saved = taskRepository.save(task);

        // שליחת אירוע ל-Kafka בזמן אמת
        taskEventProducer.publishTaskCreatedEvent(saved.getId(), saved.getTitle(), saved.getDescription(), username);

        return saved;
    }

    // 3. עדכון משימה
    public Optional<Task> updateTaskForUser(Long id, Task updatedTask, String username) {
        AppUser user = getUserByUsername(username);
        return taskRepository.findByIdAndUser(id, user).map(existing -> {
            existing.setTitle(updatedTask.getTitle());
            existing.setDescription(updatedTask.getDescription());
            existing.setCompleted(updatedTask.isCompleted());
            return taskRepository.save(existing);
        });
    }

    // 4. מחיקת משימה
    public boolean deleteTaskForUser(Long id, String username) {
        AppUser user = getUserByUsername(username);
        return taskRepository.findByIdAndUser(id, user).map(task -> {
            taskRepository.delete(task);
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