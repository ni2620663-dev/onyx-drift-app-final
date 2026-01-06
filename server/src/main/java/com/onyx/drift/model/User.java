package com.onyx.drift.model;

import jakarta.persistence.*;
import lombok.Data; // এটি ইম্পোর্ট করতে হবে

@Data // এটি আপনার সব Getter, Setter, এবং Constructor তৈরি করে দেবে
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private String avatar;
}