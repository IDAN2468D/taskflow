package com.example.taskflow.mcp.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.io.Serializable;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class McpResponse implements Serializable {
    private String jsonrpc = "2.0";
    private Object id;
    private Object result;
    private Map<String, Object> error;

    public McpResponse() {}
    public McpResponse(Object id, Object result) {
        this.id = id;
        this.result = result;
    }
    public static McpResponse success(Object id, Object result) {
        return new McpResponse(id, result);
    }
    public static McpResponse error(Object id, int code, String message) {
        McpResponse res = new McpResponse();
        res.setId(id);
        res.setError(Map.of("code", code, "message", message));
        return res;
    }
    public String getJsonrpc() { return jsonrpc; }
    public void setJsonrpc(String jsonrpc) { this.jsonrpc = jsonrpc; }
    public Object getId() { return id; }
    public void setId(Object id) { this.id = id; }
    public Object getResult() { return result; }
    public void setResult(Object result) { this.result = result; }
    public Map<String, Object> getError() { return error; }
    public void setError(Map<String, Object> error) { this.error = error; }
}