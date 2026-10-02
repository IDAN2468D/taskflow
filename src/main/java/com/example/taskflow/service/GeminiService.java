package com.example.taskflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final RestClient restClient;
    private final String apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // DTO לייצוג משימה שהופקה על ידי Gemini
    public record SuggestedTask(String title, String description) {}

    public GeminiService(@Value("${gemini.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public List<SuggestedTask> generateSubtasks(String userGoal) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("הדבק_כאן")) {
            System.out.println("[GEMINI INFO] לא הוגדר מפתח API, משתמש במענה חכם מקומי.");
            return generateFallback(userGoal);
        }

        try {
            // Prompt Engineering ממוקד להחזרת משימות מעשיות בעברית
            String promptText = String.format(
                    "אתה עוזר מומחה לניהול משימות ופרויקטים. קבל את היעד הבא מהמשתמש: '%s'. " +
                            "פרק אותו בדיוק ל-3 עד 4 משימות מעשיות, מדויקות וברורות בעברית. " +
                            "החזר אך ורק מערך JSON שבו כל איבר מכיל שדות 'title' ו-'description'.",
                    userGoal
            );

            // מבנה הבקשה הרשמי של Google Gemini REST API
            Map<String, Object> requestPayload = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", promptText)))
                    ),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json", // מבטיח קבלת JSON מובנה
                            "temperature", 0.7
                    )
            );

            System.out.println("[GEMINI 🤖] שולח יעד לפירוק למודל gemini-3.5-flash-lite Flash...");

            String jsonResponse = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/gemini-3.5-flash-lite:generateContent")
                            .queryParam("key", apiKey)
                            .build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            // חילוץ הטקסט מתוך מענה ה-JSON של Gemini
            JsonNode root = objectMapper.readTree(jsonResponse);
            String rawJsonText = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            JsonNode tasksArray = objectMapper.readTree(rawJsonText);
            List<SuggestedTask> result = new ArrayList<>();
            for (JsonNode node : tasksArray) {
                result.add(new SuggestedTask(
                        node.path("title").asText(),
                        node.path("description").asText()
                ));
            }

            System.out.println("[GEMINI 🤖] התקבלו " + result.size() + " משימות בהצלחה מג'מיני!");
            return result;

        } catch (Exception e) {
            System.err.println("[GEMINI ERROR] תקלה בפנייה ל-Gemini: " + e.getMessage());
            return generateFallback(userGoal);
        }
    }

    private List<SuggestedTask> generateFallback(String goal) {
        return List.of(
                new SuggestedTask("שלב 1: אפיון ותכנון - " + goal, "הגדרת דרישות המערכת, תרשימי ארכיטקטורה וחלוקה ללוחות זמנים"),
                new SuggestedTask("שלב 2: מימוש ופיתוח תשתיתי", "כתיבת קוד ה-Core, הגדרת מסד הנתונים ואינטגרציות נדרשות"),
                new SuggestedTask("שלב 3: בדיקות אוטומטיות ואימות", "כתיבת בדיקות יחידה ואינטגרציה ואימות עמידה ביעדי " + goal)
        );
    }
}