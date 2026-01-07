package com.onyx.drift.controller;

import com.onyx.drift.model.User;
import com.onyx.drift.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
// origins = "*" এর বদলে আপনার ফ্রন্টএন্ড ইউআরএল দেওয়া বেশি নিরাপদ
@CrossOrigin(origins = {"http://localhost:5173", "https://onyx-drift-app-final.onrender.com"}) 
public class AuthController {

    @Autowired
    private AuthService authService;

    // ১. সাইন আপ এপিআই
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            String result = authService.registerUser(user);
            if (result.contains("Error")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Database connection failed"));
        }
    }

    // ২. লগইন এপিআই
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }

        Optional<User> user = authService.loginUser(username, password);
        if (user.isPresent()) {
            // সিকিউরিটির জন্য পাসওয়ার্ড ফিল্ডটি নাল করে পাঠানো ভালো
            User foundUser = user.get();
            foundUser.setPassword(null); 
            return ResponseEntity.ok(foundUser);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid username or password!"));
        }
    }
}