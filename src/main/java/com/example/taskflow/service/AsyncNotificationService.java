package com.example.taskflow.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncNotificationService {

    @Async // רץ ב-Thread נפרד ברקע!
    public void processFileUploadInBackground(String fileName, String username) {
        try {
            System.out.println("[ASYNC THREAD: " + Thread.currentThread().getName() +
                    "] התחלת סריקת אבטחה לקובץ: " + fileName + " של המשתמש: " + username);

            // הדמיית פעולה כבדה של 3 שניות (כגון סריקה, דחיסה או יצירת תמונה ממוזערת)
            Thread.sleep(3000);

            System.out.println("[ASYNC THREAD: " + Thread.currentThread().getName() +
                    "] הקובץ " + fileName + " נסרק ואושר בהצלחה!");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}