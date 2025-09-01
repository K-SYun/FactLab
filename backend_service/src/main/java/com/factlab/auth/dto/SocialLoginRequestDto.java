package com.factlab.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SocialLoginRequestDto {
    
    @NotNull
    private String provider; // GOOGLE, NAVER, KAKAO
    
    @NotBlank
    private String code; // Authorization code from social provider
    
    private String state; // Optional state parameter for NAVER
    
    public SocialLoginRequestDto() {}
    
    public SocialLoginRequestDto(String provider, String code) {
        this.provider = provider;
        this.code = code;
    }
    
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}