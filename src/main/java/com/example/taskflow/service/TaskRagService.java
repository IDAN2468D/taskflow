package com.example.taskflow.service;

import com.example.taskflow.model.search.TaskDocument;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskRagService {

    private static final Logger log = LoggerFactory.getLogger(TaskRagService.class);

    private final GeminiEmbeddingService embeddingService;
    private final ElasticsearchOperations elasticsearchOperations;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public TaskRagService(GeminiEmbeddingService embeddingService, ElasticsearchOperations elasticsearchOperations) {
        this.embeddingService = embeddingService;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    /**
     * מבצע את כל תהליך ה-RAG:
     * 1. יצירת וקטור סמנטי (Embedding) עבור השאילתה
     * 2. שליפת משימות רלוונטיות מ-Elasticsearch
     * 3. עיבוד המשימות כמקטעי הקשר (Context Chunks)
     * 4. יצירת תשובה מעוגנת ומנומקת באמצעות Gemini 1.5 Flash
     */
    public Map<String, Object> askTaskRag(String userQuery, String username) {
        log.info("Executing TaskFlow RAG pipeline for user '{}' with query: '{}'", username, userQuery);

        // 1. שלב ה-Embedding: יצירת וקטור סמנטי עבור שאילתת המשתמש
        List<Float> queryVector = embeddingService.generateEmbedding(userQuery);
        int vectorDim = (queryVector != null) ? queryVector.size() : 0;
        log.info("Generated query embedding vector with dimension: {}", vectorDim);

        // 2. שלב ה-Retrieval: איתור משימות רלוונטיות מ-Elasticsearch
        List<TaskDocument> relevantTasks = retrieveTasksFromElasticsearch(userQuery, username);

        // 3. יצירת ההקשר (Context Chunks)
        StringBuilder contextBuilder = createContextBuilder(relevantTasks);

        // 4. שלב ה-Generation: יצירת תשובה מנומקת ומעוגנת ע"י Gemini
        String aiAnswer = generateAnswerWithContext(userQuery, contextBuilder.toString());

        Map<String, Object> response = new HashMap<>();
        response.put("query", userQuery);
        response.put("answer", aiAnswer);
        response.put("embeddingDimension", vectorDim);
        response.put("retrievedTasksCount", relevantTasks.size());
        response.put("citedTasks", relevantTasks.stream().map(doc -> {
            Map<String, String> m = new HashMap<>();
            m.put("id", doc.getId());
            m.put("title", doc.getTitle());
            m.put("status", doc.getStatus());
            m.put("priority", doc.getPriority());
            return m;
        }).collect(Collectors.toList()));

        return response;
    }

    private static StringBuilder createContextBuilder(List<TaskDocument> relevantTasks) {
        StringBuilder contextBuilder = new StringBuilder();
        if (relevantTasks.isEmpty()) {
            contextBuilder.append("לא נמצאו משימות רלוונטיות במאגר.");
        } else {
            for (int i = 0; i < relevantTasks.size(); i++) {
                TaskDocument doc = relevantTasks.get(i);
                contextBuilder.append(String.format(
                        "[%d] מזהה: %s | כותרת: %s | סטטוס: %s | עדיפות: %s | תיאור: %s\n",
                        i + 1, doc.getId(), doc.getTitle(), doc.getStatus(), doc.getPriority(),
                        doc.getDescription() != null ? doc.getDescription() : "ללא פירוט"
                ));
            }
        }
        return contextBuilder;
    }

    private List<TaskDocument> retrieveTasksFromElasticsearch(String query, String username) {
        try {
            Criteria criteria = new Criteria("username").is(username)
                    .and(new Criteria("title").contains(query).or(new Criteria("description").contains(query)));

            CriteriaQuery criteriaQuery = new CriteriaQuery(criteria);
            criteriaQuery.setPageable(PageRequest.of(0, 5));

            SearchHits<TaskDocument> hits = elasticsearchOperations.search(criteriaQuery, TaskDocument.class);

            if (hits.hasSearchHits()) {
                return hits.getSearchHits().stream()
                        .map(SearchHit::getContent)
                        .collect(Collectors.toList());
            }

            // ברירת מחדל: שליפת 5 משימות אחרונות של המשתמש
            Criteria fallback = new Criteria("username").is(username);
            CriteriaQuery fallbackQuery = new CriteriaQuery(fallback);
            fallbackQuery.setPageable(PageRequest.of(0, 5));

            return elasticsearchOperations.search(fallbackQuery, TaskDocument.class)
                    .getSearchHits().stream()
                    .map(SearchHit::getContent)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("שגיאה בשליפת משימות מ-Elasticsearch (ייעשה שימוש בריכוז ריק): {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String generateAnswerWithContext(String query, String context) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return "נמצאו המשימות הבאות ב-Elasticsearch המתאימות לשאלתך:\n\n" + context;
        }

        try {
            String instruction = "אתה סוכן AI של TaskFlow Pro. ענה על שאלת המשתמש אך ורק בהתבסס על המשימות שלהלן:";
            String fullPrompt = instruction + "\n\n" + context + "\n\nשאלה: " + query;

            Map<String, Object> part = new HashMap<>();
            part.put("text", fullPrompt);

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", Collections.singletonList(part));

            Map<String, Object> body = new HashMap<>();
            body.put("contents", Collections.singletonList(contentMap));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> res = restTemplate.postForEntity(
                    GEMINI_API_URL + geminiApiKey, entity, String.class
            );

            if (res.getStatusCode().is2xxSuccessful() && res.getBody() != null) {
                JsonNode root = objectMapper.readTree(res.getBody());
                JsonNode textNode = root.path("candidates").get(0)
                        .path("content").path("parts").get(0).path("text");
                if (!textNode.isMissingNode()) {
                    return textNode.asText();
                }
            }
        } catch (Exception e) {
            log.warn("שגיאה בייצור תשובה מ-Gemini: {}", e.getMessage());
        }

        return "מערכת ה-RAG איתרה את המשימות הבאות עבורך:\n\n" + context;
    }
}