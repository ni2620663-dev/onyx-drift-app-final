package com.onyx.drift.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. CORS কনফিগারেশন
            .cors(Customizer.withDefaults())
            
            // 2. CSRF ডিজেবল করা (H2 Console এবং API এর জন্য জরুরি)
            .csrf(csrf -> csrf.disable()) 
            
            // 3. অথরাইজেশন রুলস
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/h2-console/**").permitAll() // H2 Console অনুমতি দেওয়া হলো
                .requestMatchers("/ws/**").permitAll()        // WebSocket অনুমতি দেওয়া হলো
                .requestMatchers("/api/auth/**").permitAll()  // Auth API অনুমতি দেওয়া হলো
                .requestMatchers("/api/posts/**", "/api/follow/**", "/api/notifications/**").permitAll()
                .anyRequest().permitAll() // ডেভেলপমেন্টের সুবিধার্থে আপাতত সব রিকোয়েস্ট অনুমতি দেওয়া হলো
            )
            
            // 4. H2 কনসোল বা ফ্রেম অপশন হ্যান্ডলিং (এটি ছাড়া H2 Console দেখা যায় না)
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));
        
        return http.build();
    }

    // 5. পাসওয়ার্ড এনক্রিপ্ট করার জন্য (BCrypt)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 6. CORS সেটিংস (React/Vite সব ধরণের ফ্রন্টএন্ডের জন্য)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // ফ্রন্টএন্ড এর সম্ভাব্য সব অরিজিন এলাও করা (3000 এবং 5173)
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "http://localhost:5173", 
            "http://127.0.0.1:5173"
        )); 
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}