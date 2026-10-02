package com.example.taskflow.service;

import com.example.taskflow.dto.AuthDtos.AuthRequest;
import com.example.taskflow.dto.AuthDtos.AuthResponse;
import com.example.taskflow.model.AppUser;
import com.example.taskflow.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AppUser register(AuthRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("שם המשתמש כבר קיים במערכת");
        }
        String encodedPassword = passwordEncoder.encode(request.password());
        return userRepository.save(new AppUser(request.username(), encodedPassword));
    }

    public AuthResponse authenticate(AuthRequest request) {
        AppUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new IllegalArgumentException("שם משתמש או סיסמה שגויים"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("שם משתמש או סיסמה שגויים");
        }

        // יצירת JWT אמיתי וחתום
        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername());
    }
}