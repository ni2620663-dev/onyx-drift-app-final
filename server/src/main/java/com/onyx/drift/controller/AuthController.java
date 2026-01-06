package com.onyx.drift.controller;

import com.onyx.drift.model.User;
import com.onyx.drift.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    // সাইন আপ এপিআই
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        String result = authService.registerUser(user);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // লগইন এপিআই
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        Optional<User> user = authService.loginUser(username, password);
        if (user.isPresent()) {
            // আপাতত সাকসেস মেসেজ দিচ্ছি, পরে এখানে JWT টোকেন রিটার্ন করবে
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.status(401).body("Invalid username or password!");
        }
    }
}