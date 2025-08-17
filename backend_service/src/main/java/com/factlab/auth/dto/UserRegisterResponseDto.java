package com.factlab.auth.dto;

import java.time.LocalDateTime;

public class UserRegisterResponseDto {
    
    private Long id;
    private String email;
    private String nickname;
    private LocalDateTime createdAt;
    
    // 기본 생성자
    public UserRegisterResponseDto() {}
    
    // 생성자
    public UserRegisterResponseDto(Long id, String email, String nickname, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}