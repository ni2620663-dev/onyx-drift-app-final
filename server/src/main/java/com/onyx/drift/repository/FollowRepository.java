package com.onyx.drift.repository;

import com.onyx.drift.model.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    List<Follow> findByFollowerUsername(String followerUsername);
    void deleteByFollowerUsernameAndFollowingUsername(String follower, String following);
}