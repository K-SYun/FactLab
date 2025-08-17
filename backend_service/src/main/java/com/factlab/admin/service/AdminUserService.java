package com.factlab.admin.service;

import com.factlab.user.entity.User;
import com.factlab.user.entity.User.UserStatus;
import com.factlab.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
@Transactional
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    public Page<User> getUsers(Pageable pageable, String status, String keyword) {
        // 실제로는 복잡한 조건부 쿼리 필요
        // 임시로 빈 페이지 반환
        return new PageImpl<>(new ArrayList<>(), pageable, 0);
    }

    public User getUserDetails(Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            return userOptional.get();
        } else {
            throw new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        }
    }

    public void suspendUser(Long userId, String reason, Integer days) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.SUSPENDED);
            // 실제로는 suspension_until, suspension_reason 필드에 저장
            userRepository.save(user);
        } else {
            throw new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        }
    }

    public void unsuspendUser(Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
        } else {
            throw new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        }
    }

    public void banUser(Long userId, String reason) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.BANNED);
            // 실제로는 ban_reason 필드에 저장
            userRepository.save(user);
        } else {
            throw new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        }
    }

    public Object getUserStatistics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long bannedUsers = userRepository.countByStatus(UserStatus.BANNED);
        
        // 최근 24시간 활성 사용자
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        long recentActiveUsers = userRepository.countActiveUsers(yesterday);

        return new Object() {
            public final long total = totalUsers;
            public final long active = activeUsers;
            public final long suspended = suspendedUsers;
            public final long banned = bannedUsers;
            public final long recentActive = recentActiveUsers;
            public final double activeRate = totalUsers > 0 ? (double) activeUsers / totalUsers * 100 : 0;
        };
    }
}