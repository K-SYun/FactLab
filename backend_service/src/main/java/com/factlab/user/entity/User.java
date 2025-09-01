package com.factlab.user.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Email
    @Column(unique = true, nullable = false)
    private String email;
    
    @NotBlank
    @Size(min = 2, max = 50)
    @Column(nullable = false)
    private String nickname;
    
    @Size(min = 8)
    @Column(nullable = true) // 소셜 로그인 사용자는 비밀번호가 없을 수 있음
    private String password;
    
    @Column(name = "user_level", nullable = false)
    private Integer level = 1;
    
    @Column(name = "activity_score", nullable = false)
    private Integer activityScore = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 소셜 로그인 필드 추가
    @Enumerated(EnumType.STRING)
    @Column(name = "registration_method", nullable = false)
    private RegistrationMethod registrationMethod = RegistrationMethod.EMAIL;

    @Column(name = "social_provider_id")
    private String socialProviderId;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    public enum UserStatus {
        ACTIVE, WARNED, SUSPENDED, BANNED, INACTIVE
    }

    public enum UserRole {
        USER, ADMIN, MODERATOR
    }

    public enum RegistrationMethod {
        EMAIL, GOOGLE, NAVER, KAKAO
    }

    // 기본 생성자
    public User() {}

    // 생성자 (일반 회원가입용)
    public User(String email, String nickname, String password) {
        this.email = email;
        this.nickname = nickname;
        this.password = password;
    }

    // 생성자 (소셜 로그인용)
    public User(String email, String nickname, RegistrationMethod registrationMethod, String socialProviderId) {
        this.email = email;
        this.nickname = nickname;
        this.password = null;
        this.registrationMethod = registrationMethod;
        this.socialProviderId = socialProviderId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    public Integer getActivityScore() { return activityScore; }
    public void setActivityScore(Integer activityScore) { this.activityScore = activityScore; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public RegistrationMethod getRegistrationMethod() { return registrationMethod; }
    public void setRegistrationMethod(RegistrationMethod registrationMethod) { this.registrationMethod = registrationMethod; }

    public String getSocialProviderId() { return socialProviderId; }
    public void setSocialProviderId(String socialProviderId) { this.socialProviderId = socialProviderId; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}