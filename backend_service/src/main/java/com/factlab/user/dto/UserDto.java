package com.factlab.user.dto;

import com.factlab.user.entity.User;
import java.time.LocalDateTime;

public class UserDto {
    
    private Long id;
    private String email;
    private String nickname;
    private Integer level;
    private Integer activityScore;
    private User.UserStatus status;
    private User.UserRole role;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 추가 통계 정보
    private Integer postsCount;
    private Integer commentsCount;
    private Integer reportsCount;
    
    // 기본 생성자
    public UserDto() {}
    
    // 전체 생성자
    public UserDto(Long id, String email, String nickname, Integer level, Integer activityScore,
                   User.UserStatus status, User.UserRole role, LocalDateTime lastLoginAt,
                   LocalDateTime createdAt, LocalDateTime updatedAt, Integer postsCount,
                   Integer commentsCount, Integer reportsCount) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.level = level;
        this.activityScore = activityScore;
        this.status = status;
        this.role = role;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.postsCount = postsCount;
        this.commentsCount = commentsCount;
        this.reportsCount = reportsCount;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    
    public Integer getActivityScore() { return activityScore; }
    public void setActivityScore(Integer activityScore) { this.activityScore = activityScore; }
    
    public User.UserStatus getStatus() { return status; }
    public void setStatus(User.UserStatus status) { this.status = status; }
    
    public User.UserRole getRole() { return role; }
    public void setRole(User.UserRole role) { this.role = role; }
    
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Integer getPostsCount() { return postsCount; }
    public void setPostsCount(Integer postsCount) { this.postsCount = postsCount; }
    
    public Integer getCommentsCount() { return commentsCount; }
    public void setCommentsCount(Integer commentsCount) { this.commentsCount = commentsCount; }
    
    public Integer getReportsCount() { return reportsCount; }
    public void setReportsCount(Integer reportsCount) { this.reportsCount = reportsCount; }
    
    public static UserDto fromEntity(User user) {
        return new UserDto(
            user.getId(),
            user.getEmail(),
            user.getNickname(),
            user.getLevel(),
            user.getActivityScore(),
            user.getStatus(),
            user.getRole(),
            user.getLastLoginAt(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            0, // postsCount - 별도 조회 필요
            0, // commentsCount - 별도 조회 필요
            0  // reportsCount - 별도 조회 필요
        );
    }
    
    public static UserDto fromEntityWithStats(User user, int postsCount, int commentsCount, int reportsCount) {
        return new UserDto(
            user.getId(),
            user.getEmail(),
            user.getNickname(),
            user.getLevel(),
            user.getActivityScore(),
            user.getStatus(),
            user.getRole(),
            user.getLastLoginAt(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            postsCount,
            commentsCount,
            reportsCount
        );
    }
}