package com.example.taskflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiEmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(GeminiEmbeddingService.class);

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String EMBED_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=";

    /**
     * מקבל טקסט ומייצר וקטור נומרי באורך 768 ממדים באמצעות מודל text-embedding-004
     */
    public List<Float> generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            return generateFallbackVector("empty");
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("מפתח GEMINI_API_KEY אינו מוגדר. נעשה שימוש בוקטור מקומי.");
            return generateFallbackVector(text);
        }

        try {
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", text);

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", Collections.singletonList(textPart));

            Map<String, Object> body = new HashMap<>();
            body.put("model", "models/text-embedding-004");
            body.put("content", contentMap);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    EMBED_ENDPOINT + apiKey,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode valuesArray = root.path("embedding").path("values");

                if (valuesArray.isArray() && valuesArray.size() > 0) {
                    List<Float> vector = new ArrayList<>();
                    for (JsonNode val : valuesArray) {
                        vector.add((float) val.asDouble());
                    }
                    return vector;
                }
            }
        } catch (Exception e) {
            log.warn("שגיאה בפנייה ל-API של Gemini (יופעל וקטור חלופי): {}", e.getMessage());
        }

        return generateFallbackVector(text);
    }

    /**
     * ייצור וקטור נורמלי באורך 768 למקרה שאין מפתח או שאין חיבור לרשת
     */
    private List<Float> generateFallbackVector(String text) {
        Random random = new Random(text.hashCode());
        List<Float> vector = new ArrayList<>(768);
        float sumOfSquares = 0.0f;

        for (int i = 0; i < 768; i++) {
            float v = random.nextFloat() * 2.0f - 1.0f;
            vector.add(v);
            sumOfSquares += v * v;
        }

        float norm = (float) Math.sqrt(sumOfSquares);
        for (int i = 0; i < 768; i++) {
            vector.set(i, vector.get(i) / norm);
        }

        return vector;
    }
}