package com.example.taskflow.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    // מפתח סודי באורך 256 ביט לפחות לחתימת ה-Token
    private static final String SECRET_STRING = "taskflow_super_secret_key_for_jwt_signing_2026_modern_backend_key";
    private final SecretKey signingKey = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    // תוקף ה-Token: 24 שעות
    private static final long EXPIRATION_TIME_MS = 1000 * 60 * 60 * 24;

    // 1. יצירת Token חדש עבור שם משתמש
    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME_MS))
                .signWith(signingKey)
                .compact();
    }

    // 2. חילוץ שם המשתמש מתוך ה-Token
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // 3. בדיקה האם ה-Token תקף (לא פג תוקף ושם המשתמש תואם)
    public boolean isTokenValid(String token, String username) {
        final String extractedUser = extractUsername(token);
        return (extractedUser.equals(username) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}