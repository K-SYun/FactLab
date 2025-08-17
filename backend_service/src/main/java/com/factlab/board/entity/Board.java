package com.factlab.board.entity;

import com.factlab.admin.entity.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Entity
@Table(name = "boards")
public class Board {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, length = 50)
    private String category;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnore
    private BoardCategory boardCategory;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;
    
    @Column(name = "allow_anonymous", nullable = false)
    private Boolean allowAnonymous = false;
    
    @Column(name = "require_approval", nullable = false)
    private Boolean requireApproval = false;
    
    @Column(name = "post_count", nullable = false)
    private Integer postCount = 0;
    
    @Column(name = "last_post_at")
    private LocalDateTime lastPostAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public Board() {}
    
    public Board(String name, String description, String category) {
        this.name = name;
        this.description = description;
        this.category = category;
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
    
    public AdminUser getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(AdminUser createdBy) {
        this.createdBy = createdBy;
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
    
    public BoardCategory getBoardCategory() {
        return boardCategory;
    }
    
    public void setBoardCategory(BoardCategory boardCategory) {
        this.boardCategory = boardCategory;
    }
}
