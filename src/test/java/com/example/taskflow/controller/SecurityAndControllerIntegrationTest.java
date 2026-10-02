package com.example.taskflow.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityAndControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("אימות אבטחה: פנייה ל-API המשימות ללא Token חוסמת את הבקשה ב-403")
    void testGetTasksWithoutToken_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("אימות אבטחה: דף הבית פתוח לכולם ללא Token")
    void testHomePage_IsPermitted() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("הרשמה: רישום משתמש תקין מחזיר 201 Created")
    void testRegisterUser_Success() throws Exception {
        String uniqueUser = "testuser_" + System.currentTimeMillis();
        String jsonBody = "{\"username\": \"" + uniqueUser + "\", \"password\": \"testpass123\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isCreated());
    }
}