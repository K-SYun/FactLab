package com.factlab.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EmailVerificationDto {
    
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;
    
    @NotBlank(message = "인증 코드는 필수입니다")
    @Size(min = 6, max = 6, message = "인증 코드는 6자리여야 합니다")
    private String code;
    
    // 기본 생성자
    public EmailVerificationDto() {}
    
    // 생성자
    public EmailVerificationDto(String email, String code) {
        this.email = email;
        this.code = code;
    }
    
    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}