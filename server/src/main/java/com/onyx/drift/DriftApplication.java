package com.onyx.drift;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching // ক্যাশিং এনাবল করার জন্য এটি অত্যন্ত জরুরি
public class DriftApplication {

    public static void main(String[] args) {
        SpringApplication.run(DriftApplication.class, args);
    }
}