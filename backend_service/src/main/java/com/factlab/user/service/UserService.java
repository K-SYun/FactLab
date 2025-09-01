package com.factlab.user.service;

import com.factlab.user.dto.UserDto;
import com.factlab.user.dto.UserUpdateDto;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;
import com.factlab.common.dto.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * 관리자용 사용자 목록 조회 (필터링, 페이징)
     */
    public ApiResponse<Page<UserDto>> getUsers(User.UserStatus status, String search, Pageable pageable) {
        try {
            Page<User> users = userRepository.findUsersWithFilters(status, search, pageable);
            
            // UserDto로 변환하면서 통계 정보 포함
            Page<UserDto> userDtos = users.map(user -> {
                // TODO: 실제로는 posts, comments, reports 개수를 별도 조회해야 함
                // 현재는 더미 데이터로 설정
                int postsCount = (int) (Math.random() * 100);
                int commentsCount = (int) (Math.random() * 500);
                int reportsCount = (int) (Math.random() * 10);
                
                return UserDto.fromEntityWithStats(user, postsCount, commentsCount, reportsCount);
            });
            
            return ApiResponse.success(userDtos);
        } catch (Exception e) {
            return ApiResponse.error("사용자 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자 상세 조회
     */
    public ApiResponse<UserDto> getUserById(Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("사용자를 찾을 수 없습니다.");
            }
            
            User user = userOpt.get();
            // TODO: 실제 통계 정보 조회
            int postsCount = (int) (Math.random() * 100);
            int commentsCount = (int) (Math.random() * 500);
            int reportsCount = (int) (Math.random() * 10);
            
            UserDto userDto = UserDto.fromEntityWithStats(user, postsCount, commentsCount, reportsCount);
            return ApiResponse.success(userDto);
        } catch (Exception e) {
            return ApiResponse.error("사용자 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자 정보 수정 (관리자용)
     */
    public ApiResponse<UserDto> updateUser(Long id, UserUpdateDto updateDto) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("사용자를 찾을 수 없습니다.");
            }
            
            User user = userOpt.get();
            
            // 업데이트할 필드만 수정
            if (updateDto.getNickname() != null && !updateDto.getNickname().trim().isEmpty()) {
                // 닉네임 중복 검사
                if (!user.getNickname().equals(updateDto.getNickname()) && 
                    userRepository.existsByNickname(updateDto.getNickname())) {
                    return ApiResponse.error("이미 사용 중인 닉네임입니다.");
                }
                user.setNickname(updateDto.getNickname());
            }
            
            if (updateDto.getLevel() != null) {
                user.setLevel(updateDto.getLevel());
            }
            
            if (updateDto.getStatus() != null) {
                user.setStatus(updateDto.getStatus());
            }
            
            if (updateDto.getRole() != null) {
                user.setRole(updateDto.getRole());
            }
            
            User savedUser = userRepository.save(user);
            
            // TODO: 실제 통계 정보 조회
            int postsCount = (int) (Math.random() * 100);
            int commentsCount = (int) (Math.random() * 500);
            int reportsCount = (int) (Math.random() * 10);
            
            UserDto userDto = UserDto.fromEntityWithStats(savedUser, postsCount, commentsCount, reportsCount);
            return ApiResponse.success(userDto);
        } catch (Exception e) {
            return ApiResponse.error("사용자 정보 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자 삭제 (soft delete)
     */
    public ApiResponse<Void> deleteUser(Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("사용자를 찾을 수 없습니다.");
            }
            
            User user = userOpt.get();
            user.setStatus(User.UserStatus.INACTIVE); // 상태를 INACTIVE(삭제)로 변경
            userRepository.save(user);
            
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error("사용자 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 여러 사용자 상태 일괄 수정
     */
    public ApiResponse<Void> updateUsersStatus(List<Long> userIds, User.UserStatus status) {
        try {
            List<User> users = userRepository.findByIdIn(userIds);
            if (users.isEmpty()) {
                return ApiResponse.error("해당하는 사용자가 없습니다.");
            }
            
            users.forEach(user -> user.setStatus(status));
            userRepository.saveAll(users);
            
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error("사용자 상태 일괄 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자 통계 조회
     */
    public ApiResponse<UserStatsDto> getUserStats() {
        try {
            long totalUsers = userRepository.count();
            long activeUsers = userRepository.countByStatus(User.UserStatus.ACTIVE);
            long warnedUsers = userRepository.countByStatus(User.UserStatus.WARNED);
            long suspendedUsers = userRepository.countByStatus(User.UserStatus.SUSPENDED);
            long bannedUsers = userRepository.countByStatus(User.UserStatus.BANNED);
            
            // 30일 전 기준으로 최근 로그인 사용자 수
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            long recentActiveUsers = userRepository.countByLastLoginAtAfter(thirtyDaysAgo);
            
            // 이번 달 신규 가입자 수
            LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            long newUsersThisMonth = userRepository.countByCreatedAtAfter(startOfMonth);
            
            UserStatsDto stats = new UserStatsDto(
                totalUsers, activeUsers, warnedUsers, suspendedUsers, bannedUsers,
                recentActiveUsers, newUsersThisMonth
            );
            
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("사용자 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 내부 통계 DTO 클래스
    public static class UserStatsDto {
        private long totalUsers;
        private long activeUsers;
        private long warnedUsers;
        private long suspendedUsers;
        private long bannedUsers;
        private long recentActiveUsers;
        private long newUsersThisMonth;
        
        public UserStatsDto(long totalUsers, long activeUsers, long warnedUsers, 
                           long suspendedUsers, long bannedUsers, long recentActiveUsers, 
                           long newUsersThisMonth) {
            this.totalUsers = totalUsers;
            this.activeUsers = activeUsers;
            this.warnedUsers = warnedUsers;
            this.suspendedUsers = suspendedUsers;
            this.bannedUsers = bannedUsers;
            this.recentActiveUsers = recentActiveUsers;
            this.newUsersThisMonth = newUsersThisMonth;
        }
        
        // Getters
        public long getTotalUsers() { return totalUsers; }
        public long getActiveUsers() { return activeUsers; }
        public long getWarnedUsers() { return warnedUsers; }
        public long getSuspendedUsers() { return suspendedUsers; }
        public long getBannedUsers() { return bannedUsers; }
        public long getRecentActiveUsers() { return recentActiveUsers; }
        public long getNewUsersThisMonth() { return newUsersThisMonth; }
    }
}