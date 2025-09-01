package com.factlab.admin.service;

import com.factlab.user.entity.User;
import com.factlab.user.entity.User.UserStatus;
import com.factlab.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;
    
    public long getUserCount() {
        System.out.println("=== getUserCount() 호출됨 ===");
        long count = userRepository.count();
        System.out.println("=== count: " + count + " ===");
        return count;
    }

    public Page<User> getUsers(Pageable pageable, String status, String keyword) {
        try {
            // 디버그용: 전체 사용자 수 확인
            long totalCount = userRepository.count();
            System.out.println("=== DEBUG: Total user count = " + totalCount + " ===");
            
            // 간단하게 전체 사용자 조회부터 시작
            if (status == null && (keyword == null || keyword.trim().isEmpty())) {
                Page<User> result = userRepository.findAll(pageable);
                System.out.println("=== DEBUG: findAll result size = " + result.getTotalElements() + " ===");
                return result;
            }
            
            UserStatus userStatus = null;
            if (status != null && !status.trim().isEmpty()) {
                try {
                    userStatus = UserStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    // 잘못된 status 값인 경우 무시하고 전체 조회
                }
            }
            
            return userRepository.findUsersWithFilters(userStatus, keyword, pageable);
        } catch (Exception e) {
            throw new RuntimeException("사용자 목록 조회 중 오류 발생: " + e.getMessage(), e);
        }
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