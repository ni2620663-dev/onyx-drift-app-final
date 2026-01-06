package com.onyx.drift.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // ক্লায়েন্ট এই টপিকে সাবস্ক্রাইব করবে (যেমন: /topic/posts)
        config.enableSimpleBroker("/topic");
        
        // ক্লায়েন্ট সার্ভারে মেসেজ পাঠানোর জন্য এই প্রিফিক্স ব্যবহার করবে (যেমন: /app/addNewUser)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // আপনার লোকাল এবং লাইভ ডোমেইন দুটোই এখানে এলাও করা হয়েছে
                .setAllowedOriginPatterns(
                    "http://localhost:5173", 
                    "https://www.onyx-drift.com", 
                    "https://onyx-drift-app-final.onrender.com"
                )
                .withSockJS(); // SockJS সাপোর্ট নিশ্চিত করে
    }
}