package com.factlab.admin.dto;

import com.factlab.admin.entity.AdminUser;
import java.time.LocalDateTime;

public class AdminUserDto {
    
    private Long id;
    private String username;
    private String email;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    
    // Constructors
    public AdminUserDto() {}
    
    public AdminUserDto(AdminUser adminUser) {
        this.id = adminUser.getId();
        this.username = adminUser.getUsername();
        this.email = adminUser.getEmail();
        this.role = adminUser.getRole().name();
        this.isActive = adminUser.getIsActive();
        this.createdAt = adminUser.getCreatedAt();
        this.lastLogin = adminUser.getLastLogin();
    }
    
    // Static factory method
    public static AdminUserDto from(AdminUser adminUser) {
        return new AdminUserDto(adminUser);
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getLastLogin() {
        return lastLogin;
    }
    
    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }
}