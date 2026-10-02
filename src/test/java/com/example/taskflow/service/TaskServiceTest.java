package com.example.taskflow.service;

import com.example.taskflow.model.AppUser;
import com.example.taskflow.model.Task;
import com.example.taskflow.repository.TaskRepository;
import com.example.taskflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private AppUser mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new AppUser("israel", "encodedPassword");
    }

    @Test
    @DisplayName("בדיקת יצירת משימה בהצלחה עבור משתמש קיים")
    void testCreateTaskForUser_Success() {
        // Arrange (הכנת הנתונים וההדמיות)
        Task taskToCreate = new Task("ללמוד Mockito", "בדיקות יחידה");
        when(userRepository.findByUsername("israel")).thenReturn(Optional.of(mockUser));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act (ביצוע הפעולה)
        Task created = taskService.createTaskForUser(taskToCreate, "israel");

        // Assert (אימות התוצאות)
        assertNotNull(created);
        assertEquals("ללמוד Mockito", created.getTitle());
        assertEquals(mockUser, created.getUser());
        verify(taskRepository, times(1)).save(taskToCreate);
    }

    @Test
    @DisplayName("בדיקה שזריקת שגיאה מתרחשת כאשר המשתמש לא קיים")
    void testCreateTaskForUser_UserNotFound() {
        // Arrange
        Task taskToCreate = new Task("משימה", "תיאור");
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            taskService.createTaskForUser(taskToCreate, "unknown");
        });

        // לוודא שכלל לא ניסינו לשמור משימה במסד הנתונים
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("בדיקת שליפת משימות של משתמש")
    void testGetAllTasksForUser() {
        // Arrange
        Task t1 = new Task("משימה 1", "תיאור 1");
        Task t2 = new Task("משימה 2", "תיאור 2");
        when(userRepository.findByUsername("israel")).thenReturn(Optional.of(mockUser));
        when(taskRepository.findByUser(mockUser)).thenReturn(List.of(t1, t2));

        // Act
        List<Task> results = taskService.getAllTasksForUser("israel", Optional.empty());

        // Assert
        assertEquals(2, results.size());
        assertEquals("משימה 1", results.get(0).getTitle());
    }

    @Test
    @DisplayName("בדיקת מחיקת משימה של המשתמש")
    void testDeleteTaskForUser_Success() {
        // Arrange
        Task existingTask = new Task("למחוק", "תיאור");
        when(userRepository.findByUsername("israel")).thenReturn(Optional.of(mockUser));
        when(taskRepository.findByIdAndUser(1L, mockUser)).thenReturn(Optional.of(existingTask));

        // Act
        boolean deleted = taskService.deleteTaskForUser(1L, "israel");

        // Assert
        assertTrue(deleted);
        verify(taskRepository, times(1)).delete(existingTask);
    }
}