package com.example.taskflow.service;

import com.example.taskflow.mcp.McpServerService;
import com.example.taskflow.mcp.model.McpRequest;
import com.example.taskflow.mcp.model.McpResponse;
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
public class GeminiAgentService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAgentService.class);

    private final McpServerService mcpServerService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public GeminiAgentService(McpServerService mcpServerService) {
        this.mcpServerService = mcpServerService;
    }

    /**
     * הרצת לולאת הסוכן: Gemini צורך ומפעיל את שרת ה-MCP
     */
    public Map<String, Object> chatWithAgent(String userMessage, String username) {
        log.info("סוכן Gemini מעבד בקשה מ-{} מול שרת ה-MCP: {}", username, userMessage);

        Map<String, Object> finalResult = new HashMap<>();
        finalResult.put("userMessage", userMessage);

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            finalResult.put("reply", "מפתח ה-GEMINI_API_KEY אינו מוגדר בשרת.");
            return finalResult;
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();

            // 1. הוראות מערכת לסוכן
            Map<String, Object> sysPart = Map.of("text",
                    "אתה סוכן AI של מערכת TaskFlow Pro. " +
                            "עומדים לרשותך כלי מערכת ישירות דרך שרת ה-MCP (Model Context Protocol). " +
                            "השתמש בכלים כאשר המשתמש מבקש לראות, להוסיף או לחפש משימות, וענה תמיד בעברית ברורה ומקצועית.");
            requestBody.put("systemInstruction", Map.of("parts", List.of(sysPart)));

            // 2. הוספת הודעת המשתמש
            List<Map<String, Object>> contents = new ArrayList<>();
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userMessage))
            ));
            requestBody.put("contents", contents);

            // 3. שליפת כלים דינמית משרת ה-MCP והמרתם לפורמט Gemini
            List<Map<String, Object>> geminiTools = getDynamicGeminiToolsFromMcp(username);
            if (!geminiTools.isEmpty()) {
                requestBody.put("tools", List.of(Map.of("function_declarations", geminiTools)));
            }

            // סיבוב 1: שליחה ראשונה ל-Gemini עם הכלים
            ResponseEntity<String> firstResponse = callGemini(requestBody);
            if (!firstResponse.getStatusCode().is2xxSuccessful() || firstResponse.getBody() == null) {
                finalResult.put("reply", "שגיאה בתקשורת מול Gemini API");
                return finalResult;
            }

            JsonNode firstRoot = objectMapper.readTree(firstResponse.getBody());
            JsonNode candidateContent = firstRoot.path("candidates").get(0).path("content");
            JsonNode parts = candidateContent.path("parts");

            // בדיקה אם Gemini בחר לקרוא לכלי MCP
            JsonNode functionCallNode = null;
            for (JsonNode part : parts) {
                if (part.has("functionCall")) {
                    functionCallNode = part.get("functionCall");
                    break;
                }
            }

            if (functionCallNode != null) {
                String toolName = functionCallNode.path("name").asText();
                JsonNode argsNode = functionCallNode.path("args");
                Map<String, Object> arguments = objectMapper.convertValue(argsNode, Map.class);

                log.info("Gemini בחר להפעיל כלי MCP: '{}' עם ארגומנטים: {}", toolName, arguments);
                finalResult.put("executedTool", toolName);
                finalResult.put("toolArguments", arguments);

                // הפעלת הכלי דרך שרת ה-MCP בתקן JSON-RPC
                McpRequest mcpReq = new McpRequest();
                mcpReq.setId(UUID.randomUUID().toString());
                mcpReq.setMethod("tools/call");
                mcpReq.setParams(Map.of(
                        "name", toolName,
                        "arguments", arguments != null ? arguments : Collections.emptyMap()
                ));

                McpResponse mcpResp = mcpServerService.handleMcpRequest(mcpReq, username);
                String toolExecutionText = objectMapper.writeValueAsString(mcpResp.getResult());
                finalResult.put("mcpResult", mcpResp.getResult());

                // החזרת תוצאת הכלי ל-Gemini כ-functionResponse
                contents.add(Map.of("role", "model", "parts", List.of(Map.of("functionCall", functionCallNode))));
                contents.add(Map.of("role", "function", "parts", List.of(Map.of(
                        "functionResponse", Map.of(
                                "name", toolName,
                                "response", Map.of("result", toolExecutionText)
                        )
                ))));

                requestBody.put("contents", contents);

                // סיבוב 2: קבלת ניסוח התשובה הסופית מ-Gemini
                ResponseEntity<String> secondResponse = callGemini(requestBody);
                if (secondResponse.getStatusCode().is2xxSuccessful() && secondResponse.getBody() != null) {
                    JsonNode secondRoot = objectMapper.readTree(secondResponse.getBody());
                    String finalAnswer = secondRoot.path("candidates").get(0)
                            .path("content").path("parts").get(0).path("text").asText();
                    finalResult.put("reply", finalAnswer);
                } else {
                    finalResult.put("reply", "הכלי הופעל בהצלחה דרך MCP: " + toolExecutionText);
                }

            } else {
                // תשובה מילולית ישירה של Gemini (ללא צורך בהפעלת כלי)
                String reply = parts.get(0).path("text").asText();
                finalResult.put("reply", reply);
            }

        } catch (Exception e) {
            log.error("שגיאה בזרימת Gemini מול MCP", e);
            finalResult.put("reply", "שגיאה בעיבוד בקשת הסוכן: " + e.getMessage());
        }

        return finalResult;
    }

    /**
     * שליפת כל הכלים משרת ה-MCP והמרת ה-inputSchema ל-parameters של Gemini
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getDynamicGeminiToolsFromMcp(String username) {
        try {
            McpRequest listReq = new McpRequest();
            listReq.setId("gemini-discover-tools");
            listReq.setMethod("tools/list");

            McpResponse resp = mcpServerService.handleMcpRequest(listReq, username);
            if (resp == null || resp.getResult() == null) {
                return Collections.emptyList();
            }

            Map<String, Object> resMap = (Map<String, Object>) resp.getResult();
            List<Map<String, Object>> mcpTools = (List<Map<String, Object>>) resMap.get("tools");
            if (mcpTools == null) return Collections.emptyList();

            List<Map<String, Object>> geminiTools = new ArrayList<>();
            for (Map<String, Object> tool : mcpTools) {
                String name = (String) tool.get("name");
                String description = (String) tool.get("description");
                Map<String, Object> inputSchema = (Map<String, Object>) tool.get("inputSchema");

                Map<String, Object> geminiDecl = new HashMap<>();
                geminiDecl.put("name", name);
                geminiDecl.put("description", description);
                geminiDecl.put("parameters", convertSchemaToGeminiParameters(inputSchema));

                geminiTools.add(geminiDecl);
            }
            return geminiTools;
        } catch (Exception e) {
            log.warn("שגיאה בטעינת כלים דינמית מ-MCP: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertSchemaToGeminiParameters(Map<String, Object> mcpSchema) {
        if (mcpSchema == null) {
            return Map.of("type", "OBJECT", "properties", Map.of());
        }

        Map<String, Object> geminiParams = new HashMap<>();
        for (Map.Entry<String, Object> entry : mcpSchema.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if ("type".equals(key) && value instanceof String) {
                geminiParams.put("type", ((String) value).toUpperCase());
            } else if ("properties".equals(key) && value instanceof Map) {
                Map<String, Object> props = (Map<String, Object>) value;
                Map<String, Object> convertedProps = new HashMap<>();
                for (Map.Entry<String, Object> prop : props.entrySet()) {
                    if (prop.getValue() instanceof Map) {
                        convertedProps.put(prop.getKey(), convertSchemaToGeminiParameters((Map<String, Object>) prop.getValue()));
                    } else {
                        convertedProps.put(prop.getKey(), prop.getValue());
                    }
                }
                geminiParams.put("properties", convertedProps);
            } else {
                geminiParams.put(key, value);
            }
        }
        return geminiParams;
    }

    private ResponseEntity<String> callGemini(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForEntity(GEMINI_API_URL + geminiApiKey, entity, String.class);
    }
}