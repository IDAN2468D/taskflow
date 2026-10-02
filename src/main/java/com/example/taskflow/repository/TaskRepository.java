package com.example.taskflow.repository;

import com.example.taskflow.model.AppUser;
import com.example.taskflow.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // שליפת כל המשימות השייכות למשתמש ספציפי
    List<Task> findByUser(AppUser user);

    // שליפת משימות של משתמש לפי סטטוס
    List<Task> findByUserAndCompleted(AppUser user, boolean completed);

    // Spring Data JPA מייצר אוטומטית את שאילתת ה-SQL לפי שם המתודה!
    List<Task> findByCompleted(boolean completed);

    // שליפת משימה בודדת לפי ID רק אם היא שייכת למשתמש
    Optional<Task> findByIdAndUser(Long id, AppUser user);
}