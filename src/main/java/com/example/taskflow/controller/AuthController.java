package com.example.taskflow.controller;

import com.example.taskflow.model.AppUser;
import com.example.taskflow.repository.UserRepository;
import com.example.taskflow.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    // הגדרת מבנה הבקשה והתשובה בתוך המחלקה כדי למנוע שגיאות ייבוא
    public record AuthRequest(String username, String password) {}
    public record AuthResponse(String token, String username) {}

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        if (request.username() == null || request.username().trim().isEmpty() ||
                request.password() == null || request.password().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("שם משתמש וסיסמה הם שדות חובה");
        }

        if (userRepository.existsByUsername(request.username())) {
            return ResponseEntity.badRequest().body("שם המשתמש כבר קיים במערכת");
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        userRepository.save(new AppUser(request.username(), encodedPassword));
        return ResponseEntity.status(HttpStatus.CREATED).body("משתמש נוצר בהצלחה");
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        AppUser user = userRepository.findByUsername(request.username()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("שם משתמש או סיסמה שגויים");
        }

        String token = jwtService.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getUsername()));
    }
}