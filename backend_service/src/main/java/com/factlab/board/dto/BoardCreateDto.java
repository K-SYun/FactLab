package com.factlab.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BoardCreateDto {
    
    @NotBlank(message = "게시판 이름은 필수입니다")
    @Size(max = 100, message = "게시판 이름은 100자를 초과할 수 없습니다")
    private String name;
    
    @Size(max = 1000, message = "게시판 설명은 1000자를 초과할 수 없습니다")
    private String description;
    
    @Size(max = 50, message = "카테고리는 50자를 초과할 수 없습니다")
    private String category;
    
    @NotNull(message = "카테고리 ID는 필수입니다")
    private Long categoryId;
    
    @NotNull(message = "표시 순서는 필수입니다")
    private Integer displayOrder;
    
    private Boolean allowAnonymous = false;
    
    private Boolean requireApproval = false;
    
    // Constructors
    public BoardCreateDto() {}
    
    public BoardCreateDto(String name, String description, String category, Integer displayOrder) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.displayOrder = displayOrder;
    }
    
    // Getters and Setters
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
    
    public Long getCategoryId() {
        return categoryId;
    }
    
    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
}
