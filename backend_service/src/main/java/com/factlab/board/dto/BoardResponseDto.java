package com.factlab.board.dto;

import java.time.LocalDateTime;

public class BoardResponseDto {
    
    private Long id;
    private String name;
    private String description;
    private String category;
    private Long categoryId;
    private String categoryName;
    private Boolean isActive;
    private Integer displayOrder;
    private Boolean allowAnonymous;
    private Boolean requireApproval;
    private Integer postCount;
    private LocalDateTime lastPostAt;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public BoardResponseDto() {}
    
    public BoardResponseDto(Long id, String name, String description, String category, 
                           Boolean isActive, Integer displayOrder, Integer postCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.isActive = isActive;
        this.displayOrder = displayOrder;
        this.postCount = postCount;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Integer getDisplayOrder() {
        return displayOrder;
    }
    
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
    
    public Boolean getAllowAnonymous() {
        return allowAnonymous;
    }
    
    public void setAllowAnonymous(Boolean allowAnonymous) {
        this.allowAnonymous = allowAnonymous;
    }
    
    public Boolean getRequireApproval() {
        return requireApproval;
    }
    
    public void setRequireApproval(Boolean requireApproval) {
        this.requireApproval = requireApproval;
    }
    
    public Integer getPostCount() {
        return postCount;
    }
    
    public void setPostCount(Integer postCount) {
        this.postCount = postCount;
    }
    
    public LocalDateTime getLastPostAt() {
        return lastPostAt;
    }
    
    public void setLastPostAt(LocalDateTime lastPostAt) {
        this.lastPostAt = lastPostAt;
    }
    
    public String getCreatedByUsername() {
        return createdByUsername;
    }
    
    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Long getCategoryId() {
        return categoryId;
    }
    
    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
    
    public String getCategoryName() {
        return categoryName;
    }
    
    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }
}
