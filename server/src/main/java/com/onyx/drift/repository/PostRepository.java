package com.onyx.drift.repository;

import com.onyx.drift.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // ১. সব পোস্ট তৈরির সময় অনুযায়ী ক্রমানুসারে (Descending) পাওয়ার জন্য
    List<Post> findAllByOrderByCreatedAtDesc();

    // ২. নির্দিষ্ট একজন ইউজারের সব পোস্ট পাওয়ার জন্য
    List<Post> findByUsernameOrderByCreatedAtDesc(String username);

    // ৩. হোম ফিডের জন্য: যাদের ফলো করা হয়েছে তাদের সবার পোস্ট একসাথে পাওয়ার জন্য
    // আপনার PostService-এ এই মেথডটিই এরর দিচ্ছিল
    List<Post> findByUsernameInOrderByCreatedAtDesc(List<String> usernames);

    // ৪. সার্চ করার জন্য (অপশনাল কিন্তু দরকারি)
    List<Post> findByContentContainingIgnoreCase(String keyword);
}