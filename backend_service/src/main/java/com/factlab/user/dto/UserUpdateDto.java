package com.factlab.user.dto;

import com.factlab.user.entity.User;

public class UserUpdateDto {
    
    private String nickname;
    private Integer level;
    private User.UserStatus status;
    private User.UserRole role;
    private String note; // 관리자 메모
    
    // 기본 생성자
    public UserUpdateDto() {}
    
    // 전체 생성자
    public UserUpdateDto(String nickname, Integer level, User.UserStatus status, User.UserRole role, String note) {
        this.nickname = nickname;
        this.level = level;
        this.status = status;
        this.role = role;
        this.note = note;
    }
    
    // Getters and Setters
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    
    public User.UserStatus getStatus() { return status; }
    public void setStatus(User.UserStatus status) { this.status = status; }
    
    public User.UserRole getRole() { return role; }
    public void setRole(User.UserRole role) { this.role = role; }
    
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}