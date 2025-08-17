package com.factlab.auth.dto;

import java.time.LocalDateTime;

public class UserLoginResponseDto {
    
    private Long id;
    private String email;
    private String nickname;
    private LocalDateTime loginTime;
    
    // 기본 생성자
    public UserLoginResponseDto() {}
    
    // 전체 생성자
    public UserLoginResponseDto(Long id, String email, String nickname, LocalDateTime loginTime) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.loginTime = loginTime;
    }
    
    // Getter & Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    
    public LocalDateTime getLoginTime() {
        return loginTime;
    }
    
    public void setLoginTime(LocalDateTime loginTime) {
        this.loginTime = loginTime;
    }
}