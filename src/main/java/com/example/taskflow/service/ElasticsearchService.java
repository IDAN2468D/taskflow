package com.example.taskflow.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ElasticsearchService {

    private final RestClient restClient;

    // 1. בנאי ריק כברירת מחדל - פותר את שגיאת הקומפילציה!
    public ElasticsearchService() {
        this(System.getenv("SPRING_ELASTICSEARCH_URIS") != null ?
                System.getenv("SPRING_ELASTICSEARCH_URIS") : "http://localhost:9200");
    }

    // 2. בנאי ש-Spring מזריק אליו את ה-URI המדויק מתוך Docker
    @Autowired
    public ElasticsearchService(@Value("${spring.elasticsearch.uris:http://localhost:9200}") String esUri) {
        System.out.println("[ELASTICSEARCH INIT 🚀] מתחבר לשרת בכתובת: " + esUri);
        this.restClient = RestClient.builder()
                .baseUrl(esUri)
                .build();
    }

    public void indexTask(Long taskId, String title, String description, String username) {
        try {
            Map<String, Object> document = new HashMap<>();
            document.put("taskId", taskId);
            document.put("title", title != null ? title : "");
            document.put("description", description != null ? description : "");
            document.put("username", username != null ? username : "");

            restClient.put()
                    .uri("/tasks/_doc/{id}", taskId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(document)
                    .retrieve()
                    .toBodilessEntity();

            System.out.println("[ELASTICSEARCH 🔍] אונדקסה משימה " + taskId + " | כותרת: " + title + " | תיאור: " + description);
        } catch (Exception e) {
            System.err.println("[ELASTICSEARCH ERROR] שגיאה באינדוקס: " + e.getMessage());
        }
    }

    public void deleteTask(Long taskId) {
        try {
            restClient.delete()
                    .uri("/tasks/_doc/{id}", taskId)
                    .retrieve()
                    .toBodilessEntity();

            System.out.println("[ELASTICSEARCH 🗑️] משימה " + taskId + " נמחקה מ-Elasticsearch");
        } catch (Exception e) {
            System.err.println("[ELASTICSEARCH DELETE ERROR] שגיאה במחיקה: " + e.getMessage());
        }
    }

    public String searchTasks(String query, String username) {
        try {
            String trimmedQuery = query.trim();
            if (trimmedQuery.isEmpty()) {
                return "{\"hits\":{\"hits\":[]}}";
            }

            String wildcardQuery = "*" + trimmedQuery + "*";

            Map<String, Object> queryString = Map.of(
                    "query", wildcardQuery,
                    "fields", List.of("title", "description"),
                    "default_operator", "OR"
            );

            Map<String, Object> searchPayload = Map.of(
                    "query", Map.of(
                            "bool", Map.of(
                                    "must", List.of(Map.of("query_string", queryString)),
                                    "filter", List.of(Map.of("match", Map.of("username", username)))
                            )
                    )
            );

            String response = restClient.post()
                    .uri("/tasks/_search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(searchPayload)
                    .retrieve()
                    .body(String.class);

            System.out.println("[ELASTICSEARCH 🔍] תוצאות שהתקבלו: " + response);
            return response;
        } catch (Exception e) {
            System.err.println("[ELASTICSEARCH SEARCH ERROR] שגיאה: " + e.getMessage());
            return "{\"hits\":{\"hits\":[]}}";
        }
    }
}