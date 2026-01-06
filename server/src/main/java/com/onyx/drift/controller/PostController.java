package com.onyx.drift.controller;

import com.onyx.drift.model.Post;
import com.onyx.drift.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*") // প্রোডাকশনে নির্দিষ্ট ডোমেইন সেট করবেন
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final String UPLOAD_DIR = "uploads/";

    // ১. গ্লোবাল ফিড: সব পোস্ট দেখানোর জন্য
    @GetMapping
    public List<Post> getAllPosts() {
        return postService.getAllPosts();
    }

    // ২. পার্সোনালাইজড টাইমলাইন
    @GetMapping("/timeline")
    public List<Post> getUserTimeline(@RequestParam String username) {
        return postService.getTimeline(username);
    }

    // ৩. ট্রেন্ডিং হ্যাশট্যাগ এপিআই
    @GetMapping("/trending")
    public List<String> getTrendingHashtags() {
        return postService.getTrendingTags();
    }

    // ৪. নতুন পোস্ট ক্রিয়েট (Flexible Handling)
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam(value = "text", required = false) String content,
            @RequestParam(value = "authorName", required = false) String username,
            @RequestParam(value = "authorAvatar", required = false) String authorAvatar,
            @RequestParam(value = "media", required = false) MultipartFile file,
            @RequestBody(required = false) Post jsonPost) {

        try {
            Post post = new Post();

            // কন্ডিশন: যদি ডেটা JSON হিসেবে আসে (Raw JSON)
            if (jsonPost != null) {
                post = jsonPost;
            } 
            // কন্ডিশন: যদি ডেটা FormData হিসেবে আসে (With File)
            else {
                post.setContent(content);
                post.setUsername(username);
                post.setAuthorAvatar(authorAvatar);
            }

            // ফাইল হ্যান্ডলিং
            if (file != null && !file.isEmpty()) {
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), uploadPath.resolve(fileName));

                post.setMediaUrl("/uploads/" + fileName);
                String contentType = file.getContentType();
                post.setMediaType(contentType != null && contentType.startsWith("video") ? "video" : "image");
            }

            // যদি কন্টেন্ট এবং ইউজারনেম দুটোই মিসিং থাকে তবে Bad Request (400)
            if (post.getContent() == null && post.getUsername() == null) {
                return ResponseEntity.badRequest().body("Error: Content and Username are required.");
            }

            Post savedPost = postService.createPost(post);

            // WebSocket ব্রডকাস্ট
            messagingTemplate.convertAndSend("/topic/posts", savedPost);

            return ResponseEntity.ok(savedPost);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File Upload Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Post Error: " + e.getMessage());
        }
    }
}