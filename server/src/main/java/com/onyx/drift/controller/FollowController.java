package com.onyx.drift.controller;

import com.onyx.drift.model.Follow;
import com.onyx.drift.repository.FollowRepository;
import com.onyx.drift.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/follow")
@CrossOrigin(origins = "*")
public class FollowController {

    @Autowired 
    private FollowRepository followRepository;

    // নোটিফিকেশন পাঠানোর লজিক PostService-এ আছে
    @Autowired 
    private PostService postService;

    /**
     * ইউজারকে ফলো করার এপিআই
     * @param followingUser যাকে ফলো করা হচ্ছে
     * @param currentUser যে ফলো করছে
     */
    @PostMapping("/{followingUser}")
    public ResponseEntity<String> followUser(
            @PathVariable String followingUser, 
            @RequestParam String currentUser) {
        
        // ১. ফলো রিলেশন তৈরি ও সেভ করা (Point 3 - Social Graph)
        Follow follow = new Follow();
        follow.setFollowerUsername(currentUser);
        follow.setFollowingUsername(followingUser);
        followRepository.save(follow);

        // ২. রিয়েল-টাইম নোটিফিকেশন ট্রিগার করা (Point 5 & 6)
        // এটি যাকে ফলো করা হয়েছে তার কাছে মেসেজ পাঠাবে
        try {
            postService.sendNotification(currentUser, followingUser, "FOLLOW");
        } catch (Exception e) {
            // নোটিফিকেশন এরর হলে ফলো প্রসেস থামবে না
            System.err.println("Notification failed: " + e.getMessage());
        }

        return ResponseEntity.ok("Successfully followed " + followingUser);
    }

    /**
     * আনফলো করার অপশন (অতিরিক্ত বোনাস লজিক)
     */
    @DeleteMapping("/{followingUser}")
    public ResponseEntity<String> unfollowUser(
            @PathVariable String followingUser, 
            @RequestParam String currentUser) {
        
        followRepository.deleteByFollowerUsernameAndFollowingUsername(currentUser, followingUser);
        return ResponseEntity.ok("Successfully unfollowed " + followingUser);
    }
}