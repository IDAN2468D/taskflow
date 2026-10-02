package com.example.taskflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // ערוץ ההפצה מהשרת לדפדפנים המאזינים
        registry.enableSimpleBroker("/topic");

        // קידומת להודעות שנשלחות מהדפדפן לשרת (אם נרצה בעתיד)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint החיבור עם תמיכה ב-CORS עבור Next.js (פורט 3000)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000", "http://127.0.0.1:3000", "*")
                .withSockJS();

        // תמיכה בחיבור WebSocket רגיל
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000", "http://127.0.0.1:3000", "*");
    }
}