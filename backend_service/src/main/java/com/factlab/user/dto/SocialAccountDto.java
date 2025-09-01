package com.factlab.user.dto;

import com.factlab.user.entity.UserSocialAccount;

import java.time.LocalDateTime;

public class SocialAccountDto {
    
    private Long id;
    private String provider;
    private String providerUserId;
    private String providerEmail;
    private String providerName;
    private String providerProfileImage;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public SocialAccountDto() {}
    
    public SocialAccountDto(UserSocialAccount socialAccount) {
        this.id = socialAccount.getId();
        this.provider = socialAccount.getProvider().name();
        this.providerUserId = socialAccount.getProviderUserId();
        this.providerEmail = socialAccount.getProviderEmail();
        this.providerName = socialAccount.getProviderName();
        this.providerProfileImage = socialAccount.getProviderProfileImage();
        this.isActive = socialAccount.getIsActive();
        this.createdAt = socialAccount.getCreatedAt();
        this.updatedAt = socialAccount.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    
    public String getProviderUserId() { return providerUserId; }
    public void setProviderUserId(String providerUserId) { this.providerUserId = providerUserId; }
    
    public String getProviderEmail() { return providerEmail; }
    public void setProviderEmail(String providerEmail) { this.providerEmail = providerEmail; }
    
    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    
    public String getProviderProfileImage() { return providerProfileImage; }
    public void setProviderProfileImage(String providerProfileImage) { this.providerProfileImage = providerProfileImage; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}