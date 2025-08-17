package com.factlab.admin.dto;

public class AdminLoginResponseDto {
    
    private String token;
    private AdminUserDto user;
    
    // Constructors
    public AdminLoginResponseDto() {}
    
    public AdminLoginResponseDto(String token, AdminUserDto user) {
        this.token = token;
        this.user = user;
    }
    
    // Getters and Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public AdminUserDto getUser() {
        return user;
    }
    
    public void setUser(AdminUserDto user) {
        this.user = user;
    }
}