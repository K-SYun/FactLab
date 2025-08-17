package com.factlab.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BoardCategoryDto {
    
    private Long id;
    
    @NotBlank(message = "카테고리 이름은 필수입니다")
    @Size(max = 50, message = "카테고리 이름은 50자를 초과할 수 없습니다")
    private String name;
    
    @Size(max = 255, message = "카테고리 설명은 255자를 초과할 수 없습니다")
    private String description;
    
    @NotNull(message = "표시 순서는 필수입니다")
    private Integer displayOrder;
    
    private Boolean isActive = true;
    
    private Integer boardCount = 0;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Constructors
    public BoardCategoryDto() {}
    
    public BoardCategoryDto(String name, String description, Integer displayOrder) {
        this.name = name;
        this.description = description;
        this.displayOrder = displayOrder;
    }
    
    public BoardCategoryDto(Long id, String name, String description, Integer displayOrder, 
                           Boolean isActive, Integer boardCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.displayOrder = displayOrder;
        this.isActive = isActive;
        this.boardCount = boardCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
    
    public Integer getDisplayOrder() {
        return displayOrder;
    }
    
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Integer getBoardCount() {
        return boardCount;
    }
    
    public void setBoardCount(Integer boardCount) {
        this.boardCount = boardCount;
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
}