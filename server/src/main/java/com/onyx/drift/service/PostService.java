package com.onyx.drift.service;

import com.onyx.drift.model.Post;
import com.onyx.drift.model.Follow;
import com.onyx.drift.model.Notification;
import com.onyx.drift.repository.PostRepository;
import com.onyx.drift.repository.FollowRepository;
import com.onyx.drift.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // [Point 5] Kafka Producer Service ইনজেক্ট করা
    @Autowired
    private KafkaProducerService kafkaProducerService;

    // হ্যাশট্যাগ স্টোর করার ম্যাপ (Point 3 - Trends)
    private Map<String, Integer> trendingHashtags = new HashMap<>();

    /**
     * নতুন পোস্ট তৈরি করা (Point 3, 4, 7, 8)
     */
    @CacheEvict(value = "posts", allEntries = true)
    public Post createPost(Post post) {
        // ১. পোস্টের টেক্সট থেকে হ্যাশট্যাগ বের করা
        extractAndStoreHashtags(post.getContent());
        
        // ২. ডাটাবেসে পোস্ট সেভ করা
        return postRepository.save(post);
    }

    /**
     * গ্লোবাল ফিড: সব পোস্ট দেখাবে (Point 4 - Redis Cache)
     */
    @Cacheable(value = "posts")
    public List<Post> getAllPosts() {
        System.out.println("--- Fetching all posts from MySQL Database ---");
        return postRepository.findAll();
    }

    /**
     * টুইটার টাইমলাইন লজিক (Point 8 - Feed System)
     */
    public List<Post> getTimeline(String currentUsername) {
        List<String> followingList = followRepository.findByFollowerUsername(currentUsername)
                .stream()
                .map(Follow::getFollowingUsername)
                .collect(Collectors.toList());
        
        followingList.add(currentUsername); 
        return postRepository.findByUsernameInOrderByCreatedAtDesc(followingList);
    }

    /**
     * ট্রেন্ডিং হ্যাশট্যাগ লিস্ট (Point 3 - Trends)
     */
    public List<String> getTrendingTags() {
        return trendingHashtags.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * রিয়েল-টাইম নোটিফিকেশন পাঠানো (Point 5 & 6)
     * এখন এটি Kafka এবং WebSocket উভয়ই ব্যবহার করে।
     */
    public void sendNotification(String sender, String recipient, String type) {
        Notification notification = new Notification();
        notification.setSender(sender);
        notification.setRecipient(recipient);
        notification.setType(type);
        
        String message = "";
        if ("FOLLOW".equals(type)) {
            message = sender + " started following you!";
        } else if ("LIKE".equals(type)) {
            message = sender + " liked your post!";
        }
        notification.setMessage(message);

        // ১. [Point 5] Kafka-তে ইভেন্ট পাঠানো (Asynchronous Processing)
        kafkaProducerService.sendMessage("notification-topic", message + " to: " + recipient);

        // ২. ডাটাবেসে সেভ করা (Persistence)
        notificationRepository.save(notification);

        // ৩. [Point 6] রিয়েল-টাইমে পাঠানো (WebSocket)
        messagingTemplate.convertAndSendToUser(recipient, "/topic/notifications", notification);
    }

    // হ্যাশট্যাগ খুঁজে বের করার ইন্টারনাল লজিক
    private void extractAndStoreHashtags(String text) {
        if (text == null) return;
        Pattern pattern = Pattern.compile("#(\\w+)");
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            String hashtag = matcher.group(1).toLowerCase();
            trendingHashtags.put(hashtag, trendingHashtags.getOrDefault(hashtag, 0) + 1);
        }
    }
}