package com.example.taskflow.mcp;

import com.example.taskflow.mcp.model.McpRequest;
import com.example.taskflow.mcp.model.McpResponse;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mcp")
@CrossOrigin(origins = "*")
public class McpController {

    private final McpServerService mcpServerService;

    public McpController(McpServerService mcpServerService) {
        this.mcpServerService = mcpServerService;
    }

    /**
     * בדיקה מהירה בדפדפן: http://localhost:8080/api/mcp
     */
    @GetMapping
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("TaskFlow MCP Server is Running!");
    }

    /**
     * נקודת הקצה הרשמית של שרת ה-MCP לפקודות JSON-RPC 2.0
     */
    @PostMapping
    public ResponseEntity<McpResponse> handleMcp(@RequestBody(required = false) McpRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(
                    McpResponse.error(null, -32600, "Invalid Request: Request body is empty or null")
            );
        }
        McpResponse response = mcpServerService.handleMcpRequest(request, "admin");
        return ResponseEntity.ok(response);
    }

    /**
     * טיפול במקרה של JSON משובש או חלקי שנשלח לשרת
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<McpResponse> handleJsonParseException(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(
                McpResponse.error(null, -32700, "Parse error: Malformed JSON request body")
        );
    }
}