package com.example.taskflow.mcp;

import com.example.taskflow.mcp.model.McpRequest;
import com.example.taskflow.mcp.model.McpResponse;
import com.example.taskflow.model.Task;
import com.example.taskflow.service.TaskRagService;
import com.example.taskflow.service.TaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class McpServerService {

    private final TaskService taskService;
    private final TaskRagService taskRagService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public McpServerService(TaskService taskService, TaskRagService taskRagService) {
        this.taskService = taskService;
        this.taskRagService = taskRagService;
    }

    public McpResponse handleMcpRequest(McpRequest request, String username) {
        String method = request.getMethod();
        Object id = request.getId();

        if (method == null) {
            return McpResponse.error(id, -32600, "Invalid Request");
        }

        switch (method) {
            case "initialize":
                return McpResponse.success(id, Map.of(
                        "protocolVersion", "2024-11-05",
                        "capabilities", Map.of("tools", Map.of()),
                        "serverInfo", Map.of("name", "taskflow-mcp-server", "version", "1.0.0")
                ));

            case "notifications/initialized":
                return McpResponse.success(id, Collections.emptyMap());

            case "ping":
                return McpResponse.success(id, Collections.emptyMap());

            case "tools/list":
                return McpResponse.success(id, Map.of("tools", List.of(
                        Map.of(
                                "name", "taskflow_list_tasks",
                                "description", "שליפת כל המשימות של המשתמש ב-TaskFlow",
                                "inputSchema", Map.of("type", "object", "properties", Map.of())
                        ),
                        Map.of(
                                "name", "taskflow_create_task",
                                "description", "יצירת משימה חדשה ב-TaskFlow",
                                "inputSchema", Map.of(
                                        "type", "object",
                                        "required", List.of("title"),
                                        "properties", Map.of(
                                                "title", Map.of("type", "string", "description", "כותרת המשימה"),
                                                "description", Map.of("type", "string", "description", "פירוט המשימה")
                                        )
                                )
                        ),
                        Map.of(
                                "name", "taskflow_search_rag",
                                "description", "חיפוש סמנטי ו-RAG מול משימות המערכת",
                                "inputSchema", Map.of(
                                        "type", "object",
                                        "required", List.of("query"),
                                        "properties", Map.of("query", Map.of("type", "string", "description", "שאילתה לחיפוש"))
                                )
                        )
                )));

            case "tools/call":
                return handleToolCall(id, request.getParams(), username);

            default:
                return McpResponse.error(id, -32601, "Method not found: " + method);
        }
    }

    @SuppressWarnings("unchecked")
    private McpResponse handleToolCall(Object id, Map<String, Object> params, String username) {
        if (params == null) {
            return McpResponse.error(id, -32602, "Invalid params: params map is required");
        }
        String toolName = (String) params.get("name");
        Map<String, Object> args = (Map<String, Object>) params.getOrDefault("arguments", Collections.emptyMap());

        try {
            String textResult;
            if ("taskflow_list_tasks".equals(toolName)) {
                List<Task> tasks = taskService.getAllTasksForUser(username, Optional.empty());
                textResult = objectMapper.writeValueAsString(tasks);
            } else if ("taskflow_create_task".equals(toolName)) {
                Task task = new Task();
                task.setTitle((String) args.get("title"));
                task.setDescription((String) args.get("description"));
                Task saved = taskService.createTaskForUser(task, username);
                textResult = "המשימה נוצרה בהצלחה במערכת: " + saved.getId() + " - " + saved.getTitle();
            } else if ("taskflow_search_rag".equals(toolName)) {
                Map<String, Object> ragRes = taskRagService.askTaskRag((String) args.get("query"), username);
                textResult = objectMapper.writeValueAsString(ragRes);
            } else {
                return McpResponse.error(id, -32601, "כלי לא מוכר: " + toolName);
            }

            return McpResponse.success(id, Map.of(
                    "content", List.of(Map.of("type", "text", "text", textResult))
            ));
        } catch (Exception e) {
            return McpResponse.success(id, Map.of(
                    "content", List.of(Map.of("type", "text", "text", "שגיאה: " + e.getMessage())),
                    "isError", true
            ));
        }
    }
}