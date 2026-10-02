package com.example.taskflow.dto;

public class AuthDtos {
    public record AuthRequest(String username, String password) {}
    public record AuthResponse(String token, String username) {}
}