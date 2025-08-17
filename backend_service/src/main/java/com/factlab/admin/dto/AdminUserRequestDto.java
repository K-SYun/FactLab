package com.factlab.admin.dto;

import com.factlab.admin.entity.AdminUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdminUserRequestDto {
    
    @NotBlank(message = "사용자명은 필수입니다")
    private String username;
    
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;
    
    private String password; // 수정 시에는 선택사항
    
    @NotNull(message = "역할은 필수입니다")
    private String role;
    
    @NotNull(message = "활성화 상태는 필수입니다")
    private Boolean isActive;
    
    // Constructors
    public AdminUserRequestDto() {}
    
    public AdminUserRequestDto(String username, String email, String password, String role, Boolean isActive) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.isActive = isActive;
    }
    
    // Convert to Entity
    public AdminUser toEntity() {
        AdminUser adminUser = new AdminUser();
        adminUser.setUsername(this.username);
        adminUser.setEmail(this.email);
        if (this.password != null && !this.password.isEmpty()) {
            adminUser.setPassword(this.password);
        }
        adminUser.setRole(AdminUser.AdminRole.valueOf(this.role));
        adminUser.setIsActive(this.isActive);
        return adminUser;
    }
    
    // Getters and Setters
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
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
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
}